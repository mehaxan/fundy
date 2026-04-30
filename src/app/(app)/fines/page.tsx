
"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTriangleExclamation, faPencil } from "@fortawesome/free-solid-svg-icons";
import useSWR from "swr";
import { format } from "date-fns";

const fetcher = (u: string) => fetch(u).then(r => r.json());
function bdt(n: number) { return `৳${(n || 0).toLocaleString("en-IN")}`; }

function Badge({ status }: { status: string }) {
  const m: Record<string, [string, string]> = {
    pending: ["#451a03", "#f59e0b"], paid: ["#064e3b", "#10b981"],
    waived: ["#1e3a5f", "#60a5fa"], cancelled: ["#450a0a", "#ef4444"],
  };
  const [bg, fg] = m[status] ?? ["#1e293b", "#94a3b8"];
  return <span style={{ background: bg, color: fg, padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: "capitalize" }}>{status}</span>;
}

interface ModalProps { title: string; onClose: () => void; children: React.ReactNode; }
function Modal({ title, onClose, children }: ModalProps) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);
  return createPortal(
    <>
      <div className="animate-fade-in" onClick={onClose} style={{
        position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.5)",
      }} />
      <div className="animate-slide-right" style={{
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 1001, width: "min(480px, 100vw)",
        background: "#0e0e1c", borderLeft: "1px solid #1e1e38",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "28px 32px 20px", flexShrink: 0, borderBottom: "1px solid #1e1e38" }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#f1f5f9" }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px 0 32px", display: "flex", flexDirection: "column" }}>
          {children}
        </div>
      </div>
    </>,
    document.body
  );
}

const inp: React.CSSProperties = { background: "#141428", border: "1px solid #1e1e38", borderRadius: 8, padding: "9px 12px", color: "#f1f5f9", fontSize: 13, width: "100%", boxSizing: "border-box" };

export default function FinesPage() {
  const { data: fines = [], mutate, isLoading } = useSWR<Record<string, unknown>[]>("/api/fines", fetcher);
  const { data: users = [] } = useSWR<Record<string, unknown>[]>("/api/users", fetcher);
  const { data: me } = useSWR<Record<string, unknown>>("/api/auth/me", fetcher);
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({ userId: "", reason: "", amount: "", dueDate: "" });
  const [editForm, setEditForm] = useState({ status: "pending", notes: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [filter, setFilter] = useState("all");

  const isAdmin = me?.role === "admin";
  const filtered = (fines as Record<string, unknown>[]).filter(f => filter === "all" || f.status === filter);

  const totalPending = fines.filter(f => f.status === "pending").reduce((a, f) => a + Number(f.amount ?? 0), 0);
  const totalPaid = fines.filter(f => f.status === "paid").reduce((a, f) => a + Number(f.amount ?? 0), 0);
  const countPending = fines.filter(f => f.status === "pending").length;

  async function createFine(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setMsg("");
    const res = await fetch("/api/fines", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, amount: Number(form.amount) }) });
    if (res.ok) { mutate(); setShowCreate(false); setForm({ userId: "", reason: "", amount: "", dueDate: "" }); }
    else { const j = await res.json(); setMsg(j.error); }
    setSaving(false);
  }

  async function updateFine(e: React.FormEvent) {
    e.preventDefault(); if (!editItem) return; setSaving(true); setMsg("");
    const res = await fetch(`/api/fines/${editItem.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
    if (res.ok) { mutate(); setEditItem(null); }
    else { const j = await res.json(); setMsg(j.error); }
    setSaving(false);
  }

  function openEdit(f: Record<string, unknown>) {
    setEditItem(f);
    setEditForm({ status: String(f.status ?? "pending"), notes: String(f.notes ?? "") });
    setMsg("");
  }

  return (
    <div className="animate-fade-up">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#f1f5f9", letterSpacing: -0.5 }}>Fines</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>Member fines and penalty management</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setShowCreate(true); setMsg(""); }} style={{
            background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none",
            borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <FontAwesomeIcon icon={faPlus} /> Issue Fine
          </button>
        )}
      </div>

      {/* KPI */}
      <div className="stats-grid">
        {[
          { label: "Total Fines", value: String(fines.length), color: "#7c3aed" },
          { label: "Pending", value: `${countPending} (${bdt(totalPending)})`, color: "#f59e0b" },
          { label: "Paid", value: bdt(totalPaid), color: "#10b981" },
          { label: "Waived", value: String(fines.filter(f => f.status === "waived").length), color: "#60a5fa" },
        ].map(s => (
          <div key={s.label} style={{ background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {["all", "pending", "paid", "waived", "cancelled"].map(f => (
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
              {[isAdmin ? "Member" : null, "Reason", "Amount", "Due Date", "Status", "Paid At", isAdmin ? "" : null].filter(Boolean).map(h => (
                <th key={String(h)} style={{ textAlign: "left", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, padding: "12px 16px", borderBottom: "1px solid #1e1e38" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? [...Array(4)].map((_, i) => (
              <tr key={i}><td colSpan={7} style={{ padding: 14 }}><div style={{ height: 14, background: "#141428", borderRadius: 4, width: "70%" }} /></td></tr>
            )) : filtered.map((f: Record<string, unknown>) => (
              <tr key={String(f.id)} onMouseEnter={e => (e.currentTarget.style.background = "#0e0e1c80")} onMouseLeave={e => (e.currentTarget.style.background = "")}>
                {isAdmin && <td style={{ padding: "12px 16px", borderBottom: "1px solid #141428", fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{String(f.userName ?? "—")}</td>}
                <td style={{ padding: "12px 16px", borderBottom: "1px solid #141428", fontSize: 13, color: "#94a3b8", maxWidth: 250 }}>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{String(f.reason)}</div>
                  {!!f.notes && <div style={{ fontSize: 11, color: "#475569" }}>{String(f.notes).slice(0, 60)}</div>}
                </td>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid #141428", fontSize: 14, fontWeight: 700, color: "#f87171" }}>{bdt(Number(f.amount))}</td>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid #141428", fontSize: 12, color: "#64748b" }}>{f.dueDate ? format(new Date(String(f.dueDate)), "dd MMM yyyy") : "—"}</td>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid #141428" }}><Badge status={String(f.status)} /></td>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid #141428", fontSize: 12, color: "#64748b" }}>{f.paidAt ? format(new Date(String(f.paidAt)), "dd MMM yyyy") : "—"}</td>
                {isAdmin && (
                  <td style={{ padding: "12px 16px", borderBottom: "1px solid #141428" }}>
                    <button onClick={() => openEdit(f)} style={{ background: "#141428", border: "1px solid #1e1e38", borderRadius: 6, padding: "5px 9px", cursor: "pointer", color: "#94a3b8" }}>
                      <FontAwesomeIcon icon={faPencil} style={{ fontSize: 11 }} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#334155", fontSize: 13 }}>No fines found</div>
        )}
      </div>

      {/* Issue Fine Modal */}
      {showCreate && (
        <Modal title="Issue Fine" onClose={() => setShowCreate(false)}>
          <form onSubmit={createFine} style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
            <div>
              <label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 4 }}>Member *</label>
              <select required value={form.userId} onChange={e => setForm(f => ({...f, userId: e.target.value}))} style={inp}>
                <option value="">Select member…</option>
                {(users as Record<string, unknown>[]).map(u => (
                  <option key={String(u.id)} value={String(u.id)}>{String(u.name)}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 4 }}>Reason *</label>
              <textarea required value={form.reason} onChange={e => setForm(f => ({...f, reason: e.target.value}))} style={{ ...inp, resize: "vertical", minHeight: 60 }} placeholder="Reason for fine…" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 4 }}>Amount (BDT) *</label>
                <input required type="number" min="1" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} style={inp} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 4 }}>Due Date</label>
                <input type="date" value={form.dueDate} onChange={e => setForm(f => ({...f, dueDate: e.target.value}))} style={inp} />
              </div>
            </div>
            {msg && <div style={{ color: "#f87171", fontSize: 12 }}>{msg}</div>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: "auto", paddingTop: 16, paddingBottom: 28 }}>
              <button type="button" onClick={() => setShowCreate(false)} style={{ background: "#141428", border: "1px solid #1e1e38", color: "#94a3b8", borderRadius: 8, padding: "9px 16px", fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button type="submit" disabled={saving} style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                {saving ? "Issuing…" : "Issue Fine"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Update Status Modal */}
      {editItem && (
        <Modal title="Update Fine" onClose={() => setEditItem(null)}>
          <div style={{ background: "#141428", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9", marginBottom: 4 }}>{String(editItem.reason)}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#f87171" }}>{bdt(Number(editItem.amount))}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{String(editItem.userName ?? "")}</div>
          </div>
          <form onSubmit={updateFine} style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
            <div>
              <label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 4 }}>Status</label>
              <select value={editForm.status} onChange={e => setEditForm(f => ({...f, status: e.target.value}))} style={inp}>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="waived">Waived</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 4 }}>Notes</label>
              <input value={editForm.notes} onChange={e => setEditForm(f => ({...f, notes: e.target.value}))} style={inp} placeholder="Admin notes…" />
            </div>
            {msg && <div style={{ color: "#f87171", fontSize: 12 }}>{msg}</div>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: "auto", paddingTop: 16, paddingBottom: 28 }}>
              <button type="button" onClick={() => setEditItem(null)} style={{ background: "#141428", border: "1px solid #1e1e38", color: "#94a3b8", borderRadius: 8, padding: "9px 16px", fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button type="submit" disabled={saving} style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                {saving ? "Saving…" : "Update"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
