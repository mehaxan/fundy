import Link from "next/link";
import { db } from "@/db";
import { investments, depositFunds } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { formatCents, formatDate } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  planned: "bg-gray-100 text-gray-700",
  active: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default async function InvestmentsPage() {
  const rows = await db
    .select({
      id: investments.id,
      name: investments.name,
      investedAmount: investments.investedAmount,
      returnAmount: investments.returnAmount,
      status: investments.status,
      startDate: investments.startDate,
      endDate: investments.endDate,
      fundName: depositFunds.name,
    })
    .from(investments)
    .leftJoin(depositFunds, eq(depositFunds.id, investments.fundId))
    .orderBy(desc(investments.createdAt));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Investments</h1>

      <div className="bg-white rounded-xl border border-gray-200">
        {rows.length === 0 ? (
          <p className="text-gray-500 text-sm p-4">No investments yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-gray-500 bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Fund</th>
                <th className="text-left px-4 py-3">Invested</th>
                <th className="text-left px-4 py-3">Return</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Start</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{inv.name}</td>
                  <td className="px-4 py-3 text-gray-500">{inv.fundName ?? "—"}</td>
                  <td className="px-4 py-3">{formatCents(inv.investedAmount)}</td>
                  <td className={`px-4 py-3 font-medium ${inv.returnAmount != null ? (inv.returnAmount >= 0 ? "text-green-600" : "text-red-600") : "text-gray-400"}`}>
                    {inv.returnAmount != null ? formatCents(inv.returnAmount) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[inv.status]}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(inv.startDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
