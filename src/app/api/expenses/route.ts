import { NextRequest, NextResponse } from "next/server";
import { desc, eq, and } from "drizzle-orm";
import { db } from "@/db";
import { expenses, users, funds } from "@/db/schema";
import { requireSession, requireAdmin } from "@/lib/session";

export async function GET() {
  try {
    await requireSession();
    const rows = await db.select({
      id: expenses.id,
      title: expenses.title,
      description: expenses.description,
      amount: expenses.amount,
      category: expenses.category,
      status: expenses.status,
      expenseDate: expenses.expenseDate,
      receiptUrl: expenses.receiptUrl,
      notes: expenses.notes,
      createdAt: expenses.createdAt,
      approvedAt: expenses.approvedAt,
      fundId: expenses.fundId,
      fundName: funds.name,
      createdById: expenses.createdBy,
      createdByName: users.name,
    })
      .from(expenses)
      .leftJoin(users, and(eq(expenses.createdBy, users.id), eq(users.isActive, true)))
      .leftJoin(funds, eq(expenses.fundId, funds.id))
      .orderBy(desc(expenses.expenseDate));
    return NextResponse.json(rows);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const { title, description, amount, category, expenseDate, fundId, receiptUrl, notes } = await req.json();
    if (!title || !amount || !expenseDate) {
      return NextResponse.json({ error: "title, amount, expenseDate required" }, { status: 400 });
    }
    const [expense] = await db.insert(expenses).values({
      title,
      description: description || null,
      amount: Number(amount),
      category: category || "general",
      expenseDate: new Date(expenseDate),
      fundId: fundId || null,
      receiptUrl: receiptUrl || null,
      notes: notes || null,
      createdBy: session.sub,
    }).returning();
    return NextResponse.json(expense, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
