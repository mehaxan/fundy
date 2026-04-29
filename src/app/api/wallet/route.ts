import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { wallets, walletTransactions } from "@/db/schema";
import { getSession } from "@/lib/session";

// GET /api/wallet — current user's wallet + transactions
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, session.sub));
  if (!wallet) return NextResponse.json({ error: "Wallet not found" }, { status: 404 });

  const txns = await db
    .select()
    .from(walletTransactions)
    .where(eq(walletTransactions.walletId, wallet.id))
    .orderBy(desc(walletTransactions.createdAt))
    .limit(50);

  const pendingDebits = txns
    .filter((t) => t.status === "pending" && t.direction === "debit")
    .reduce((acc, t) => acc + t.amount, 0);

  return NextResponse.json({ ...wallet, pendingDebits, transactions: txns });
}
