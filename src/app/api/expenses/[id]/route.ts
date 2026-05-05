import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { expenses, wallets, walletTransactions, users } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const body = await req.json();

    // Fetch current state to detect transitions (avoid duplicate wallet debits)
    const [current] = await db
      .select({ status: expenses.status, amount: expenses.amount, title: expenses.title })
      .from(expenses)
      .where(eq(expenses.id, id));
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const update: Record<string, unknown> = {};

    if (body.title !== undefined) update.title = body.title;
    if (body.description !== undefined) update.description = body.description;
    if (body.amount !== undefined) update.amount = Number(body.amount);
    if (body.category !== undefined) update.category = body.category;
    if (body.expenseDate !== undefined) update.expenseDate = new Date(body.expenseDate);
    if (body.fundId !== undefined) update.fundId = body.fundId || null;
    if (body.receiptUrl !== undefined) update.receiptUrl = body.receiptUrl || null;
    if (body.notes !== undefined) update.notes = body.notes || null;

    // Only debit wallets when transitioning from non-approved → approved
    const approvingNow = body.status === "approved" && current.status !== "approved";

    if (body.status !== undefined) {
      if (!["pending", "approved", "rejected"].includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      update.status = body.status;
      if (body.status === "approved") {
        update.approvedBy = session.sub;
        update.approvedAt = new Date();
      } else {
        update.approvedBy = null;
        update.approvedAt = null;
      }
    }

    const [expense] = await db.update(expenses).set(update).where(eq(expenses.id, id)).returning();
    if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Debit all active members' wallets equally
    if (approvingNow) {
      const activeWallets = await db
        .select({ id: wallets.id, balance: wallets.balance })
        .from(wallets)
        .innerJoin(users, and(eq(wallets.userId, users.id), eq(users.isActive, true)));

      if (activeWallets.length > 0) {
        const n = activeWallets.length;
        const expenseAmount = expense.amount;
        // Equal split rounded to 2 decimal places; last member absorbs the tiny remainder
        const perMember = Math.round((expenseAmount / n) * 100) / 100;
        const lastMember = Math.round((expenseAmount - (n - 1) * perMember) * 100) / 100;

        await Promise.all(activeWallets.map(async (wallet, index) => {
          const debit = index === n - 1 ? lastMember : perMember;
          await db.insert(walletTransactions).values({
            walletId: wallet.id,
            type: "expense",
            direction: "debit",
            amount: debit,
            description: `Expense: ${expense.title}`,
            referenceId: expense.id,
            createdBy: session.sub,
          });
          await db
            .update(wallets)
            .set({ balance: wallet.balance - debit, updatedAt: new Date() })
            .where(eq(wallets.id, wallet.id));
        }));
      }
    }

    return NextResponse.json(expense);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;

    // If the expense was approved, reverse all wallet debits tied to it
    const [expense] = await db
      .select({ status: expenses.status })
      .from(expenses)
      .where(eq(expenses.id, id));
    if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (expense.status === "approved") {
      const txns = await db
        .select({ id: walletTransactions.id, walletId: walletTransactions.walletId, amount: walletTransactions.amount })
        .from(walletTransactions)
        .where(and(eq(walletTransactions.referenceId, id), eq(walletTransactions.type, "expense")));

      // Reverse balances: add back the debited amount to each wallet
      await Promise.all(txns.map(async (txn) => {
        const [wallet] = await db.select({ balance: wallets.balance }).from(wallets).where(eq(wallets.id, txn.walletId));
        if (!wallet) return;
        await db
          .update(wallets)
          .set({ balance: wallet.balance + txn.amount, updatedAt: new Date() })
          .where(eq(wallets.id, txn.walletId));
      }));

      // Delete the expense wallet transactions
      await db.delete(walletTransactions).where(and(eq(walletTransactions.referenceId, id), eq(walletTransactions.type, "expense")));
    }

    await db.delete(expenses).where(eq(expenses.id, id));
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 });
  }
}
