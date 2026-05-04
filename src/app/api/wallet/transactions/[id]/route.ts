import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { walletTransactions, wallets } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { description, type, receiptUrl } = await req.json();
    const update: Record<string, unknown> = {};
    if (description !== undefined) update.description = description;
    if (type !== undefined) update.type = type;
    if (receiptUrl !== undefined) update.receiptUrl = receiptUrl || null;
    const [txn] = await db.update(walletTransactions).set(update).where(eq(walletTransactions.id, id)).returning();
    if (!txn) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(txn);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const [txn] = await db.select().from(walletTransactions).where(eq(walletTransactions.id, id));
    if (!txn) return NextResponse.json({ error: "Not found" }, { status: 404 });
    // Reverse balance effect
    const [wallet] = await db.select().from(wallets).where(eq(wallets.id, txn.walletId));
    if (wallet) {
      const reversed = txn.direction === "credit" ? wallet.balance - txn.amount : wallet.balance + txn.amount;
      await db.update(wallets).set({ balance: reversed, updatedAt: new Date() }).where(eq(wallets.id, wallet.id));
    }
    await db.delete(walletTransactions).where(eq(walletTransactions.id, id));
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 });
  }
}
