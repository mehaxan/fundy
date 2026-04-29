import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { wallets, walletTransactions, users } from "@/db/schema";
import { requireRole, getSession } from "@/lib/session";

// GET /api/admin/wallet — all wallets summary
export async function GET() {
  try {
    await requireRole("admin", "manager");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db
    .select({
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      balance: wallets.balance,
      walletId: wallets.id,
    })
    .from(wallets)
    .innerJoin(users, eq(users.id, wallets.userId))
    .orderBy(users.name);

  return NextResponse.json(rows);
}

// POST /api/admin/wallet — manual adjustment
export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireRole("admin");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, direction, amount, notes } = await req.json();
  if (!userId || !direction || !amount || !notes) {
    return NextResponse.json({ error: "userId, direction, amount, notes required" }, { status: 400 });
  }

  const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
  if (!wallet) return NextResponse.json({ error: "Wallet not found" }, { status: 404 });

  const txnType = direction === "credit" ? ("manual_credit" as const) : ("manual_debit" as const);

  await db.transaction(async (tx) => {
    await tx.insert(walletTransactions).values({
      walletId: wallet.id,
      type: txnType,
      direction,
      amount,
      status: "confirmed",
      sourceType: "manual",
      notes,
      requestedBy: session.sub,
      confirmedBy: session.sub,
      confirmedAt: new Date(),
    });

    const delta = direction === "credit" ? amount : -amount;
    await tx
      .update(wallets)
      .set({ balance: sql`${wallets.balance} + ${delta}`, updatedAt: new Date() })
      .where(eq(wallets.id, wallet.id));
  });

  return NextResponse.json({ ok: true });
}
