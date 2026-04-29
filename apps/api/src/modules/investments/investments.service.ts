import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { DB, DrizzleDB } from '../../database/database.module';
import { investments, shares, wallets, walletTransactions, depositFunds } from '../../database/schema';
import {
  Investment,
  InvestmentStatus,
  InvestmentDistribution,
  CreateInvestmentDto,
  UpdateInvestmentDto,
} from '@fundy/shared';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class InvestmentsService {
  constructor(
    @Inject(DB) private readonly db: DrizzleDB,
    private readonly walletService: WalletService,
  ) {}

  async findByFund(fundId: string): Promise<Investment[]> {
    const rows = await this.db
      .select()
      .from(investments)
      .where(eq(investments.fundId, fundId));
    return rows.map(this.mapInvestment);
  }

  async findOne(id: string): Promise<Investment> {
    const [inv] = await this.db
      .select()
      .from(investments)
      .where(eq(investments.id, id))
      .limit(1);
    if (!inv) throw new NotFoundException('Investment not found');
    return this.mapInvestment(inv);
  }

  async create(fundId: string, dto: CreateInvestmentDto, createdBy: string): Promise<Investment> {
    const [fund] = await this.db
      .select()
      .from(depositFunds)
      .where(eq(depositFunds.id, fundId))
      .limit(1);
    if (!fund) throw new NotFoundException('Fund not found');

    const [inv] = await this.db
      .insert(investments)
      .values({
        fundId,
        name: dto.name,
        description: dto.description ?? null,
        investedAmount: dto.investedAmount,
        expectedReturn: dto.expectedReturn ?? null,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        createdBy,
      })
      .returning();

    return this.mapInvestment(inv);
  }

  async update(id: string, dto: UpdateInvestmentDto, actorId: string): Promise<Investment> {
    const [inv] = await this.db
      .select()
      .from(investments)
      .where(eq(investments.id, id))
      .limit(1);

    if (!inv) throw new NotFoundException('Investment not found');

    if (
      inv.status === InvestmentStatus.COMPLETED ||
      inv.status === InvestmentStatus.CANCELLED
    ) {
      throw new BadRequestException('Cannot update a completed or cancelled investment');
    }

    if (dto.status === InvestmentStatus.COMPLETED) {
      if (!dto.returnAmount && dto.returnAmount !== 0) {
        throw new BadRequestException('returnAmount is required when completing an investment');
      }
      await this.distributeProfit(inv, dto.returnAmount, actorId);
    }

    const updates: Partial<typeof investments.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (dto.name) updates.name = dto.name;
    if (dto.description !== undefined) updates.description = dto.description ?? null;
    if (dto.status) updates.status = dto.status;
    if (dto.returnAmount !== undefined) updates.returnAmount = dto.returnAmount;
    if (dto.startDate) updates.startDate = new Date(dto.startDate);
    if (dto.endDate) updates.endDate = new Date(dto.endDate);
    if (dto.notes !== undefined) updates.notes = dto.notes ?? null;

    const [updated] = await this.db
      .update(investments)
      .set(updates)
      .where(eq(investments.id, id))
      .returning();

    return this.mapInvestment(updated);
  }

  async getDistribution(id: string): Promise<InvestmentDistribution> {
    const [inv] = await this.db
      .select()
      .from(investments)
      .where(eq(investments.id, id))
      .limit(1);
    if (!inv) throw new NotFoundException('Investment not found');

    const memberShares = await this.db
      .select({
        userId: shares.userId,
        total: sql<number>`sum(${shares.quantity})`.as('total'),
      })
      .from(shares)
      .where(and(eq(shares.fundId, inv.fundId), eq(shares.status, 'confirmed')))
      .groupBy(shares.userId);

    const totalShares = memberShares.reduce((s, m) => s + m.total, 0);
    const profit = (inv.returnAmount ?? 0) - inv.investedAmount;

    let remainder = profit;
    const distributions = memberShares.map((m) => {
      const amount = Math.floor((profit * m.total) / totalShares);
      remainder -= amount;
      return { userId: m.userId, userName: '', userEmail: '', shares: m.total, sharePercent: 0, amount };
    });

    // Add rounding remainder to largest shareholder
    if (remainder !== 0 && distributions.length > 0) {
      const largest = distributions.reduce((a, b) => (a.shares > b.shares ? a : b));
      largest.amount += remainder;
    }

    return { investmentId: id, profit, distributions };
  }

  private async distributeProfit(
    inv: typeof investments.$inferSelect,
    returnAmount: number,
    actorId: string,
  ): Promise<void> {
    const memberShares = await this.db
      .select({
        userId: shares.userId,
        total: sql<number>`sum(${shares.quantity})`.as('total'),
      })
      .from(shares)
      .where(and(eq(shares.fundId, inv.fundId), eq(shares.status, 'confirmed')))
      .groupBy(shares.userId);

    if (memberShares.length === 0) return;

    const totalShares = memberShares.reduce((s, m) => s + m.total, 0);
    const profit = returnAmount - inv.investedAmount;
    const isLoss = profit < 0;

    let remainder = profit;
    const credits: { userId: string; amount: number }[] = memberShares.map((m) => {
      const amount = Math.floor((profit * m.total) / totalShares);
      remainder -= amount;
      return { userId: m.userId, amount };
    });
    if (remainder !== 0 && credits.length > 0) {
      const largest = credits.reduce((a, b) =>
        (memberShares.find((m) => m.userId === a.userId)?.total ?? 0) >=
        (memberShares.find((m) => m.userId === b.userId)?.total ?? 0)
          ? a
          : b,
      );
      largest.amount += remainder;
    }

    // Atomic: ensure all wallets exist then create transactions
    for (const credit of credits) {
      await this.walletService.ensureWallet(credit.userId);
    }

    await this.db.transaction(async (tx) => {
      for (const credit of credits) {
        const [wallet] = await tx
          .select()
          .from(wallets)
          .where(eq(wallets.userId, credit.userId))
          .limit(1);

        const type = isLoss ? 'investment_loss' : 'investment_profit';
        const direction = isLoss ? 'debit' : 'credit';
        const absAmount = Math.abs(credit.amount);

        await tx.insert(walletTransactions).values({
          walletId: wallet.id,
          type,
          direction,
          amount: absAmount,
          status: 'confirmed',
          sourceType: 'investment_distribution',
          sourceId: inv.id,
          requestedBy: actorId,
          confirmedBy: actorId,
          confirmedAt: new Date(),
          notes: `Auto-distributed from investment: ${inv.name}`,
        });

        const balanceDelta = isLoss ? -absAmount : absAmount;
        await tx
          .update(wallets)
          .set({ balance: sql`${wallets.balance} + ${balanceDelta}`, updatedAt: new Date() })
          .where(eq(wallets.id, wallet.id));
      }
    });
  }

  private mapInvestment(i: typeof investments.$inferSelect): Investment {
    return {
      id: i.id,
      fundId: i.fundId,
      name: i.name,
      description: i.description,
      investedAmount: i.investedAmount,
      expectedReturn: i.expectedReturn,
      returnAmount: i.returnAmount,
      status: i.status as InvestmentStatus,
      startDate: i.startDate?.toISOString() ?? null,
      endDate: i.endDate?.toISOString() ?? null,
      createdBy: i.createdBy,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
    };
  }
}
