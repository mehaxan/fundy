import { NextRequest, NextResponse } from "next/server";
import { eq, and, count, sum, desc } from "drizzle-orm";
import { db } from "@/db";
import { users, wallets, walletTransactions } from "@/db/schema";
import { requireRole } from "@/lib/session";

// GET /api/admin/wallet/pending — pending withdrawals
export async function GET() {
  try {
    await requireRole("admin", "manager");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pending = await db
    .select({
      id: walletTransactions.id,
      amount: walletTransactions.amount,
      notes: walletTransactions.notes,
      createdAt: walletTransactions.createdAt,
      userName: users.name,
      userEmail: users.email,
      walletId: walletTransactions.walletId,
    })
    .from(walletTransactions)
    .innerJoin(users, eq(users.id, walletTransactions.requestedBy))
    .where(
      and(
        eq(walletTransactions.type, "withdrawal"),
        eq(walletTransactions.status, "pending"),
      ),
    )
    .orderBy(desc(walletTransactions.createdAt));

  return NextResponse.json(pending);
}
