import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { expenses } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const update: Record<string, unknown> = {};

    if (body.title !== undefined) update.title = body.title;
    if (body.description !== undefined) update.description = body.description;
    if (body.amount !== undefined) update.amount = Number(body.amount);
    if (body.category !== undefined) update.category = body.category;
    if (body.expenseDate !== undefined) update.expenseDate = new Date(body.expenseDate);
    if (body.fundId !== undefined) update.fundId = body.fundId || null;
    if (body.receiptUrl !== undefined) update.receiptUrl = body.receiptUrl || null;
    if (body.notes !== undefined) update.notes = body.notes || null;

    if (body.status !== undefined) {
      if (!["pending", "approved", "rejected"].includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      update.status = body.status;
      if (body.status === "approved") {
        update.approvedBy = session.sub;
        update.approvedAt = new Date();
      } else {
        update.approvedBy = null;
        update.approvedAt = null;
      }
    }

    const [expense] = await db.update(expenses).set(update).where(eq(expenses.id, id)).returning();
    if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(expense);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    await db.delete(expenses).where(eq(expenses.id, id));
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 });
  }
}
