import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { assets } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const data = await req.json();
    const allowed = ["name","description","category","currentValue","location","status","fundId"];
    const update: Record<string, unknown> = {};
    for (const k of allowed) if (k in data) update[k] = data[k];
    if ("currentValue" in data) update.currentValue = Number(data.currentValue);
    const [asset] = await db.update(assets).set(update).where(eq(assets.id, id)).returning();
    return NextResponse.json(asset);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    await db.update(assets).set({ status: "disposed" }).where(eq(assets.id, id));
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
