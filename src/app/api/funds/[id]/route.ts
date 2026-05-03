import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { funds, shares, users } from "@/db/schema";
import { requireSession, requireAdmin } from "@/lib/session";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await params;
    const [fund] = await db.select().from(funds).where(eq(funds.id, id));
    if (!fund) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const shareRows = await db.select({
      id: shares.id, quantity: shares.quantity, unitPrice: shares.unitPrice,
      totalAmount: shares.totalAmount, status: shares.status,
      requestedAt: shares.requestedAt, notes: shares.notes, userId: shares.userId,
      userName: users.name, userEmail: users.email,
    }).from(shares).leftJoin(users, eq(shares.userId, users.id)).where(eq(shares.fundId, id));
    return NextResponse.json({ ...fund, shares: shareRows });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const data = await req.json();
    const allowed = ["name", "description", "sharePrice", "status", "bankName", "bankAccountName", "bankAccountNumber", "bankBranch", "bankInstructions"];
    const update: Record<string, unknown> = {};
    for (const k of allowed) if (k in data) update[k] = data[k];
    if (data.status === "closed") update.closedAt = new Date();
    const [fund] = await db.update(funds).set(update).where(eq(funds.id, id)).returning();
    return NextResponse.json(fund);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
