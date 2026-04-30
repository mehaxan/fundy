
import { NextResponse } from "next/server";
import { requireAdmin, getSession } from "@/lib/session";
import { db } from "@/db";
import { monthlySnapshots, investments, assets, wallets, users } from "@/db/schema";
import { eq, sum, count, and } from "drizzle-orm";

export async function GET() {
  try {
    await getSession();
    const snaps = await db.select().from(monthlySnapshots).orderBy(monthlySnapshots.year, monthlySnapshots.month);
    return NextResponse.json(snaps);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST() {
  try {
    await requireAdmin();

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // Gather current data
    const [invResult] = await db.select({
      totalInvested: sum(investments.investedAmount),
      totalReturns: sum(investments.actualReturn),
    }).from(investments).where(eq(investments.status, "active"));

    const [assetResult] = await db.select({
      totalAssets: sum(assets.currentValue),
    }).from(assets).where(eq(assets.status, "active"));

    const [walletResult] = await db.select({
      totalWallet: sum(wallets.balance),
    }).from(wallets);

    const [memberResult] = await db.select({
      total: count(users.id),
    }).from(users).where(eq(users.isActive, true));

    const totalInvested = Number(invResult?.totalInvested ?? 0);
    const totalReturns = Number(invResult?.totalReturns ?? 0);
    const totalAssets = Number(assetResult?.totalAssets ?? 0);
    const totalWalletBalance = Number(walletResult?.totalWallet ?? 0);
    const totalMembers = Number(memberResult?.total ?? 0);
    const netWorth = totalInvested + totalReturns + totalAssets + totalWalletBalance;

    const [snap] = await db.insert(monthlySnapshots).values({
      year, month, totalInvested, totalReturns, totalAssets,
      totalWalletBalance, totalMembers, netWorth,
    }).returning();

    return NextResponse.json(snap, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (err instanceof Error && err.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
