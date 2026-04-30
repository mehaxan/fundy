import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { fines } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { status, notes } = await req.json();
    if (!["paid", "waived", "pending"].includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    const update: Record<string, unknown> = { status, notes };
    if (status === "paid") update.paidAt = new Date();
    const [fine] = await db.update(fines).set(update).where(eq(fines.id, id)).returning();
    return NextResponse.json(fine);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 403 });
  }
}
