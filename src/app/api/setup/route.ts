import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, wallets } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { count } from "drizzle-orm";

// POST /api/setup — create first admin user (only if no users exist)
export async function POST(req: NextRequest) {
  const [{ total }] = await db.select({ total: count() }).from(users);
  if (total > 0) {
    return NextResponse.json({ error: "Already set up" }, { status: 403 });
  }

  const { email, name, password } = await req.json();
  if (!email || !name || !password) {
    return NextResponse.json({ error: "email, name, password required" }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(users)
    .values({ email: email.toLowerCase(), name, role: "admin", passwordHash })
    .returning({ id: users.id, email: users.email, name: users.name, role: users.role });

  await db.insert(wallets).values({ userId: user.id });

  return NextResponse.json(user, { status: 201 });
}
