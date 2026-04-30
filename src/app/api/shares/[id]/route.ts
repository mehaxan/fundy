import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { shares } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const { status, notes } = await req.json();
    if (!["approved", "rejected"].includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    const [share] = await db.update(shares).set({
      status, notes, processedBy: session.sub, processedAt: new Date(),
    }).where(eq(shares.id, id)).returning();
    return NextResponse.json(share);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 403 });
  }
}
