import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { eq, and, sql } from "drizzle-orm";
import { DB, DrizzleDB } from "../../database/database.module";
import { depositFunds, shares, users } from "../../database/schema";
import {
  DepositFund,
  FundDetail,
  FundStatus,
  ShareStatus,
  CreateFundDto,
  UpdateFundDto,
  RecordSharePurchaseDto,
  ConfirmShareDto,
} from "@fundy/shared";

@Injectable()
export class FundsService {
  constructor(@Inject(DB) private readonly db: DrizzleDB) {}

  async findAll(): Promise<DepositFund[]> {
    const rows = await this.db.select().from(depositFunds);
    return rows.map(this.mapFund);
  }

  async findOne(id: string): Promise<FundDetail> {
    const [fund] = await this.db
      .select()
      .from(depositFunds)
      .where(eq(depositFunds.id, id))
      .limit(1);

    if (!fund) throw new NotFoundException("Fund not found");

    const confirmedShares = await this.db
      .select({
        userId: shares.userId,
        userName: users.name,
        userEmail: users.email,
        quantity: sql<number>`sum(${shares.quantity})`.as("quantity"),
      })
      .from(shares)
      .innerJoin(users, eq(shares.userId, users.id))
      .where(and(eq(shares.fundId, id), eq(shares.status, "confirmed")))
      .groupBy(shares.userId, users.name, users.email);

    const totalShares = confirmedShares.reduce((sum, m) => sum + m.quantity, 0);

    const members = confirmedShares.map((m) => ({
      userId: m.userId,
      userName: m.userName,
      userEmail: m.userEmail,
      shares: m.quantity,
      sharePercent:
        totalShares > 0
          ? Math.round((m.quantity / totalShares) * 10000) / 100
          : 0,
      totalValue: m.quantity * fund.sharePrice,
    }));

    return {
      ...this.mapFund(fund),
      totalShares,
      totalValue: totalShares * fund.sharePrice,
      members,
    };
  }

  async create(dto: CreateFundDto, createdBy: string): Promise<DepositFund> {
    const [fund] = await this.db
      .insert(depositFunds)
      .values({
        name: dto.name,
        description: dto.description ?? null,
        sharePrice: dto.sharePrice,
        currency: dto.currency ?? "USD",
        createdBy,
      })
      .returning();
    return this.mapFund(fund);
  }

  async update(
    id: string,
    dto: UpdateFundDto,
    actorId: string,
  ): Promise<DepositFund> {
    const [fund] = await this.db
      .select()
      .from(depositFunds)
      .where(eq(depositFunds.id, id))
      .limit(1);

    if (!fund) throw new NotFoundException("Fund not found");
    if (fund.status === FundStatus.CLOSED)
      throw new BadRequestException("Fund is already closed");

    const updates: Partial<typeof depositFunds.$inferInsert> = {};
    if (dto.name) updates.name = dto.name;
    if (dto.description !== undefined)
      updates.description = dto.description ?? null;
    if (dto.status) {
      updates.status = dto.status;
      if (dto.status === FundStatus.CLOSED) updates.closedAt = new Date();
    }

    const [updated] = await this.db
      .update(depositFunds)
      .set(updates)
      .where(eq(depositFunds.id, id))
      .returning();

    return this.mapFund(updated);
  }

  async recordSharePurchase(
    fundId: string,
    dto: RecordSharePurchaseDto,
    recordedBy: string,
  ): Promise<void> {
    const [fund] = await this.db
      .select()
      .from(depositFunds)
      .where(eq(depositFunds.id, fundId))
      .limit(1);

    if (!fund) throw new NotFoundException("Fund not found");
    if (fund.status !== FundStatus.ACTIVE) {
      throw new BadRequestException(
        "Fund must be active to record share purchases",
      );
    }

    await this.db.insert(shares).values({
      fundId,
      userId: dto.userId,
      quantity: dto.quantity,
      unitPrice: fund.sharePrice,
      purchasedAt: new Date(dto.purchasedAt),
    });
  }

  async confirmShare(
    shareId: string,
    dto: ConfirmShareDto,
    actorId: string,
  ): Promise<void> {
    const [share] = await this.db
      .select()
      .from(shares)
      .where(eq(shares.id, shareId))
      .limit(1);

    if (!share) throw new NotFoundException("Share record not found");
    if (share.status !== ShareStatus.PENDING) {
      throw new BadRequestException("Share is not in pending state");
    }

    await this.db
      .update(shares)
      .set({
        status: dto.status,
        confirmedBy: actorId,
        confirmedAt: new Date(),
        notes: dto.notes ?? null,
      })
      .where(eq(shares.id, shareId));
  }

  async getConfirmedSharesForFund(
    fundId: string,
  ): Promise<Map<string, number>> {
    const rows = await this.db
      .select({
        userId: shares.userId,
        total: sql<number>`sum(${shares.quantity})`.as("total"),
      })
      .from(shares)
      .where(and(eq(shares.fundId, fundId), eq(shares.status, "confirmed")))
      .groupBy(shares.userId);

    return new Map(rows.map((r) => [r.userId, r.total]));
  }

  private mapFund(f: typeof depositFunds.$inferSelect): DepositFund {
    return {
      id: f.id,
      name: f.name,
      description: f.description,
      sharePrice: f.sharePrice,
      currency: f.currency,
      status: f.status as FundStatus,
      createdBy: f.createdBy,
      createdAt: f.createdAt.toISOString(),
      closedAt: f.closedAt?.toISOString() ?? null,
    };
  }
}
