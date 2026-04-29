import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { depositFunds, shares, users, investments } from "@/db/schema";
import { formatCents, formatDate } from "@/lib/utils";
import { getSession } from "@/lib/session";
import FundActions from "./fund-actions";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  active: "bg-green-100 text-green-700",
  closed: "bg-red-100 text-red-700",
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default async function FundPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();

  const [fund] = await db.select().from(depositFunds).where(eq(depositFunds.id, id));
  if (!fund) notFound();

  const fundShares = await db
    .select({
      shareId: shares.id,
      userId: shares.userId,
      userName: users.name,
      quantity: shares.quantity,
      unitPrice: shares.unitPrice,
      status: shares.status,
      purchasedAt: shares.purchasedAt,
      notes: shares.notes,
    })
    .from(shares)
    .innerJoin(users, eq(users.id, shares.userId))
    .where(eq(shares.fundId, id));

  const confirmed = fundShares.filter((s) => s.status === "confirmed");
  const totalShares = confirmed.reduce((acc, s) => acc + s.quantity, 0);
  const totalValue = totalShares * fund.sharePrice;

  const fundInvestments = await db.select().from(investments).where(eq(investments.fundId, id));

  const isAdmin = session?.role === "admin" || session?.role === "manager";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{fund.name}</h1>
          {fund.description && <p className="text-gray-500 mt-1">{fund.description}</p>}
        </div>
        <span className={`text-sm px-3 py-1 rounded-full capitalize ${STATUS_COLORS[fund.status]}`}>
          {fund.status}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Share Price", value: formatCents(fund.sharePrice) },
          { label: "Total Shares", value: totalShares.toString() },
          { label: "Total Value", value: formatCents(totalValue) },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-xl font-semibold text-gray-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {isAdmin && <FundActions fundId={id} fundStatus={fund.status} allUsers={[]} />}

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold">Shares</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-gray-500 bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2">Member</th>
              <th className="text-left px-4 py-2">Qty</th>
              <th className="text-left px-4 py-2">Value</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">Date</th>
              {isAdmin && <th className="px-4 py-2"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {fundShares.map((s) => (
              <tr key={s.shareId}>
                <td className="px-4 py-2">{s.userName}</td>
                <td className="px-4 py-2">{s.quantity}</td>
                <td className="px-4 py-2">{formatCents(s.quantity * s.unitPrice)}</td>
                <td className="px-4 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[s.status]}`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-500">{formatDate(s.purchasedAt)}</td>
                {isAdmin && s.status === "pending" && (
                  <td className="px-4 py-2">
                    <ShareConfirmButtons shareId={s.shareId} />
                  </td>
                )}
                {isAdmin && s.status !== "pending" && <td />}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold">Investments</h2>
        </div>
        {fundInvestments.length === 0 ? (
          <p className="text-sm text-gray-500 p-4">No investments for this fund.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-gray-500 bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2">Name</th>
                <th className="text-left px-4 py-2">Invested</th>
                <th className="text-left px-4 py-2">Return</th>
                <th className="text-left px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fundInvestments.map((inv) => (
                <tr key={inv.id}>
                  <td className="px-4 py-2 font-medium">{inv.name}</td>
                  <td className="px-4 py-2">{formatCents(inv.investedAmount)}</td>
                  <td className="px-4 py-2">
                    {inv.returnAmount != null ? formatCents(inv.returnAmount) : "—"}
                  </td>
                  <td className="px-4 py-2 capitalize">{inv.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function ShareConfirmButtons({ shareId }: { shareId: string }) {
  return (
    <div className="flex gap-2">
      <ConfirmShareBtn shareId={shareId} status="confirmed" />
      <ConfirmShareBtn shareId={shareId} status="rejected" />
    </div>
  );
}

function ConfirmShareBtn({ shareId, status }: { shareId: string; status: "confirmed" | "rejected" }) {
  async function action() {
    "use server";
    const { db } = await import("@/db");
    const { shares } = await import("@/db/schema");
    const { getSession } = await import("@/lib/session");
    const { eq } = await import("drizzle-orm");
    const { revalidatePath } = await import("next/cache");

    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "manager")) return;

    await db.update(shares).set({ status, confirmedBy: session.sub, confirmedAt: new Date() }).where(eq(shares.id, shareId));
    revalidatePath("/funds/[id]", "page");
  }

  return (
    <form action={action}>
      <button
        type="submit"
        className={`text-xs px-2 py-1 rounded ${status === "confirmed" ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"}`}
      >
        {status === "confirmed" ? "Confirm" : "Reject"}
      </button>
    </form>
  );
}
