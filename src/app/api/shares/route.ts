import { NextRequest, NextResponse } from "next/server";
import { desc, eq, and } from "drizzle-orm";
import { db } from "@/db";
import { shares, funds, users } from "@/db/schema";
import { requireSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await requireSession();
    const baseQ = db.select({
      id: shares.id, quantity: shares.quantity, unitPrice: shares.unitPrice,
      totalAmount: shares.totalAmount, status: shares.status,
      requestedAt: shares.requestedAt, processedAt: shares.processedAt, notes: shares.notes,
      userId: shares.userId, fundId: shares.fundId,
      userName: users.name, userEmail: users.email, fundName: funds.name,
    }).from(shares)
      .leftJoin(users, eq(shares.userId, users.id))
      .leftJoin(funds, eq(shares.fundId, funds.id));

    const rows = session.role === "admin"
      ? await baseQ.orderBy(desc(shares.requestedAt))
      : await baseQ.where(eq(shares.userId, session.sub)).orderBy(desc(shares.requestedAt));
    return NextResponse.json(rows);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const { fundId, quantity, notes } = await req.json();
    if (!fundId || !quantity) return NextResponse.json({ error: "fundId and quantity required" }, { status: 400 });
    const [fund] = await db.select().from(funds).where(and(eq(funds.id, fundId), eq(funds.status, "active")));
    if (!fund) return NextResponse.json({ error: "Fund not found or not active" }, { status: 404 });
    const qty = Number(quantity);
    const [share] = await db.insert(shares).values({
      fundId, userId: session.sub, quantity: qty,
      unitPrice: fund.sharePrice, totalAmount: qty * fund.sharePrice, notes,
    }).returning();
    return NextResponse.json(share, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
