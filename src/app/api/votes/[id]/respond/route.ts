
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/db";
import { votes, voteResponses, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [vote] = await db.select().from(votes).where(eq(votes.id, id));
    if (!vote) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (vote.status !== "open") return NextResponse.json({ error: "Vote is not open" }, { status: 400 });

    const body = await req.json();
    const { response, reason } = body;
    if (!["yes", "no", "abstain"].includes(response)) return NextResponse.json({ error: "Invalid response" }, { status: 400 });

    // Upsert: delete existing if present, then insert
    await db.delete(voteResponses).where(and(eq(voteResponses.voteId, id), eq(voteResponses.userId, session.sub)));
    const [resp] = await db.insert(voteResponses).values({
      voteId: id, userId: session.sub, response, reason,
    }).returning();

    return NextResponse.json(resp, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
