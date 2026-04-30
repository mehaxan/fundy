import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { wallets, walletTransactions, users } from "@/db/schema";
import { requireSession, requireAdmin } from "@/lib/session";

export async function GET() {
  try {
    const session = await requireSession();
    if (session.role === "admin") {
      const rows = await db.select({
        id: wallets.id, balance: wallets.balance, updatedAt: wallets.updatedAt,
        userId: wallets.userId, userName: users.name, userEmail: users.email,
      }).from(wallets).leftJoin(users, eq(wallets.userId, users.id));
      return NextResponse.json(rows);
    }
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, session.sub));
    return NextResponse.json(wallet ?? null);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const { walletId, type, direction, amount, description } = await req.json();
    if (!walletId || !type || !direction || !amount || !description)
      return NextResponse.json({ error: "walletId, type, direction, amount, description required" }, { status: 400 });
    const [wallet] = await db.select().from(wallets).where(eq(wallets.id, walletId));
    if (!wallet) return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    const amt = Number(amount);
    const newBalance = direction === "credit" ? wallet.balance + amt : wallet.balance - amt;
    const [txn] = await db.insert(walletTransactions).values({
      walletId, type, direction, amount: amt, description, createdBy: session.sub,
    }).returning();
    await db.update(wallets).set({ balance: newBalance, updatedAt: new Date() }).where(eq(wallets.id, walletId));
    return NextResponse.json(txn, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
