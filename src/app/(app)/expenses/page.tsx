
"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faReceipt, faPencil, faTrash, faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";
import useSWR from "swr";
import { format } from "date-fns";

const fetcher = (u: string) => fetch(u).then(r => { if (!r.ok) throw new Error("API error"); return r.json(); });
function bdt(n: number) { return `৳${(n || 0).toLocaleString("en-IN")}`; }

const CATEGORIES = ["general", "office", "travel", "utilities", "maintenance", "events", "marketing", "legal", "other"];

function Badge({ status }: { status: string }) {
  const m: Record<string, [string, string]> = {
    pending: ["#451a03", "#f59e0b"],
    approved: ["#064e3b", "#10b981"],
    rejected: ["#450a0a", "#ef4444"],
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
const btn = (color: string): React.CSSProperties => ({ background: color, color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" });

const emptyForm = { title: "", description: "", amount: "", category: "general", expenseDate: new Date().toISOString().slice(0, 10), fundId: "", receiptUrl: "", notes: "" };

export default function ExpensesPage() {
  const { data: expenses = [], mutate, isLoading } = useSWR<Record<string, unknown>[]>("/api/expenses", fetcher);
  const { data: funds = [] } = useSWR<Record<string, unknown>[]>("/api/funds", fetcher);
  const { data: me } = useSWR<Record<string, unknown>>("/api/auth/me", fetcher);
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [filter, setFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");

  const isAdmin = me?.role === "admin";

  const filtered = expenses.filter(e => {
    const statusOk = filter === "all" || e.status === filter;
    const catOk = catFilter === "all" || e.category === catFilter;
    return statusOk && catOk;
  });

  const totalApproved = expenses.filter(e => e.status === "approved").reduce((a, e) => a + Number(e.amount ?? 0), 0);
  const totalPending = expenses.filter(e => e.status === "pending").reduce((a, e) => a + Number(e.amount ?? 0), 0);
  const countPending = expenses.filter(e => e.status === "pending").length;

  async function createExpense(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setMsg("");
    const res = await fetch("/api/expenses", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: Number(form.amount), fundId: form.fundId || null }),
    });
    if (res.ok) { mutate(); setShowCreate(false); setForm(emptyForm); }
    else { const j = await res.json(); setMsg(j.error); }
    setSaving(false);
  }

  async function updateExpense(e: React.FormEvent) {
    e.preventDefault(); if (!editItem) return; setSaving(true); setMsg("");
    const res = await fetch(`/api/expenses/${editItem.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: Number(form.amount), fundId: form.fundId || null }),
    });
    if (res.ok) { mutate(); setEditItem(null); }
    else { const j = await res.json(); setMsg(j.error); }
    setSaving(false);
  }

  async function setStatus(id: string, status: string) {
    await fetch(`/api/expenses/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    mutate();
  }

  async function deleteExpense(id: string) {
    if (!confirm("Delete this expense?")) return;
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    mutate();
  }

  function openEdit(item: Record<string, unknown>) {
    setEditItem(item);
    setForm({
      title: String(item.title ?? ""),
      description: String(item.description ?? ""),
      amount: String(item.amount ?? ""),
      category: String(item.category ?? "general"),
      expenseDate: item.expenseDate ? new Date(String(item.expenseDate)).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      fundId: String(item.fundId ?? ""),
      receiptUrl: String(item.receiptUrl ?? ""),
      notes: String(item.notes ?? ""),
    });
    setMsg("");
  }

  const formFields = (
    <form onSubmit={editItem ? updateExpense : createExpense} style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
      <div>
        <label style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Title *</label>
        <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inp} placeholder="e.g. Office supplies" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Amount (BDT) *</label>
          <input required type="number" min="1" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} style={inp} placeholder="0" />
        </div>
        <div>
          <label style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Date *</label>
          <input required type="date" value={form.expenseDate} onChange={e => setForm(f => ({ ...f, expenseDate: e.target.value }))} style={inp} />
        </div>
      </div>
      <div>
        <label style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Category</label>
        <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inp}>
          {CATEGORIES.map(c => <option key={c} value={c} style={{ background: "#141428" }}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
      </div>
      <div>
        <label style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Fund (optional)</label>
        <select value={form.fundId} onChange={e => setForm(f => ({ ...f, fundId: e.target.value }))} style={inp}>
          <option value="" style={{ background: "#141428" }}>— None —</option>
          {(funds as Record<string, unknown>[]).map(fund => (
            <option key={String(fund.id)} value={String(fund.id)} style={{ background: "#141428" }}>{String(fund.name)}</option>
          ))}
        </select>
      </div>
      <div>
        <label style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Description</label>
        <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ ...inp, resize: "vertical", minHeight: 72 }} placeholder="Details about this expense" />
      </div>
      <div>
        <label style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Receipt URL</label>
        <input value={form.receiptUrl} onChange={e => setForm(f => ({ ...f, receiptUrl: e.target.value }))} style={inp} placeholder="https://..." />
      </div>
      <div>
        <label style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Notes</label>
        <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ ...inp, resize: "vertical", minHeight: 60 }} placeholder="Internal notes" />
      </div>
      {msg && <div style={{ color: "#ef4444", fontSize: 12 }}>{msg}</div>}
      <div style={{ display: "flex", gap: 10, paddingBottom: 24, marginTop: "auto", paddingTop: 8 }}>
        <button type="submit" disabled={saving} style={btn("linear-gradient(135deg,#7c3aed,#4f46e5)")}>{saving ? "Saving…" : editItem ? "Update" : "Create"}</button>
        <button type="button" onClick={() => { setShowCreate(false); setEditItem(null); }} style={{ ...btn("#1e293b"), color: "#94a3b8" }}>Cancel</button>
      </div>
    </form>
  );

  return (
    <div className="animate-fade-up">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#f1f5f9", letterSpacing: -0.5 }}>Expenses</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>Track and manage group expenses</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setShowCreate(true); setEditItem(null); setForm(emptyForm); setMsg(""); }} style={{
            background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none",
            borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <FontAwesomeIcon icon={faPlus} /> Add Expense
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="expenses-summary">
        <div style={{ background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 12, padding: "14px 18px" }}>
          <div style={{ fontSize: 10, color: "#475569", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Total Approved</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#10b981" }}>{bdt(totalApproved)}</div>
        </div>
        <div style={{ background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 12, padding: "14px 18px" }}>
          <div style={{ fontSize: 10, color: "#475569", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Pending Amount</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#f59e0b" }}>{bdt(totalPending)}</div>
        </div>
        <div style={{ background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 12, padding: "14px 18px" }}>
          <div style={{ fontSize: 10, color: "#475569", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Pending Count</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: countPending > 0 ? "#f59e0b" : "#64748b" }}>{countPending}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {["all", "pending", "approved", "rejected"].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            background: filter === s ? "#1a1a35" : "transparent",
            border: `1px solid ${filter === s ? "#7c3aed" : "#1e1e38"}`,
            color: filter === s ? "#a78bfa" : "#64748b",
            borderRadius: 20, padding: "4px 14px", fontSize: 12, cursor: "pointer", textTransform: "capitalize",
          }}>{s}</button>
        ))}
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ ...inp, width: "auto", fontSize: 12, padding: "4px 10px" }}>
          <option value="all" style={{ background: "#141428" }}>All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c} style={{ background: "#141428" }}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="table-responsive" style={{ background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr auto", gap: 0, minWidth: 580 }}>
          {/* Header */}
          {["Expense", "Description", "Category", "Amount", "Status", "Actions"].map(h => (
            <div key={h} style={{ padding: "10px 16px", fontSize: 10, color: "#475569", fontWeight: 700, textTransform: "uppercase", borderBottom: "1px solid #1e1e38" }}>{h}</div>
          ))}

          {isLoading ? (
            <div style={{ gridColumn: "1/-1", padding: 32, textAlign: "center", color: "#475569" }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ gridColumn: "1/-1", padding: "48px 0", textAlign: "center", color: "#334155" }}>
              <FontAwesomeIcon icon={faReceipt} style={{ fontSize: 28, marginBottom: 10 }} />
              <div style={{ fontSize: 14, fontWeight: 600 }}>No expenses found</div>
            </div>
          ) : filtered.map((item) => (
            <>
              <div key={`title-${item.id}`} style={{ padding: "12px 16px", borderBottom: "1px solid #1e1e38" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{String(item.title)}</div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
                  {item.expenseDate ? format(new Date(String(item.expenseDate)), "dd MMM yyyy") : "—"}
                  {item.fundName ? ` · ${String(item.fundName)}` : ""}
                </div>
                {!!item.createdByName && <div style={{ fontSize: 10, color: "#334155", marginTop: 2 }}>by {String(item.createdByName)}</div>}
              </div>
              <div key={`desc-${item.id}`} style={{ padding: "12px 16px", borderBottom: "1px solid #1e1e38", display: "flex", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#94a3b8", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{item.description ? String(item.description) : <span style={{ color: "#334155" }}>—</span>}</span>
              </div>
              <div key={`cat-${item.id}`} style={{ padding: "12px 16px", borderBottom: "1px solid #1e1e38", display: "flex", alignItems: "center" }}>
                <span style={{ background: "#1a1a35", color: "#a78bfa", padding: "2px 8px", borderRadius: 20, fontSize: 11, textTransform: "capitalize" }}>{String(item.category)}</span>
              </div>
              <div key={`amt-${item.id}`} style={{ padding: "12px 16px", borderBottom: "1px solid #1e1e38", display: "flex", alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>{bdt(Number(item.amount))}</span>
              </div>
              <div key={`status-${item.id}`} style={{ padding: "12px 16px", borderBottom: "1px solid #1e1e38", display: "flex", alignItems: "center" }}>
                <Badge status={String(item.status)} />
              </div>
              <div key={`actions-${item.id}`} style={{ padding: "12px 16px", borderBottom: "1px solid #1e1e38", display: "flex", alignItems: "center", gap: 6 }}>
                {isAdmin && String(item.status) === "pending" && (
                  <>
                    <button title="Approve" onClick={() => setStatus(String(item.id), "approved")} style={{ background: "#064e3b", color: "#10b981", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 11 }}>
                      <FontAwesomeIcon icon={faCheck} />
                    </button>
                    <button title="Reject" onClick={() => setStatus(String(item.id), "rejected")} style={{ background: "#450a0a", color: "#ef4444", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 11 }}>
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </>
                )}
                {isAdmin && (
                  <>
                    <button title="Edit" onClick={() => openEdit(item)} style={{ background: "#141428", color: "#64748b", border: "1px solid #1e1e38", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 11 }}>
                      <FontAwesomeIcon icon={faPencil} />
                    </button>
                    <button title="Delete" onClick={() => deleteExpense(String(item.id))} style={{ background: "#1e293b", color: "#94a3b8", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 11 }}>
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </>
                )}
              </div>
            </>
          ))}
        </div>
      </div>

      {showCreate && <Modal title="Add Expense" onClose={() => setShowCreate(false)}>{formFields}</Modal>}
      {editItem && <Modal title="Edit Expense" onClose={() => setEditItem(null)}>{formFields}</Modal>}
    </div>
  );
}
