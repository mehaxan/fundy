"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateFundDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData(e.currentTarget);

    const sharePriceDollars = parseFloat(data.get("sharePrice") as string);
    if (isNaN(sharePriceDollars) || sharePriceDollars <= 0) {
      setError("Share price must be a positive number.");
      setLoading(false);
      return;
    }

    const body = {
      name: (data.get("name") as string).trim(),
      description: (data.get("description") as string).trim() || undefined,
      sharePrice: Math.round(sharePriceDollars * 100),
      currency: (data.get("currency") as string) || "USD",
      bankName: (data.get("bankName") as string).trim() || undefined,
      bankAccountName: (data.get("bankAccountName") as string).trim() || undefined,
      bankAccountNumber: (data.get("bankAccountNumber") as string).trim() || undefined,
      bankRoutingNumber: (data.get("bankRoutingNumber") as string).trim() || undefined,
      bankSwiftCode: (data.get("bankSwiftCode") as string).trim() || undefined,
      bankInstructions: (data.get("bankInstructions") as string).trim() || undefined,
    };

    const res = await fetch("/api/funds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else {
      const json = await res.json();
      setError(json.error ?? "Failed to create fund.");
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        + Create Fund
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Create New Fund</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Basic info */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Fund Name *</label>
            <input name="name" required className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Growth Fund Q1" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" rows={2} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" placeholder="Optional description" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Share Price (USD) *</label>
              <input name="sharePrice" type="number" min="0.01" step="0.01" required className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. 100.00" />
            </div>
            <div className="w-28">
              <label className="block text-xs font-medium text-gray-700 mb-1">Currency</label>
              <input name="currency" defaultValue="USD" className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          {/* Bank account info */}
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">Bank Account Info</p>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Bank Name</label>
            <input name="bankName" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. First National Bank" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Account Holder Name</label>
            <input name="bankAccountName" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Fund Management LLC" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Account Number</label>
              <input name="bankAccountNumber" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="••••••••" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">Routing Number</label>
              <input name="bankRoutingNumber" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="••••••••" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">SWIFT / BIC Code</label>
            <input name="bankSwiftCode" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. FNBAUS3M" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Payment Instructions</label>
            <textarea name="bankInstructions" rows={2} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" placeholder="Any additional instructions for depositors" />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Creating…" : "Create Fund"}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setError(""); }}
              className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
