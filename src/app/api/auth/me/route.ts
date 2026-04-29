import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, wallets } from "@/db/schema";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user] = await db.select().from(users).where(eq(users.id, session.sub));
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, user.id));

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    walletBalance: wallet?.balance ?? 0,
  });
}
