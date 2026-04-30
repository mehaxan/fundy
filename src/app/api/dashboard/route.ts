import { NextResponse } from "next/server";
import { eq, count, sum, desc, and } from "drizzle-orm";
import { db } from "@/db";
import {
  funds, investments, wallets, walletTransactions,
  shares, users, assets, fines, meetings, monthlySnapshots,
} from "@/db/schema";
import { requireSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await requireSession();

    // Aggregated fund stats
    const [fundsStats] = await db
      .select({ total: count() })
      .from(funds)
      .where(eq(funds.status, "active"));

    // Members count
    const [membersStats] = await db.select({ total: count() }).from(users).where(eq(users.isActive, true));

    // Investments
    const allInvestments = await db.select({
      investedAmount: investments.investedAmount,
      actualReturn: investments.actualReturn,
      expectedReturn: investments.expectedReturn,
      status: investments.status,
    }).from(investments);

    const totalInvested = allInvestments.reduce((a, i) => a + i.investedAmount, 0);
    const totalReturns = allInvestments.reduce((a, i) => a + (i.actualReturn ?? 0), 0);
    const activeInvestments = allInvestments.filter(i => i.status === "active").length;

    // Assets value
    const allAssets = await db.select({ currentValue: assets.currentValue }).from(assets).where(eq(assets.status, "active"));
    const totalAssets = allAssets.reduce((a, asset) => a + asset.currentValue, 0);

    // Shares
    const pendingSharesCount = await db.select({ total: count() }).from(shares).where(eq(shares.status, "pending"));
    const approvedShares = await db.select({ qty: shares.quantity, price: shares.unitPrice }).from(shares).where(eq(shares.status, "approved"));
    const totalShareValue = approvedShares.reduce((a, s) => a + s.qty * s.price, 0);

    // Fines
    const [pendingFines] = await db.select({ total: count(), amount: sum(fines.amount) }).from(fines).where(eq(fines.status, "pending"));

    // Upcoming meetings
    const upcomingMeetings = await db.select({ id: meetings.id, title: meetings.title, scheduledAt: meetings.scheduledAt, type: meetings.type })
      .from(meetings).where(eq(meetings.status, "scheduled")).orderBy(meetings.scheduledAt).limit(3);

    // Recent wallet transactions (admin sees all via wallets join)
    const recentTxns = await db.select({
      id: walletTransactions.id,
      type: walletTransactions.type,
      amount: walletTransactions.amount,
      direction: walletTransactions.direction,
      description: walletTransactions.description,
      createdAt: walletTransactions.createdAt,
    }).from(walletTransactions).orderBy(desc(walletTransactions.createdAt)).limit(10);

    // Monthly snapshots for growth chart
    const snapshots = await db.select().from(monthlySnapshots).orderBy(monthlySnapshots.year, monthlySnapshots.month).limit(24);

    // Wallet totals
    const allWallets = await db.select({ balance: wallets.balance }).from(wallets);
    const totalWalletBalance = allWallets.reduce((a, w) => a + w.balance, 0);

    // Net worth = wallet balances + assets + investment returns
    const netWorth = totalWalletBalance + totalAssets + totalReturns;

    // Per-user data (for members)
    let myData = null;
    if (session.role === "member") {
      const [myWallet] = await db.select().from(wallets).where(eq(wallets.userId, session.sub));
      const myShares = await db.select({ qty: shares.quantity, price: shares.unitPrice }).from(shares)
        .where(and(eq(shares.userId, session.sub), eq(shares.status, "approved")));
      const myShareValue = myShares.reduce((a, s) => a + s.qty * s.price, 0);
      const myFines = await db.select({ amount: fines.amount }).from(fines)
        .where(and(eq(fines.userId, session.sub), eq(fines.status, "pending")));
      const myFineAmount = myFines.reduce((a, f) => a + f.amount, 0);
      myData = {
        walletBalance: myWallet?.balance ?? 0,
        shareValue: myShareValue,
        pendingFines: myFineAmount,
      };
    }

    return NextResponse.json({
      activeFunds: fundsStats.total,
      totalMembers: membersStats.total,
      totalInvested,
      totalReturns,
      totalAssets,
      totalShareValue,
      totalWalletBalance,
      netWorth,
      activeInvestments,
      pendingShares: pendingSharesCount[0].total,
      pendingFines: { count: pendingFines.total, amount: Number(pendingFines.amount ?? 0) },
      upcomingMeetings,
      recentTransactions: recentTxns,
      snapshots,
      myData,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

