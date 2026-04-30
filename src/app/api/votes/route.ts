import { NextRequest, NextResponse } from "next/server";
import { desc, eq, count } from "drizzle-orm";
import { db } from "@/db";
import { votes, voteResponses, meetings, users } from "@/db/schema";
import { requireSession, requireAdmin } from "@/lib/session";

export async function GET() {
  try {
    await requireSession();
    const rows = await db.select({
      id: votes.id, title: votes.title, description: votes.description,
      options: votes.options, status: votes.status,
      startAt: votes.startAt, endAt: votes.endAt, createdAt: votes.createdAt,
      meetingId: votes.meetingId, meetingTitle: meetings.title, createdByName: users.name,
    }).from(votes)
      .leftJoin(meetings, eq(votes.meetingId, meetings.id))
      .leftJoin(users, eq(votes.createdBy, users.id))
      .orderBy(desc(votes.createdAt));
    const enriched = await Promise.all(rows.map(async (v) => {
      const [res] = await db.select({ total: count() }).from(voteResponses).where(eq(voteResponses.voteId, v.id));
      return { ...v, responseCount: res?.total ?? 0 };
    }));
    return NextResponse.json(enriched);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const { title, description, options, meetingId, startAt, endAt } = await req.json();
    if (!title || !options?.length) return NextResponse.json({ error: "title and options required" }, { status: 400 });
    const [vote] = await db.insert(votes).values({
      title, description, options, meetingId, status: "draft",
      startAt: startAt ? new Date(startAt) : undefined,
      endAt: endAt ? new Date(endAt) : undefined,
      createdBy: session.sub,
    }).returning();
    return NextResponse.json(vote, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
