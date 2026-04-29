import { Injectable, Inject } from '@nestjs/common';
import { eq, sql, and } from 'drizzle-orm';
import { DB, DrizzleDB } from '../../database/database.module';
import { users, wallets, walletTransactions, depositFunds, shares, investments } from '../../database/schema';

@Injectable()
export class DashboardService {
  constructor(@Inject(DB) private readonly db: DrizzleDB) {}

  async getMemberSummary(userId: string) {
    // Wallet
    const [wallet] = await this.db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userId))
      .limit(1);

    const balance = wallet?.balance ?? 0;

    // My shares per fund
    const myShares = await this.db
      .select({
        fundId: shares.fundId,
        fundName: depositFunds.name,
        sharePrice: depositFunds.sharePrice,
        currency: depositFunds.currency,
        status: depositFunds.status,
        quantity: sql<number>`sum(${shares.quantity})`.as('quantity'),
      })
      .from(shares)
      .innerJoin(depositFunds, eq(shares.fundId, depositFunds.id))
      .where(and(eq(shares.userId, userId), eq(shares.status, 'confirmed')))
      .groupBy(shares.fundId, depositFunds.name, depositFunds.sharePrice, depositFunds.currency, depositFunds.status);

    // Recent transactions (last 5)
    const recentTxns = wallet
      ? await this.db
          .select()
          .from(walletTransactions)
          .where(eq(walletTransactions.walletId, wallet.id))
          .orderBy(sql`${walletTransactions.createdAt} desc`)
          .limit(5)
      : [];

    // Active investments for my funds
    const myFundIds = [...new Set(myShares.map((s) => s.fundId))];
    const activeInvestments =
      myFundIds.length > 0
        ? await this.db
            .select()
            .from(investments)
            .where(and(eq(investments.status, 'active')))
        : [];

    return {
      walletBalance: balance,
      funds: myShares.map((s) => ({
        fundId: s.fundId,
        fundName: s.fundName,
        shares: s.quantity,
        sharePrice: s.sharePrice,
        totalValue: s.quantity * s.sharePrice,
        currency: s.currency,
        status: s.status,
      })),
      recentTransactions: recentTxns,
      activeInvestments: activeInvestments.filter((i) => myFundIds.includes(i.fundId)),
    };
  }

  async getManagerSummary() {
    const [pendingWithdrawals] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(walletTransactions)
      .where(and(eq(walletTransactions.type, 'withdrawal'), eq(walletTransactions.status, 'pending')));

    const [pendingDeposits] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(shares)
      .where(eq(shares.status, 'pending'));

    const [activeInvestmentsSummary] = await this.db
      .select({
        count: sql<number>`count(*)`,
        totalDeployed: sql<number>`coalesce(sum(${investments.investedAmount}), 0)`,
      })
      .from(investments)
      .where(eq(investments.status, 'active'));

    const [fundsSummary] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(depositFunds)
      .where(eq(depositFunds.status, 'active'));

    return {
      pendingWithdrawals: pendingWithdrawals.count,
      pendingDeposits: pendingDeposits.count,
      activeInvestments: activeInvestmentsSummary.count,
      totalDeployed: activeInvestmentsSummary.totalDeployed,
      activeFunds: fundsSummary.count,
    };
  }
}
