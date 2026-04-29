import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { shares, depositFunds, users } from "@/db/schema";
import { getSession, requireRole } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

// POST /api/funds/[id]/shares — record a share purchase (admin/manager)
export async function POST(req: NextRequest, { params }: Params) {
  try {
    await requireRole("admin", "manager");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: fundId } = await params;
  const [fund] = await db.select().from(depositFunds).where(eq(depositFunds.id, fundId));
  if (!fund) return NextResponse.json({ error: "Fund not found" }, { status: 404 });
  if (fund.status !== "active") {
    return NextResponse.json({ error: "Fund is not active" }, { status: 400 });
  }

  const { email, quantity, purchasedAt } = await req.json();
  if (!email || !quantity || !purchasedAt) {
    return NextResponse.json({ error: "email, quantity, purchasedAt required" }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase().trim()));
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const [share] = await db
    .insert(shares)
    .values({ fundId, userId: user.id, quantity, unitPrice: fund.sharePrice, purchasedAt: new Date(purchasedAt) })
    .returning();

  return NextResponse.json(share, { status: 201 });
}
