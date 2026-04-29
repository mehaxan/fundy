"use client";

import { useState, useEffect } from "react";
import { formatCents, formatDate } from "@/lib/utils";

interface PendingWithdrawal {
  id: string;
  amount: number;
  notes: string | null;
  createdAt: string;
  userName: string;
  userEmail: string;
}

interface WalletRow {
  userId: string;
  userName: string;
  userEmail: string;
  balance: number;
  walletId: string;
}

export default function AdminWalletPage() {
  const [wallets, setWallets] = useState<WalletRow[]>([]);
  const [pending, setPending] = useState<PendingWithdrawal[]>([]);
  const [adjUserId, setAdjUserId] = useState("");
  const [adjDir, setAdjDir] = useState("credit");
  const [adjAmount, setAdjAmount] = useState("");
  const [adjNotes, setAdjNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const [w, p] = await Promise.all([
      fetch("/api/admin/wallet").then((r) => r.json()),
      fetch("/api/admin/wallet/pending").then((r) => r.json()),
    ]);
    setWallets(w);
    setPending(p);
  }

  useEffect(() => { load(); }, []);

  async function handleConfirm(id: string, status: "confirmed" | "rejected") {
    await fetch(`/api/wallet/transactions/${id}/confirm`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function handleAdjustment(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: adjUserId,
        direction: adjDir,
        amount: Math.round(Number(adjAmount) * 100),
        notes: adjNotes,
      }),
    });
    setLoading(false);
    if (res.ok) {
      setAdjUserId(""); setAdjAmount(""); setAdjNotes(""); setAdjDir("credit");
      load();
    } else {
      const json = await res.json();
      setError(json.error);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Wallet Management</h1>

      {pending.length > 0 && (
        <div className="bg-white rounded-xl border border-amber-200">
          <div className="p-4 border-b border-amber-100 bg-amber-50 rounded-t-xl">
            <h2 className="font-semibold text-amber-900">Pending Withdrawals ({pending.length})</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-gray-500 bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2">Member</th>
                <th className="text-left px-4 py-2">Amount</th>
                <th className="text-left px-4 py-2">Notes</th>
                <th className="text-left px-4 py-2">Date</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pending.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-2">{p.userName} <span className="text-gray-400 text-xs">{p.userEmail}</span></td>
                  <td className="px-4 py-2 font-medium">{formatCents(p.amount)}</td>
                  <td className="px-4 py-2 text-gray-500">{p.notes ?? "—"}</td>
                  <td className="px-4 py-2 text-gray-500">{formatDate(p.createdAt)}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      <button onClick={() => handleConfirm(p.id, "confirmed")} className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-2 py-1 rounded">Confirm</button>
                      <button onClick={() => handleConfirm(p.id, "rejected")} className="text-xs bg-red-100 text-red-700 hover:bg-red-200 px-2 py-1 rounded">Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold mb-4">Manual Adjustment</h2>
        <form onSubmit={handleAdjustment} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-600 mb-1">User ID</label>
            <input value={adjUserId} onChange={(e) => setAdjUserId(e.target.value)} required className="border rounded px-3 py-2 text-sm w-64" placeholder="User UUID" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Direction</label>
            <select value={adjDir} onChange={(e) => setAdjDir(e.target.value)} className="border rounded px-3 py-2 text-sm">
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Amount (USD)</label>
            <input type="number" step="0.01" value={adjAmount} onChange={(e) => setAdjAmount(e.target.value)} required className="border rounded px-3 py-2 text-sm w-32" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Notes</label>
            <input value={adjNotes} onChange={(e) => setAdjNotes(e.target.value)} required className="border rounded px-3 py-2 text-sm w-48" />
          </div>
          {error && <p className="text-red-600 text-xs w-full">{error}</p>}
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">
            {loading ? "Saving…" : "Apply"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold">All Member Wallets</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-gray-500 bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2">Member</th>
              <th className="text-left px-4 py-2">Email</th>
              <th className="text-left px-4 py-2">Balance</th>
              <th className="text-left px-4 py-2">User ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {wallets.map((w) => (
              <tr key={w.userId}>
                <td className="px-4 py-2 font-medium">{w.userName}</td>
                <td className="px-4 py-2 text-gray-500">{w.userEmail}</td>
                <td className="px-4 py-2 font-semibold">{formatCents(w.balance)}</td>
                <td className="px-4 py-2 text-xs text-gray-400 font-mono">{w.userId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
