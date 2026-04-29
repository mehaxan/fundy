"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  fundId: string;
  fundStatus: string;
  allUsers: { id: string; name: string }[];
}

export default function FundActions({ fundId, fundStatus, allUsers }: Props) {
  const router = useRouter();
  const [showRecordShare, setShowRecordShare] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleStatusChange(newStatus: string) {
    await fetch(`/api/funds/${fundId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    router.refresh();
  }

  async function handleRecordShare(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const data = new FormData(e.currentTarget);
    const res = await fetch(`/api/funds/${fundId}/shares`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: data.get("email"),
        quantity: Number(data.get("quantity")),
        purchasedAt: data.get("purchasedAt"),
      }),
    });
    setLoading(false);
    if (res.ok) {
      setShowRecordShare(false);
      router.refresh();
    } else {
      const json = await res.json();
      setError(json.error);
    }
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {fundStatus === "draft" && (
        <button
          onClick={() => handleStatusChange("active")}
          className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700"
        >
          Activate Fund
        </button>
      )}
      {fundStatus === "active" && (
        <>
          <button
            onClick={() => setShowRecordShare(!showRecordShare)}
            className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
          >
            Record Share Purchase
          </button>
          <button
            onClick={() => handleStatusChange("closed")}
            className="text-sm bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700"
          >
            Close Fund
          </button>
        </>
      )}

      {showRecordShare && (
        <div className="w-full mt-2 bg-blue-50 rounded-xl border border-blue-100 p-4">
          <h3 className="font-medium text-sm mb-3">Record Share Purchase</h3>
          <form onSubmit={handleRecordShare} className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-600 mb-1">User Email</label>
              <input
                name="email"
                type="email"
                required
                placeholder="user@example.com"
                className="border rounded px-2 py-1 text-sm w-64"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Quantity</label>
              <input
                name="quantity"
                type="number"
                min={1}
                required
                className="border rounded px-2 py-1 text-sm w-24"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Purchased At</label>
              <input
                name="purchasedAt"
                type="date"
                required
                className="border rounded px-2 py-1 text-sm"
              />
            </div>
            {error && <p className="text-red-600 text-xs w-full">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setShowRecordShare(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
