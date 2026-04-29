import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { investments } from "@/db/schema";
import { getSession, requireRole } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

// GET /api/investments/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [inv] = await db.select().from(investments).where(eq(investments.id, id));
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(inv);
}

// PATCH /api/investments/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireRole("admin", "manager");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const allowed = ["name", "description", "status", "returnAmount", "startDate", "endDate", "notes"] as const;
  const update: Record<string, unknown> = { updatedAt: new Date() };
  for (const key of allowed) {
    if (key in body) {
      if ((key === "startDate" || key === "endDate") && body[key]) {
        update[key] = new Date(body[key]);
      } else {
        update[key] = body[key];
      }
    }
  }

  const [updated] = await db
    .update(investments)
    .set(update)
    .where(eq(investments.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}
