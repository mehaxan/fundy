import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { DB, DrizzleDB } from '../../database/database.module';
import { wallets, walletTransactions } from '../../database/schema';
import {
  Wallet,
  WalletTransaction,
  WalletTxnStatus,
  WalletTxnType,
  WalletTxnDirection,
  RequestWithdrawalDto,
  ConfirmWithdrawalDto,
  ManualAdjustmentDto,
} from '@fundy/shared';

@Injectable()
export class WalletService {
  constructor(@Inject(DB) private readonly db: DrizzleDB) {}

  async ensureWallet(userId: string): Promise<void> {
    const [existing] = await this.db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .limit(1);
    if (!existing) {
      await this.db.insert(wallets).values({ userId }).onConflictDoNothing();
    }
  }

  async getWallet(userId: string): Promise<Wallet> {
    await this.ensureWallet(userId);
    const [wallet] = await this.db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .limit(1);

    const [pending] = await this.db
      .select({ total: sql<number>`coalesce(sum(${walletTransactions.amount}),0)` })
      .from(walletTransactions)
      .where(
        and(
          eq(walletTransactions.walletId, wallet.id),
          eq(walletTransactions.status, 'pending'),
          eq(walletTransactions.direction, 'debit'),
        ),
      );

    return {
      id: wallet.id,
      userId: wallet.userId,
      balance: wallet.balance,
      pendingDebits: pending.total,
      updatedAt: wallet.updatedAt.toISOString(),
    };
  }

  async getTransactions(userId: string): Promise<WalletTransaction[]> {
    await this.ensureWallet(userId);
    const [wallet] = await this.db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .limit(1);

    const rows = await this.db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.walletId, wallet.id))
      .orderBy(sql`${walletTransactions.createdAt} desc`);

    return rows.map(this.mapTxn);
  }

  async requestWithdrawal(userId: string, dto: RequestWithdrawalDto): Promise<WalletTransaction> {
    const wallet = await this.getWallet(userId);
    const available = wallet.balance - wallet.pendingDebits;
    if (dto.amount > available) {
      throw new BadRequestException('Insufficient available balance');
    }

    const [txn] = await this.db
      .insert(walletTransactions)
      .values({
        walletId: wallet.id,
        type: 'withdrawal',
        direction: 'debit',
        amount: dto.amount,
        status: 'pending',
        sourceType: 'withdrawal_request',
        notes: dto.notes ?? null,
        requestedBy: userId,
      })
      .returning();

    return this.mapTxn(txn);
  }

  async cancelWithdrawal(txnId: string, userId: string): Promise<void> {
    const [txn] = await this.db
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.id, txnId))
      .limit(1);

    if (!txn) throw new NotFoundException('Transaction not found');
    if (txn.requestedBy !== userId) throw new BadRequestException('Not your transaction');
    if (txn.status !== 'pending') throw new BadRequestException('Can only cancel pending transactions');

    await this.db
      .update(walletTransactions)
      .set({ status: 'cancelled' })
      .where(eq(walletTransactions.id, txnId));
  }

  async confirmWithdrawal(txnId: string, dto: ConfirmWithdrawalDto, actorId: string): Promise<void> {
    const [txn] = await this.db
      .select()
      .from(walletTransactions)
      .where(and(eq(walletTransactions.id, txnId), eq(walletTransactions.type, 'withdrawal')))
      .limit(1);

    if (!txn) throw new NotFoundException('Withdrawal not found');
    if (txn.status !== 'pending') throw new BadRequestException('Withdrawal is not pending');

    await this.db.transaction(async (tx) => {
      await tx
        .update(walletTransactions)
        .set({
          status: dto.status,
          confirmedBy: actorId,
          confirmedAt: new Date(),
          notes: dto.notes ?? txn.notes,
        })
        .where(eq(walletTransactions.id, txnId));

      if (dto.status === WalletTxnStatus.CONFIRMED) {
        await tx
          .update(wallets)
          .set({ balance: sql`${wallets.balance} - ${txn.amount}`, updatedAt: new Date() })
          .where(eq(wallets.id, txn.walletId));
      }
    });
  }

  async manualAdjust(userId: string, dto: ManualAdjustmentDto, actorId: string): Promise<void> {
    await this.ensureWallet(userId);
    const [wallet] = await this.db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .limit(1);

    const type = dto.direction === WalletTxnDirection.CREDIT ? 'manual_credit' : 'manual_debit';

    await this.db.transaction(async (tx) => {
      await tx.insert(walletTransactions).values({
        walletId: wallet.id,
        type,
        direction: dto.direction,
        amount: dto.amount,
        status: 'confirmed',
        sourceType: 'manual',
        notes: dto.notes,
        requestedBy: actorId,
        confirmedBy: actorId,
        confirmedAt: new Date(),
      });

      const delta = dto.direction === WalletTxnDirection.CREDIT ? dto.amount : -dto.amount;
      await tx
        .update(wallets)
        .set({ balance: sql`${wallets.balance} + ${delta}`, updatedAt: new Date() })
        .where(eq(wallets.id, wallet.id));
    });
  }

  async getAllPendingWithdrawals() {
    const rows = await this.db
      .select()
      .from(walletTransactions)
      .where(and(eq(walletTransactions.type, 'withdrawal'), eq(walletTransactions.status, 'pending')))
      .orderBy(sql`${walletTransactions.createdAt} asc`);
    return rows.map(this.mapTxn);
  }

  private mapTxn(t: typeof walletTransactions.$inferSelect): WalletTransaction {
    return {
      id: t.id,
      walletId: t.walletId,
      type: t.type as WalletTxnType,
      direction: t.direction as WalletTxnDirection,
      amount: t.amount,
      status: t.status as WalletTxnStatus,
      sourceType: t.sourceType as WalletTransaction['sourceType'],
      sourceId: t.sourceId,
      notes: t.notes,
      requestedBy: t.requestedBy,
      confirmedBy: t.confirmedBy,
      confirmedAt: t.confirmedAt?.toISOString() ?? null,
      createdAt: t.createdAt.toISOString(),
    };
  }
}
