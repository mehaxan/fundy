import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { fundDeposits, depositFunds } from "@/db/schema";
import { getSession, requireRole } from "@/lib/session";

type Params = { params: Promise<{ id: string; depositId: string }> };

// PATCH /api/funds/[id]/deposits/[depositId] — manager/admin approve or reject
export async function PATCH(req: NextRequest, { params }: Params) {
  let session;
  try {
    session = await requireRole("admin", "manager");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: fundId, depositId } = await params;

  const [deposit] = await db.select().from(fundDeposits).where(eq(fundDeposits.id, depositId));
  if (!deposit || deposit.fundId !== fundId) {
    return NextResponse.json({ error: "Deposit not found" }, { status: 404 });
  }
  if (deposit.status !== "pending") {
    return NextResponse.json({ error: "Deposit already reviewed" }, { status: 400 });
  }

  const { status, reviewNotes } = await req.json();
  if (status !== "approved" && status !== "rejected") {
    return NextResponse.json({ error: "status must be approved or rejected" }, { status: 400 });
  }

  const [updated] = await db
    .update(fundDeposits)
    .set({
      status,
      reviewedBy: session.sub,
      reviewedAt: new Date(),
      reviewNotes,
    })
    .where(eq(fundDeposits.id, depositId))
    .returning();

  return NextResponse.json(updated);
}
