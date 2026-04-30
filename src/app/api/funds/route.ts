import { NextRequest, NextResponse } from "next/server";
import { desc, eq, count } from "drizzle-orm";
import { db } from "@/db";
import { funds, shares } from "@/db/schema";
import { requireSession, requireAdmin } from "@/lib/session";

export async function GET() {
  try {
    await requireSession();
    const rows = await db.select({
      id: funds.id, name: funds.name, description: funds.description,
      sharePrice: funds.sharePrice, status: funds.status,
      createdAt: funds.createdAt, closedAt: funds.closedAt,
    }).from(funds).orderBy(desc(funds.createdAt));

    const enriched = await Promise.all(rows.map(async (f) => {
      const allShares = await db.select({ qty: shares.quantity, price: shares.unitPrice, status: shares.status })
        .from(shares).where(eq(shares.fundId, f.id));
      const approved = allShares.filter(s => s.status === "approved");
      const totalValue = approved.reduce((a, s) => a + s.qty * s.price, 0);
      const totalQty = approved.reduce((a, s) => a + s.qty, 0);
      const pendingCount = allShares.filter(s => s.status === "pending").length;
      return { ...f, totalValue, totalShareQty: totalQty, pendingShares: pendingCount };
    }));
    return NextResponse.json(enriched);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const { name, description, sharePrice } = await req.json();
    if (!name || !sharePrice) return NextResponse.json({ error: "name and sharePrice required" }, { status: 400 });
    const [fund] = await db.insert(funds).values({
      name, description, sharePrice: Number(sharePrice), createdBy: session.sub,
    }).returning();
    return NextResponse.json(fund, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 403 });
  }
}
