import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { assets, funds, users } from "@/db/schema";
import { requireSession, requireAdmin } from "@/lib/session";

export async function GET() {
  try {
    await requireSession();
    const rows = await db.select({
      id: assets.id, name: assets.name, description: assets.description,
      category: assets.category, purchaseValue: assets.purchaseValue,
      currentValue: assets.currentValue, purchaseDate: assets.purchaseDate,
      location: assets.location, status: assets.status, createdAt: assets.createdAt,
      fundId: assets.fundId, fundName: funds.name, createdByName: users.name,
    }).from(assets)
      .leftJoin(funds, eq(assets.fundId, funds.id))
      .leftJoin(users, eq(assets.createdBy, users.id))
      .orderBy(desc(assets.createdAt));
    return NextResponse.json(rows);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const { name, description, category, purchaseValue, currentValue, purchaseDate, location, fundId } = await req.json();
    if (!name || !category || !purchaseValue || !purchaseDate)
      return NextResponse.json({ error: "name, category, purchaseValue, purchaseDate required" }, { status: 400 });
    const [asset] = await db.insert(assets).values({
      name, description, category,
      purchaseValue: Number(purchaseValue),
      currentValue: Number(currentValue ?? purchaseValue),
      purchaseDate: new Date(purchaseDate),
      location, fundId, createdBy: session.sub,
    }).returning();
    return NextResponse.json(asset, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
