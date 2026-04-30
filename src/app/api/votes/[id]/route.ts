
import { NextRequest, NextResponse } from "next/server";
import { getSession, requireAdmin } from "@/lib/session";
import { db } from "@/db";
import { votes, voteResponses, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [vote] = await db.select().from(votes).where(eq(votes.id, id));
    if (!vote) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const responses = await db
      .select({
        userId: voteResponses.userId,
        userName: users.name,
        response: voteResponses.response,
        reason: voteResponses.reason,
        createdAt: voteResponses.createdAt,
      })
      .from(voteResponses)
      .leftJoin(users, eq(voteResponses.userId, users.id))
      .where(eq(voteResponses.voteId, id));

    const myResponse = responses.find(r => r.userId === session.sub) ?? null;
    const yesCount = responses.filter(r => r.response === "yes").length;
    const noCount = responses.filter(r => r.response === "no").length;
    const abstainCount = responses.filter(r => r.response === "abstain").length;

    return NextResponse.json({
      ...vote, responses, myResponse, yesCount, noCount, abstainCount,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireAdmin();
    const body = await req.json();
    const { status, title, description, endAt } = body;
    const update: Record<string, unknown> = {};
    if (status) update.status = status;
    if (title) update.title = title;
    if (description !== undefined) update.description = description;
    if (endAt !== undefined) update.endAt = endAt ? new Date(endAt) : null;
    const [updated] = await db.update(votes).set(update).where(eq(votes.id, id)).returning();
    return NextResponse.json(updated);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (err instanceof Error && err.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
