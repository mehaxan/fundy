import Link from "next/link";
import { db } from "@/db";
import { depositFunds } from "@/db/schema";
import { desc } from "drizzle-orm";
import { formatCents, formatDate } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  active: "bg-green-100 text-green-700",
  closed: "bg-red-100 text-red-700",
};

export default async function FundsPage() {
  const funds = await db.select().from(depositFunds).orderBy(desc(depositFunds.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Funds</h1>
      </div>

      {funds.length === 0 ? (
        <p className="text-gray-500">No funds yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {funds.map((f) => (
            <Link
              key={f.id}
              href={`/funds/${f.id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <h2 className="font-semibold text-gray-900">{f.name}</h2>
                <span className={`text-xs px-2 py-1 rounded-full capitalize ${STATUS_COLORS[f.status]}`}>
                  {f.status}
                </span>
              </div>
              {f.description && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{f.description}</p>}
              <div className="text-sm text-gray-600">
                Share price: <span className="font-medium">{formatCents(f.sharePrice)}</span>
              </div>
              <div className="text-xs text-gray-400 mt-2">{formatDate(f.createdAt)}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
