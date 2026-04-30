
import { NextRequest, NextResponse } from "next/server";
import { getSession, requireAdmin } from "@/lib/session";
import { db } from "@/db";
import { meetings, meetingAttendees, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const attendees = await db
      .select({
        userId: meetingAttendees.userId,
        userName: users.name,
        attended: meetingAttendees.attended,
      })
      .from(meetingAttendees)
      .leftJoin(users, eq(meetingAttendees.userId, users.id))
      .where(eq(meetingAttendees.meetingId, id));

    return NextResponse.json({ ...meeting, attendees });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireAdmin();
    const body = await req.json();
    const { attendeeAttendance, ...rest } = body;

    const update: Record<string, unknown> = {};
    if (rest.title) update.title = rest.title;
    if (rest.description !== undefined) update.description = rest.description;
    if (rest.type) update.type = rest.type;
    if (rest.status) update.status = rest.status;
    if (rest.scheduledAt) update.scheduledAt = new Date(rest.scheduledAt);
    if (rest.location !== undefined) update.location = rest.location;

    if (Object.keys(update).length > 0) {
      await db.update(meetings).set(update).where(eq(meetings.id, id));
    }

    // Update attendance
    if (attendeeAttendance && Array.isArray(attendeeAttendance)) {
      for (const entry of attendeeAttendance) {
        await db.update(meetingAttendees)
          .set({ attended: entry.attended })
          .where(and(eq(meetingAttendees.meetingId, id), eq(meetingAttendees.userId, entry.attendeeId)));
      }
    }

    const [updated] = await db.select().from(meetings).where(eq(meetings.id, id));
    return NextResponse.json(updated);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (err instanceof Error && err.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
