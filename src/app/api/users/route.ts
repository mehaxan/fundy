import { NextRequest, NextResponse } from "next/server";
import { eq, count } from "drizzle-orm";
import { db } from "@/db";
import { users, wallets } from "@/db/schema";
import { requireRole } from "@/lib/session";
import { hashPassword } from "@/lib/auth";

// GET /api/users — admin/manager only
export async function GET() {
  try {
    await requireRole("admin", "manager");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      walletBalance: wallets.balance,
    })
    .from(users)
    .leftJoin(wallets, eq(wallets.userId, users.id))
    .orderBy(users.createdAt);

  return NextResponse.json(rows);
}

// POST /api/users — admin only (invite/create user)
export async function POST(req: NextRequest) {
  try {
    await requireRole("admin");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email, name, role, password } = await req.json();
  if (!email || !name || !password) {
    return NextResponse.json({ error: "email, name, password required" }, { status: 400 });
  }

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email.toLowerCase()));
  if (existing.length) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(users)
    .values({ email: email.toLowerCase(), name, role: role ?? "member", passwordHash })
    .returning({ id: users.id, email: users.email, name: users.name, role: users.role });

  // Create wallet for user
  await db.insert(wallets).values({ userId: user.id });

  return NextResponse.json(user, { status: 201 });
}
