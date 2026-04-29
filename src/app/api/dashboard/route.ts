import { NextResponse } from "next/server";
import { eq, count, and, desc } from "drizzle-orm";
import { db } from "@/db";
import { depositFunds, investments, wallets, walletTransactions, shares, users } from "@/db/schema";
import { getSession } from "@/lib/session";

// GET /api/dashboard — summary stats for current user
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, session.sub));

  const myShares = await db
    .select({ fundId: shares.fundId, quantity: shares.quantity, unitPrice: shares.unitPrice })
    .from(shares)
    .where(and(eq(shares.userId, session.sub), eq(shares.status, "confirmed")));

  const totalInvested = myShares.reduce((acc, s) => acc + s.quantity * s.unitPrice, 0);

  const recentTxns = wallet
    ? await db
        .select()
        .from(walletTransactions)
        .where(eq(walletTransactions.walletId, wallet.id))
        .orderBy(desc(walletTransactions.createdAt))
        .limit(5)
    : [];

  const activeFunds = await db
    .select({ id: depositFunds.id })
    .from(depositFunds)
    .where(eq(depositFunds.status, "active"));

  // admin/manager extras
  let adminStats = null;
  if (session.role === "admin" || session.role === "manager") {
    const [{ total: totalUsers }] = await db.select({ total: count() }).from(users);
    const pendingWithdrawals = await db
      .select({ total: count() })
      .from(walletTransactions)
      .where(and(eq(walletTransactions.type, "withdrawal"), eq(walletTransactions.status, "pending")));

    const pendingShares = await db
      .select({ total: count() })
      .from(shares)
      .where(eq(shares.status, "pending"));

    adminStats = {
      totalUsers,
      pendingWithdrawals: pendingWithdrawals[0].total,
      pendingShares: pendingShares[0].total,
    };
  }

  return NextResponse.json({
    walletBalance: wallet?.balance ?? 0,
    totalInvested,
    activeFundsCount: activeFunds.length,
    recentTransactions: recentTxns,
    adminStats,
  });
}
