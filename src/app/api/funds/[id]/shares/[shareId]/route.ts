import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { shares } from "@/db/schema";
import { getSession, requireRole } from "@/lib/session";

type Params = { params: Promise<{ id: string; shareId: string }> };

// PATCH /api/funds/[id]/shares/[shareId] — confirm or reject a share
export async function PATCH(req: NextRequest, { params }: Params) {
  let session;
  try {
    session = await requireRole("admin", "manager");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { shareId } = await params;
  const { status, notes } = await req.json();

  if (!["confirmed", "rejected"].includes(status)) {
    return NextResponse.json({ error: "status must be confirmed or rejected" }, { status: 400 });
  }

  const [updated] = await db
    .update(shares)
    .set({ status, notes, confirmedBy: session.sub, confirmedAt: new Date() })
    .where(eq(shares.id, shareId))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}
