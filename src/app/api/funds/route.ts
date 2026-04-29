import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { depositFunds } from "@/db/schema";
import { getSession, requireRole } from "@/lib/session";

// GET /api/funds — all authenticated users
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db.select().from(depositFunds).orderBy(desc(depositFunds.createdAt));
  return NextResponse.json(rows);
}

// POST /api/funds — admin only
export async function POST(req: NextRequest) {
  try {
    await requireRole("admin");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const session = await getSession();
  const {
    name,
    description,
    sharePrice,
    currency,
    bankName,
    bankAccountName,
    bankAccountNumber,
    bankRoutingNumber,
    bankSwiftCode,
    bankInstructions,
  } = await req.json();

  if (!name || !sharePrice) {
    return NextResponse.json({ error: "name and sharePrice required" }, { status: 400 });
  }

  const [fund] = await db
    .insert(depositFunds)
    .values({
      name,
      description,
      sharePrice,
      currency: currency ?? "BDT",
      createdBy: session!.sub,
      bankName,
      bankAccountName,
      bankAccountNumber,
      bankRoutingNumber,
      bankSwiftCode,
      bankInstructions,
    })
    .returning();

  return NextResponse.json(fund, { status: 201 });
}
