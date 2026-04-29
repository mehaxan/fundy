import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { wallets, walletTransactions } from "@/db/schema";
import { requireRole } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/wallet/transactions/[id]/confirm — admin only
export async function PATCH(req: NextRequest, { params }: Params) {
  let session;
  try {
    session = await requireRole("admin", "manager");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { status, notes } = await req.json();

  if (!["confirmed", "rejected"].includes(status)) {
    return NextResponse.json({ error: "status must be confirmed or rejected" }, { status: 400 });
  }

  const [txn] = await db
    .select()
    .from(walletTransactions)
    .where(eq(walletTransactions.id, id));

  if (!txn) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (txn.status !== "pending") {
    return NextResponse.json({ error: "Transaction is not pending" }, { status: 400 });
  }

  await db.transaction(async (tx) => {
    await tx
      .update(walletTransactions)
      .set({ status, notes: notes ?? txn.notes, confirmedBy: session.sub, confirmedAt: new Date() })
      .where(eq(walletTransactions.id, id));

    if (status === "confirmed" && txn.direction === "debit") {
      await tx
        .update(wallets)
        .set({ balance: sql`${wallets.balance} - ${txn.amount}`, updatedAt: new Date() })
        .where(eq(wallets.id, txn.walletId));
    }
  });

  return NextResponse.json({ ok: true });
}
