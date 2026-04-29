import { formatCents, formatDate } from "@/lib/utils";

async function getDashboard() {
  // Direct db call — server component
  const { db } = await import("@/db");
  const { wallets, walletTransactions, depositFunds, shares, users } = await import("@/db/schema");
  const { getSession } = await import("@/lib/session");
  const { eq, and, count, desc } = await import("drizzle-orm");

  const session = await getSession();
  if (!session) return null;

  const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, session.sub));

  const myShares = await db
    .select({ quantity: shares.quantity, unitPrice: shares.unitPrice })
    .from(shares)
    .where(and(eq(shares.userId, session.sub), eq(shares.status, "confirmed")));

  const totalInvested = myShares.reduce((acc, s) => acc + s.quantity * s.unitPrice, 0);

  const recentTxns = wallet
    ? await db
        .select()
        .from(walletTransactions)
        .where(eq(walletTransactions.walletId, wallet.id))
        .orderBy(desc(walletTransactions.createdAt))
        .limit(5)
    : [];

  const activeFunds = await db
    .select({ id: depositFunds.id })
    .from(depositFunds)
    .where(eq(depositFunds.status, "active"));

  let adminStats = null;
  if (session.role === "admin" || session.role === "manager") {
    const [{ total: totalUsers }] = await db.select({ total: count() }).from(users);
    const [{ total: pendingWithdrawals }] = await db
      .select({ total: count() })
      .from(walletTransactions)
      .where(and(eq(walletTransactions.type, "withdrawal"), eq(walletTransactions.status, "pending")));
    const [{ total: pendingShares }] = await db
      .select({ total: count() })
      .from(shares)
      .where(eq(shares.status, "pending"));
    adminStats = { totalUsers, pendingWithdrawals, pendingShares };
  }

  return { wallet, totalInvested, activeFundsCount: activeFunds.length, recentTxns, adminStats, role: session.role };
}

export default async function DashboardPage() {
  const data = await getDashboard();
  if (!data) return null;

  const { wallet, totalInvested, activeFundsCount, recentTxns, adminStats } = data;

  const stats = [
    { label: "Wallet Balance", value: formatCents(wallet?.balance ?? 0) },
    { label: "Total Invested", value: formatCents(totalInvested) },
    { label: "Active Funds", value: activeFundsCount.toString() },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {adminStats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Members", value: adminStats.totalUsers },
            { label: "Pending Withdrawals", value: adminStats.pendingWithdrawals },
            { label: "Pending Shares", value: adminStats.pendingShares },
          ].map((s) => (
            <div key={s.label} className="bg-amber-50 rounded-xl border border-amber-100 p-5">
              <p className="text-sm text-amber-700">{s.label}</p>
              <p className="text-2xl font-semibold text-amber-900 mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Transactions</h2>
        </div>
        {recentTxns.length === 0 ? (
          <p className="text-gray-500 text-sm p-4">No transactions yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-gray-500 text-xs uppercase bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2">Type</th>
                <th className="text-left px-4 py-2">Amount</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentTxns.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-2 capitalize">{t.type.replace(/_/g, " ")}</td>
                  <td className={`px-4 py-2 font-medium ${t.direction === "credit" ? "text-green-600" : "text-red-600"}`}>
                    {t.direction === "credit" ? "+" : "-"}{formatCents(t.amount)}
                  </td>
                  <td className="px-4 py-2 capitalize">{t.status}</td>
                  <td className="px-4 py-2 text-gray-500">{formatDate(t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
