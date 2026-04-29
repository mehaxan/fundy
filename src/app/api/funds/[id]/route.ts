import { NextRequest, NextResponse } from "next/server";
import { eq, and, sum } from "drizzle-orm";
import { db } from "@/db";
import { depositFunds, shares, users } from "@/db/schema";
import { getSession, requireRole } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

// GET /api/funds/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [fund] = await db.select().from(depositFunds).where(eq(depositFunds.id, id));
  if (!fund) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const fundShares = await db
    .select({
      userId: shares.userId,
      userName: users.name,
      userEmail: users.email,
      quantity: shares.quantity,
      status: shares.status,
      unitPrice: shares.unitPrice,
      purchasedAt: shares.purchasedAt,
      shareId: shares.id,
      notes: shares.notes,
    })
    .from(shares)
    .innerJoin(users, eq(users.id, shares.userId))
    .where(eq(shares.fundId, id))
    .orderBy(shares.purchasedAt);

  const confirmedShares = fundShares.filter((s) => s.status === "confirmed");
  const totalShares = confirmedShares.reduce((acc, s) => acc + s.quantity, 0);
  const totalValue = totalShares * fund.sharePrice;

  const members = Object.values(
    confirmedShares.reduce(
      (acc, s) => {
        if (!acc[s.userId]) {
          acc[s.userId] = { userId: s.userId, userName: s.userName, userEmail: s.userEmail, shares: 0, totalValue: 0 };
        }
        acc[s.userId].shares += s.quantity;
        acc[s.userId].totalValue = acc[s.userId].shares * fund.sharePrice;
        return acc;
      },
      {} as Record<string, { userId: string; userName: string; userEmail: string; shares: number; totalValue: number }>,
    ),
  ).map((m) => ({
    ...m,
    sharePercent: totalShares > 0 ? Math.round((m.shares / totalShares) * 10000) / 100 : 0,
  }));

  return NextResponse.json({ ...fund, totalShares, totalValue, members, allShares: fundShares });
}

// PATCH /api/funds/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireRole("admin", "manager");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const allowed = ["name", "description", "status"] as const;
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }
  if (body.status === "closed") update.closedAt = new Date();

  const [updated] = await db
    .update(depositFunds)
    .set(update)
    .where(eq(depositFunds.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}
