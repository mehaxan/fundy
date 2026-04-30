
"use client";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShare, faPlus, faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";
import useSWR from "swr";
import { format } from "date-fns";

const fetcher = (u: string) => fetch(u).then(r => r.json());
function bdt(n: number) { return `৳${(n || 0).toLocaleString("en-IN")}`; }

function Badge({ status }: { status: string }) {
  const m: Record<string, [string, string]> = {
    approved: ["#064e3b", "#10b981"], pending: ["#451a03", "#f59e0b"], rejected: ["#450a0a", "#f87171"],
  };
  const [bg, fg] = m[status] ?? ["#1e293b", "#94a3b8"];
  return <span style={{ background: bg, color: fg, padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: "capitalize" }}>{status}</span>;
}

interface ModalProps { title: string; onClose: () => void; children: React.ReactNode; }
function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="animate-fade-in" onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)",
      overflowY: "auto", padding: "40px 20px",
    }}>
      <div className="animate-fade-up" style={{
        background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 16,
        padding: 28, width: "100%", margin: "0 auto", maxWidth: 480,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#f1f5f9" }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inp: React.CSSProperties = { background: "#141428", border: "1px solid #1e1e38", borderRadius: 8, padding: "9px 12px", color: "#f1f5f9", fontSize: 13, width: "100%", boxSizing: "border-box" };

export default function SharesPage() {
  const { data: shares = [], mutate } = useSWR<Record<string, unknown>[]>("/api/shares", fetcher);
  const { data: funds = [] } = useSWR<Record<string, unknown>[]>("/api/funds", fetcher);
  const { data: me } = useSWR<Record<string, unknown>>("/api/auth/me", fetcher);
  const [showRequest, setShowRequest] = useState(false);
  const [form, setForm] = useState({ fundId: "", quantity: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [filter, setFilter] = useState("all");

  const isAdmin = me?.role === "admin";
  const activeFunds = (funds as Record<string, unknown>[]).filter(f => f.status === "active");

  const filtered = (shares as Record<string, unknown>[]).filter(s => filter === "all" || s.status === filter);

  const selectedFund = activeFunds.find(f => f.id === form.fundId);
  const estimatedCost = selectedFund && form.quantity ? Number(form.quantity) * Number(selectedFund.sharePrice) : 0;

  async function requestShare(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setMsg("");
    const res = await fetch("/api/shares", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fundId: form.fundId, quantity: Number(form.quantity) }) });
    if (res.ok) { mutate(); setShowRequest(false); setForm({ fundId: "", quantity: "" }); }
    else { const j = await res.json(); setMsg(j.error); }
    setSaving(false);
  }

  async function processShare(id: string, status: "approved" | "rejected") {
    await fetch(`/api/shares/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    mutate();
  }

  const stats = {
    total: shares.length,
    approved: shares.filter(s => s.status === "approved").length,
    pending: shares.filter(s => s.status === "pending").length,
    totalValue: shares.filter(s => s.status === "approved").reduce((a, s) => a + Number(s.totalAmount ?? 0), 0),
  };

  return (
    <div className="animate-fade-up">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#f1f5f9", letterSpacing: -0.5 }}>Shares</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>Share purchase requests and approvals</p>
        </div>
        <button onClick={() => setShowRequest(true)} style={{
          background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none",
          borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <FontAwesomeIcon icon={faPlus} /> Request Shares
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Requests", value: stats.total, color: "#7c3aed" },
          { label: "Approved", value: stats.approved, color: "#10b981" },
          { label: "Pending", value: stats.pending, color: "#f59e0b" },
          { label: "Total Value", value: bdt(stats.totalValue), color: "#3b82f6" },
        ].map(s => (
          <div key={s.label} style={{ background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {["all", "pending", "approved", "rejected"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
            border: "none", background: filter === f ? "#7c3aed" : "#141428",
            color: filter === f ? "#fff" : "#64748b", textTransform: "capitalize",
          }}>{f}</button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 14, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Member", "Fund", "Qty", "Unit Price", "Total", "Status", "Requested", isAdmin ? "Actions" : ""].map(h => (
                <th key={h} style={{ textAlign: "left", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, padding: "12px 16px", borderBottom: "1px solid #1e1e38" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s: Record<string, unknown>) => (
              <tr key={String(s.id)} style={{ transition: "background 0.1s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#0e0e1c80")}
                onMouseLeave={e => (e.currentTarget.style.background = "")}>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid #141428", fontSize: 13, color: "#f1f5f9", fontWeight: 600 }}>{String(s.userName ?? "—")}</td>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid #141428", fontSize: 13, color: "#94a3b8" }}>{String(s.fundName ?? "—")}</td>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid #141428", fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{Number(s.quantity).toLocaleString()}</td>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid #141428", fontSize: 13, color: "#a78bfa" }}>{bdt(Number(s.unitPrice))}</td>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid #141428", fontSize: 13, fontWeight: 700, color: "#10b981" }}>{bdt(Number(s.totalAmount))}</td>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid #141428" }}><Badge status={String(s.status)} /></td>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid #141428", fontSize: 12, color: "#64748b" }}>{s.requestedAt ? format(new Date(String(s.requestedAt)), "dd MMM yyyy") : "—"}</td>
                {isAdmin && (
                  <td style={{ padding: "12px 16px", borderBottom: "1px solid #141428" }}>
                    {s.status === "pending" && (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => processShare(String(s.id), "approved")} style={{ background: "#064e3b", color: "#10b981", border: "none", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                          <FontAwesomeIcon icon={faCheck} style={{ fontSize: 10 }} /> Approve
                        </button>
                        <button onClick={() => processShare(String(s.id), "rejected")} style={{ background: "#450a0a", color: "#f87171", border: "none", borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                          <FontAwesomeIcon icon={faXmark} style={{ fontSize: 10 }} /> Reject
                        </button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#334155", fontSize: 13 }}>No share requests found</div>
        )}
      </div>

      {/* Request Modal */}
      {showRequest && (
        <Modal title="Request Share Purchase" onClose={() => setShowRequest(false)}>
          <form onSubmit={requestShare} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 6 }}>Fund *</label>
              <select required value={form.fundId} onChange={e => setForm(f => ({...f, fundId: e.target.value}))} style={inp}>
                <option value="">Select a fund…</option>
                {activeFunds.map(f => (
                  <option key={String(f.id)} value={String(f.id)}>{String(f.name)} — {bdt(Number(f.sharePrice))}/share</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 6 }}>Number of Shares *</label>
              <input required type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({...f, quantity: e.target.value}))} style={inp} placeholder="e.g. 10" />
            </div>
            {estimatedCost > 0 && (
              <div style={{ background: "#141428", border: "1px solid #1e1e38", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Estimated Cost</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#10b981" }}>{bdt(estimatedCost)}</div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{form.quantity} shares × {bdt(Number(selectedFund?.sharePrice ?? 0))}</div>
              </div>
            )}
            {msg && <div style={{ color: "#f87171", fontSize: 12 }}>{msg}</div>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setShowRequest(false)} style={{ background: "#141428", border: "1px solid #1e1e38", color: "#94a3b8", borderRadius: 8, padding: "9px 16px", fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button type="submit" disabled={saving} style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                {saving ? "Submitting…" : "Submit Request"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
