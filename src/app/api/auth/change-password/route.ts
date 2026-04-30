import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { hashPassword, comparePassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword)
      return NextResponse.json({ error: "currentPassword and newPassword are required" }, { status: 400 });

    if (newPassword.length < 8)
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });

    const [user] = await db.select({ id: users.id, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, session.sub));

    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const valid = await comparePassword(currentPassword, user.passwordHash);
    if (!valid)
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });

    const hashed = await hashPassword(newPassword);
    await db.update(users).set({ passwordHash: hashed }).where(eq(users.id, session.sub));

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 });
  }
}
