import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { users, wallets } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { hashPassword } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const rows = await db.select({
      id: users.id, name: users.name, email: users.email,
      phone: users.phone, role: users.role, isActive: users.isActive,
      address: users.address, joinedAt: users.joinedAt, createdAt: users.createdAt,
      walletBalance: wallets.balance,
    }).from(users).leftJoin(wallets, eq(wallets.userId, users.id)).orderBy(desc(users.createdAt));
    return NextResponse.json(rows);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { name, email, phone, password, role, address } = await req.json();
    if (!name || !email || !password) return NextResponse.json({ error: "name, email, password required" }, { status: 400 });
    const passwordHash = await hashPassword(password);
    const [user] = await db.insert(users).values({
      name, email: email.toLowerCase().trim(), phone, passwordHash,
      role: role ?? "member", address,
    }).returning();
    await db.insert(wallets).values({ userId: user.id });
    return NextResponse.json(user, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Server error";
    if (msg.includes("unique")) return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 403 });
  }
}
