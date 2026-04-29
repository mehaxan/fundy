"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Deposit {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  currency: string;
  notes: string | null;
  status: "pending" | "approved" | "rejected";
  reviewNotes: string | null;
  createdAt: string;
}

interface Props {
  fundId: string;
  deposits: Deposit[];
  isPrivileged: boolean; // admin or manager
  currentUserId: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

function formatCents(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(new Date(d));
}

export default function DepositActions({ fundId, deposits, isPrivileged, currentUserId }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  async function handleDeposit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitLoading(true);
    setSubmitError("");
    const amountCents = Math.round(parseFloat(amount) * 100);
    if (isNaN(amountCents) || amountCents <= 0) {
      setSubmitError("Enter a valid amount.");
      setSubmitLoading(false);
      return;
    }
    const res = await fetch(`/api/funds/${fundId}/deposits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amountCents, notes: notes.trim() || undefined }),
    });
    setSubmitLoading(false);
    if (res.ok) {
      setShowForm(false);
      setAmount("");
      setNotes("");
      router.refresh();
    } else {
      const json = await res.json();
      setSubmitError(json.error ?? "Failed to submit deposit.");
    }
  }

  async function handleReview(depositId: string, status: "approved" | "rejected") {
    setReviewLoading(true);
    await fetch(`/api/funds/${fundId}/deposits/${depositId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reviewNotes: reviewNote.trim() || undefined }),
    });
    setReviewLoading(false);
    setReviewingId(null);
    setReviewNote("");
    router.refresh();
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold">Deposits</h2>
        {!isPrivileged && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
          >
            Send Money
          </button>
        )}
      </div>

      {/* Deposit submission form (for members) */}
      {showForm && !isPrivileged && (
        <div className="p-4 border-b border-gray-100 bg-blue-50">
          <p className="text-sm text-gray-700 mb-3">
            After sending money to the fund's bank account, submit this form to notify the manager.
          </p>
          <form onSubmit={handleDeposit} className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Amount (USD) *</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="border rounded px-2 py-1.5 text-sm w-32"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="border rounded px-2 py-1.5 text-sm w-56"
                placeholder="Reference number, etc."
              />
            </div>
            {submitError && <p className="text-red-600 text-xs w-full">{submitError}</p>}
            <button
              type="submit"
              disabled={submitLoading}
              className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm disabled:opacity-50"
            >
              {submitLoading ? "Submitting…" : "Submit"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setSubmitError(""); }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {deposits.length === 0 ? (
        <p className="text-sm text-gray-500 p-4">No deposits yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-gray-500 bg-gray-50">
            <tr>
              {isPrivileged && <th className="text-left px-4 py-2">Member</th>}
              <th className="text-left px-4 py-2">Amount</th>
              <th className="text-left px-4 py-2">Notes</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">Date</th>
              {isPrivileged && <th className="px-4 py-2">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {deposits.map((d) => (
              <>
                <tr key={d.id}>
                  {isPrivileged && <td className="px-4 py-2">{d.userName}</td>}
                  <td className="px-4 py-2 font-medium">{formatCents(d.amount)}</td>
                  <td className="px-4 py-2 text-gray-500">{d.notes ?? "—"}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[d.status]}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-400">{formatDate(d.createdAt)}</td>
                  {isPrivileged && d.status === "pending" && (
                    <td className="px-4 py-2">
                      {reviewingId === d.id ? null : (
                        <button
                          onClick={() => setReviewingId(d.id)}
                          className="text-xs bg-gray-100 px-2 py-1 rounded hover:bg-gray-200"
                        >
                          Review
                        </button>
                      )}
                    </td>
                  )}
                  {isPrivileged && d.status !== "pending" && <td />}
                </tr>
                {isPrivileged && reviewingId === d.id && (
                  <tr key={`review-${d.id}`} className="bg-yellow-50">
                    <td colSpan={6} className="px-4 py-3">
                      <div className="flex flex-wrap gap-3 items-end">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Review Notes</label>
                          <input
                            type="text"
                            value={reviewNote}
                            onChange={(e) => setReviewNote(e.target.value)}
                            className="border rounded px-2 py-1.5 text-sm w-64"
                            placeholder="Optional"
                          />
                        </div>
                        <button
                          onClick={() => handleReview(d.id, "approved")}
                          disabled={reviewLoading}
                          className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          {reviewLoading ? "…" : "Approve"}
                        </button>
                        <button
                          onClick={() => handleReview(d.id, "rejected")}
                          disabled={reviewLoading}
                          className="text-xs bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          {reviewLoading ? "…" : "Reject"}
                        </button>
                        <button
                          onClick={() => { setReviewingId(null); setReviewNote(""); }}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
