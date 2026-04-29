import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { wallets, walletTransactions } from "@/db/schema";
import { getSession } from "@/lib/session";

// POST /api/wallet/withdraw
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount, notes } = await req.json();
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "amount must be positive" }, { status: 400 });
  }

  const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, session.sub));
  if (!wallet) return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
  if (wallet.balance < amount) {
    return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
  }

  const [txn] = await db
    .insert(walletTransactions)
    .values({
      walletId: wallet.id,
      type: "withdrawal",
      direction: "debit",
      amount,
      status: "pending",
      sourceType: "withdrawal_request",
      notes,
      requestedBy: session.sub,
    })
    .returning();

  return NextResponse.json(txn, { status: 201 });
}
