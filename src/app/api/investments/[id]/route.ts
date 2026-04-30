import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { investments } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const data = await req.json();
    const allowed = ["name","description","category","investedAmount","expectedReturn","actualReturn","status","startDate","endDate","notes","fundId"];
    const update: Record<string, unknown> = { updatedAt: new Date() };
    for (const k of allowed) {
      if (k in data) {
        if (["investedAmount","expectedReturn","actualReturn"].includes(k)) update[k] = data[k] !== "" ? Number(data[k]) : null;
        else if (["startDate","endDate"].includes(k)) update[k] = data[k] ? new Date(data[k]) : null;
        else update[k] = data[k];
      }
    }
    const [inv] = await db.update(investments).set(update).where(eq(investments.id, id)).returning();
    return NextResponse.json(inv);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    await db.update(investments).set({ status: "cancelled", updatedAt: new Date() }).where(eq(investments.id, id));
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
