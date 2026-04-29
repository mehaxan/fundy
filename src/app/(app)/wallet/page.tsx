"use client";

import { useState, useEffect } from "react";
import { formatCents, formatDate } from "@/lib/utils";

interface Transaction {
  id: string;
  type: string;
  direction: "credit" | "debit";
  amount: number;
  status: string;
  notes: string | null;
  createdAt: string;
}

interface WalletData {
  balance: number;
  pendingDebits: number;
  transactions: Transaction[];
}

export default function WalletPage() {
  const [data, setData] = useState<WalletData | null>(null);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/wallet");
    if (res.ok) setData(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/wallet/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Math.round(Number(amount) * 100), notes }),
    });
    setLoading(false);
    if (res.ok) {
      setAmount("");
      setNotes("");
      load();
    } else {
      const json = await res.json();
      setError(json.error);
    }
  }

  if (!data) return <div className="text-gray-500">Loading…</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Available Balance</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{formatCents(data.balance)}</p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-100 p-5">
          <p className="text-sm text-amber-700">Pending Withdrawals</p>
          <p className="text-3xl font-bold text-amber-900 mt-1">{formatCents(data.pendingDebits)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold mb-4">Request Withdrawal</h2>
        <form onSubmit={handleWithdraw} className="flex gap-3 flex-wrap items-end">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Amount (USD)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="border rounded px-3 py-2 text-sm w-36"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Notes</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="border rounded px-3 py-2 text-sm w-64"
              placeholder="Optional"
            />
          </div>
          {error && <p className="text-red-600 text-xs w-full">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
          >
            {loading ? "Requesting…" : "Request"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold">Transaction History</h2>
        </div>
        {data.transactions.length === 0 ? (
          <p className="text-sm text-gray-500 p-4">No transactions yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-gray-500 bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2">Type</th>
                <th className="text-left px-4 py-2">Amount</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Notes</th>
                <th className="text-left px-4 py-2">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.transactions.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-2 capitalize">{t.type.replace(/_/g, " ")}</td>
                  <td className={`px-4 py-2 font-medium ${t.direction === "credit" ? "text-green-600" : "text-red-600"}`}>
                    {t.direction === "credit" ? "+" : "-"}{formatCents(t.amount)}
                  </td>
                  <td className="px-4 py-2 capitalize text-gray-500">{t.status}</td>
                  <td className="px-4 py-2 text-gray-400">{t.notes ?? "—"}</td>
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
