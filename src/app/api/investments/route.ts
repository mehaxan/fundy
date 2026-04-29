import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { investments } from "@/db/schema";
import { getSession, requireRole } from "@/lib/session";

// GET /api/investments — all authenticated users
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db.select().from(investments).orderBy(desc(investments.createdAt));
  return NextResponse.json(rows);
}

// POST /api/investments — admin/manager only
export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireRole("admin", "manager");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { fundId, name, description, investedAmount, expectedReturn, startDate } = await req.json();
  if (!fundId || !name || !investedAmount) {
    return NextResponse.json({ error: "fundId, name, investedAmount required" }, { status: 400 });
  }

  const [investment] = await db
    .insert(investments)
    .values({
      fundId,
      name,
      description,
      investedAmount,
      expectedReturn,
      startDate: startDate ? new Date(startDate) : null,
      createdBy: session.sub,
    })
    .returning();

  return NextResponse.json(investment, { status: 201 });
}
