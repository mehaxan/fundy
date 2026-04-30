import { NextRequest, NextResponse } from "next/server";
import { desc, eq, count } from "drizzle-orm";
import { db } from "@/db";
import { meetings, meetingAttendees, users } from "@/db/schema";
import { requireSession, requireAdmin } from "@/lib/session";

export async function GET() {
  try {
    await requireSession();
    const rows = await db.select({
      id: meetings.id, title: meetings.title, description: meetings.description,
      type: meetings.type, scheduledAt: meetings.scheduledAt, location: meetings.location,
      agenda: meetings.agenda, minutes: meetings.minutes, status: meetings.status,
      createdAt: meetings.createdAt, createdByName: users.name,
    }).from(meetings)
      .leftJoin(users, eq(meetings.createdBy, users.id))
      .orderBy(desc(meetings.scheduledAt));

    const enriched = await Promise.all(rows.map(async (m) => {
      const [att] = await db.select({ total: count() }).from(meetingAttendees).where(eq(meetingAttendees.meetingId, m.id));
      return { ...m, attendeeCount: att?.total ?? 0 };
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
    const { title, description, type, scheduledAt, location, agenda, attendeeIds } = await req.json();
    if (!title || !scheduledAt) return NextResponse.json({ error: "title and scheduledAt required" }, { status: 400 });
    const [meeting] = await db.insert(meetings).values({
      title, description, type: type ?? "general",
      scheduledAt: new Date(scheduledAt), location, agenda, createdBy: session.sub,
    }).returning();
    if (attendeeIds?.length) {
      await db.insert(meetingAttendees).values(
        attendeeIds.map((uid: string) => ({ meetingId: meeting.id, userId: uid }))
      );
    }
    return NextResponse.json(meeting, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
