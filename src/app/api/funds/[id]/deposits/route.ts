import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { fundDeposits, depositFunds, users } from "@/db/schema";
import { getSession, requireRole } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

// GET /api/funds/[id]/deposits — admin/manager sees all, member sees own
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: fundId } = await params;

  const isPrivileged = session.role === "admin" || session.role === "manager";

  const rows = await db
    .select({
      id: fundDeposits.id,
      fundId: fundDeposits.fundId,
      userId: fundDeposits.userId,
      userName: users.name,
      amount: fundDeposits.amount,
      currency: fundDeposits.currency,
      notes: fundDeposits.notes,
      status: fundDeposits.status,
      reviewedBy: fundDeposits.reviewedBy,
      reviewedAt: fundDeposits.reviewedAt,
      reviewNotes: fundDeposits.reviewNotes,
      createdAt: fundDeposits.createdAt,
    })
    .from(fundDeposits)
    .innerJoin(users, eq(users.id, fundDeposits.userId))
    .where(
      isPrivileged
        ? eq(fundDeposits.fundId, fundId)
        : eq(fundDeposits.userId, session.sub),
    )
    .orderBy(desc(fundDeposits.createdAt));

  return NextResponse.json(rows);
}

// POST /api/funds/[id]/deposits — any authenticated user
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: fundId } = await params;

  const [fund] = await db.select().from(depositFunds).where(eq(depositFunds.id, fundId));
  if (!fund) return NextResponse.json({ error: "Fund not found" }, { status: 404 });
  if (fund.status !== "active") {
    return NextResponse.json({ error: "Fund is not accepting deposits" }, { status: 400 });
  }

  const { amount, notes } = await req.json();
  if (!amount || typeof amount !== "number" || amount <= 0) {
    return NextResponse.json({ error: "amount (positive integer in cents) required" }, { status: 400 });
  }

  const [deposit] = await db
    .insert(fundDeposits)
    .values({
      fundId,
      userId: session.sub,
      amount,
      currency: fund.currency,
      notes,
    })
    .returning();

  return NextResponse.json(deposit, { status: 201 });
}
