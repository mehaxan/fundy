import { NextRequest, NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db";
import { investments, shares, wallets, walletTransactions } from "@/db/schema";
import { requireRole } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

// POST /api/investments/[id]/distribute
// Body: { profit: number } — cents, negative = loss
export async function POST(req: NextRequest, { params }: Params) {
  let session;
  try {
    session = await requireRole("admin");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { profit } = await req.json();
  if (typeof profit !== "number") {
    return NextResponse.json({ error: "profit (number in cents) required" }, { status: 400 });
  }

  const [investment] = await db.select().from(investments).where(eq(investments.id, id));
  if (!investment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const fundShares = await db
    .select({ userId: shares.userId, quantity: shares.quantity })
    .from(shares)
    .where(and(eq(shares.fundId, investment.fundId), eq(shares.status, "confirmed")));

  const totalShares = fundShares.reduce((acc, s) => acc + s.quantity, 0);
  if (totalShares === 0) {
    return NextResponse.json({ error: "No confirmed shares to distribute to" }, { status: 400 });
  }

  // Group by user
  const byUser = new Map<string, number>();
  for (const s of fundShares) {
    byUser.set(s.userId, (byUser.get(s.userId) ?? 0) + s.quantity);
  }

  const txnType = profit >= 0 ? ("investment_profit" as const) : ("investment_loss" as const);
  const direction = profit >= 0 ? ("credit" as const) : ("debit" as const);
  const absProfit = Math.abs(profit);

  await db.transaction(async (tx) => {
    for (const [userId, qty] of byUser) {
      const amount = Math.round(absProfit * (qty / totalShares));
      if (amount === 0) continue;

      const [wallet] = await tx.select().from(wallets).where(eq(wallets.userId, userId));
      if (!wallet) continue;

      await tx.insert(walletTransactions).values({
        walletId: wallet.id,
        type: txnType,
        direction,
        amount,
        status: "confirmed",
        sourceType: "investment_distribution",
        sourceId: id,
        requestedBy: session.sub,
        confirmedBy: session.sub,
        confirmedAt: new Date(),
      });

      const delta = direction === "credit" ? amount : -amount;
      await tx
        .update(wallets)
        .set({ balance: sql`${wallets.balance} + ${delta}`, updatedAt: new Date() })
        .where(eq(wallets.id, wallet.id));
    }

    await tx
      .update(investments)
      .set({ returnAmount: profit, status: "completed", updatedAt: new Date() })
      .where(eq(investments.id, id));
  });

  return NextResponse.json({ ok: true });
}
