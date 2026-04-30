
import { NextResponse } from "next/server";
import { getSession, requireAdmin } from "@/lib/session";
import { db } from "@/db";
import { walletTransactions, wallets, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (session.role === "admin") {
      const txns = await db
        .select({
          id: walletTransactions.id,
          walletId: walletTransactions.walletId,
          userId: wallets.userId,
          userName: users.name,
          type: walletTransactions.type,
          direction: walletTransactions.direction,
          amount: walletTransactions.amount,
          description: walletTransactions.description,
          createdAt: walletTransactions.createdAt,
        })
        .from(walletTransactions)
        .leftJoin(wallets, eq(walletTransactions.walletId, wallets.id))
        .leftJoin(users, eq(wallets.userId, users.id))
        .orderBy(desc(walletTransactions.createdAt))
        .limit(200);
      return NextResponse.json(txns);
    } else {
      // Member: own wallet's transactions
      const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, session.sub));
      if (!wallet) return NextResponse.json([]);
      const txns = await db.select().from(walletTransactions)
        .where(eq(walletTransactions.walletId, wallet.id))
        .orderBy(desc(walletTransactions.createdAt))
        .limit(100);
      return NextResponse.json(txns);
    }
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
