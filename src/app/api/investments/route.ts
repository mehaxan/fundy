import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { investments, funds, users } from "@/db/schema";
import { requireSession, requireAdmin } from "@/lib/session";

export async function GET() {
  try {
    await requireSession();
    const rows = await db.select({
      id: investments.id, name: investments.name, description: investments.description,
      category: investments.category, investedAmount: investments.investedAmount,
      expectedReturn: investments.expectedReturn, actualReturn: investments.actualReturn,
      status: investments.status, startDate: investments.startDate, endDate: investments.endDate,
      notes: investments.notes, createdAt: investments.createdAt, updatedAt: investments.updatedAt,
      fundId: investments.fundId, fundName: funds.name, createdByName: users.name,
    }).from(investments)
      .leftJoin(funds, eq(investments.fundId, funds.id))
      .leftJoin(users, eq(investments.createdBy, users.id))
      .orderBy(desc(investments.createdAt));
    return NextResponse.json(rows);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await req.json();
    const { name, description, category, investedAmount, expectedReturn, status, startDate, endDate, fundId, notes } = body;
    if (!name || !investedAmount) return NextResponse.json({ error: "name and investedAmount required" }, { status: 400 });
    const [inv] = await db.insert(investments).values({
      name, description, category: category ?? "general",
      investedAmount: Number(investedAmount),
      expectedReturn: expectedReturn ? Number(expectedReturn) : undefined,
      status: status ?? "planned",
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      fundId, notes, createdBy: session.sub,
    }).returning();
    return NextResponse.json(inv, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 403 });
  }
}
