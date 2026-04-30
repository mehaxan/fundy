import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { fines, users } from "@/db/schema";
import { requireSession, requireAdmin } from "@/lib/session";

export async function GET() {
  try {
    const session = await requireSession();
    const baseQ = db.select({
      id: fines.id, reason: fines.reason, amount: fines.amount,
      status: fines.status, issuedAt: fines.issuedAt, paidAt: fines.paidAt, notes: fines.notes,
      userId: fines.userId, userName: users.name,
    }).from(fines).leftJoin(users, eq(fines.userId, users.id));
    const rows = session.role === "admin"
      ? await baseQ.orderBy(desc(fines.issuedAt))
      : await baseQ.where(eq(fines.userId, session.sub)).orderBy(desc(fines.issuedAt));
    return NextResponse.json(rows);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const { userId, reason, amount, notes } = await req.json();
    if (!userId || !reason || !amount) return NextResponse.json({ error: "userId, reason, amount required" }, { status: 400 });
    const [fine] = await db.insert(fines).values({
      userId, reason, amount: Number(amount), notes, issuedBy: session.sub,
    }).returning();
    return NextResponse.json(fine, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
