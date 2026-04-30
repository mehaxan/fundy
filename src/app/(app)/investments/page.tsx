
"use client";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faChartLine, faPencil, faTrash } from "@fortawesome/free-solid-svg-icons";
import useSWR from "swr";
import { format } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const fetcher = (u: string) => fetch(u).then(r => r.json());
function bdt(n: number) { return `৳${(n || 0).toLocaleString("en-IN")}`; }

function Badge({ status }: { status: string }) {
  const m: Record<string, [string, string]> = {
    active: ["#064e3b", "#10b981"], planned: ["#2e1065", "#a78bfa"],
    completed: ["#064e3b", "#34d399"], cancelled: ["#450a0a", "#ef4444"],
  };
  const [bg, fg] = m[status] ?? ["#1e293b", "#94a3b8"];
  return <span style={{ background: bg, color: fg, padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: "capitalize" }}>{status}</span>;
}

interface ModalProps { title: string; onClose: () => void; children: React.ReactNode; }
function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="animate-fade-in" onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "40px 20px",
    }}>
      <div className="animate-fade-up" style={{
        background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 16,
        padding: 28, width: "100%", maxWidth: 540,
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

const emptyForm = { name: "", description: "", investedAmount: "", expectedReturn: "", actualReturn: "", startDate: "", endDate: "", status: "planned" };

export default function InvestmentsPage() {
  const { data: investments = [], mutate, isLoading } = useSWR<Record<string, unknown>[]>("/api/investments", fetcher);
  const { data: me } = useSWR<Record<string, unknown>>("/api/auth/me", fetcher);
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [filter, setFilter] = useState("all");

  const isAdmin = me?.role === "admin";
  const filtered = (investments as Record<string, unknown>[]).filter(i => filter === "all" || i.status === filter);

  const totalInvested = investments.reduce((a, i) => a + Number(i.investedAmount ?? 0), 0);
  const totalExpected = investments.reduce((a, i) => a + Number(i.expectedReturn ?? 0), 0);
  const totalActual = investments.reduce((a, i) => a + Number(i.actualReturn ?? 0), 0);
  const overallROI = totalInvested > 0 ? ((totalActual / totalInvested) * 100).toFixed(1) : "0.0";

  const chartData = (investments as Record<string, unknown>[]).slice(0, 10).map(i => ({
    name: String(i.name ?? "").slice(0, 18),
    Invested: Number(i.investedAmount ?? 0),
    Expected: Number(i.expectedReturn ?? 0),
    Actual: Number(i.actualReturn ?? 0),
  }));

  async function saveInvestment(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setMsg("");
    const payload = {
      ...form,
      investedAmount: Number(form.investedAmount),
      expectedReturn: form.expectedReturn ? Number(form.expectedReturn) : undefined,
      actualReturn: form.actualReturn ? Number(form.actualReturn) : undefined,
    };
    const url = editItem ? `/api/investments/${editItem.id}` : "/api/investments";
    const method = editItem ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) { mutate(); setShowCreate(false); setEditItem(null); setForm({ ...emptyForm }); }
    else { const j = await res.json(); setMsg(j.error); }
    setSaving(false);
  }

  async function deleteInvestment(id: string) {
    if (!confirm("Cancel this investment?")) return;
    await fetch(`/api/investments/${id}`, { method: "DELETE" });
    mutate();
  }

  function openEdit(item: Record<string, unknown>) {
    setEditItem(item);
    setForm({
      name: String(item.name ?? ""), description: String(item.description ?? ""),
      investedAmount: String(item.investedAmount ?? ""), expectedReturn: String(item.expectedReturn ?? ""),
      actualReturn: String(item.actualReturn ?? ""),
      startDate: item.startDate ? String(item.startDate).slice(0, 10) : "",
      endDate: item.endDate ? String(item.endDate).slice(0, 10) : "",
      status: String(item.status ?? "planned"),
    });
    setMsg("");
  }

  return (
    <div className="animate-fade-up">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#f1f5f9", letterSpacing: -0.5 }}>Investments</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>Track returns and portfolio performance</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setShowCreate(true); setEditItem(null); setForm({ ...emptyForm }); setMsg(""); }} style={{
            background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none",
            borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <FontAwesomeIcon icon={faPlus} /> Add Investment
          </button>
        )}
      </div>

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Invested", value: bdt(totalInvested), color: "#7c3aed" },
          { label: "Expected Return", value: bdt(totalExpected), color: "#3b82f6" },
          { label: "Actual Return", value: bdt(totalActual), color: "#10b981" },
          { label: "Overall ROI", value: `${overallROI}%`, color: Number(overallROI) >= 0 ? "#10b981" : "#ef4444" },
        ].map(s => (
          <div key={s.label} style={{ background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Bar Chart */}
      {chartData.length > 0 && (
        <div style={{ background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 14, padding: "22px 22px 14px", marginBottom: 24 }}>
          <h3 style={{ margin: "0 0 18px", fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>Investment Comparison</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e38" />
              <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 11 }} />
              <YAxis tick={{ fill: "#475569", fontSize: 11 }} tickFormatter={v => `৳${(v / 1000).toFixed(0)}K`} />
              <Tooltip contentStyle={{ background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 8 }} formatter={(v: unknown) => [bdt(Number(v))]} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#64748b" }} />
              <Bar dataKey="Invested" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Expected" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Actual" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {["all", "planned", "active", "completed", "cancelled"].map(f => (
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
              {["Investment", "Invested", "Expected", "Actual", "ROI", "Start", "End", "Status", ""].map(h => (
                <th key={h} style={{ textAlign: "left", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, padding: "12px 16px", borderBottom: "1px solid #1e1e38" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? [...Array(4)].map((_, i) => (
              <tr key={i}><td colSpan={9} style={{ padding: 14 }}><div style={{ height: 14, background: "#141428", borderRadius: 4, width: "70%" }} /></td></tr>
            )) : filtered.map((inv: Record<string, unknown>) => {
              const roi = Number(inv.investedAmount) > 0 ? ((Number(inv.actualReturn) / Number(inv.investedAmount)) * 100).toFixed(1) : "0.0";
              return (
                <tr key={String(inv.id)} onMouseEnter={e => (e.currentTarget.style.background = "#0e0e1c80")} onMouseLeave={e => (e.currentTarget.style.background = "")}>
                  <td style={{ padding: "12px 16px", borderBottom: "1px solid #141428" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{String(inv.name)}</div>
                    {!!inv.description && <div style={{ fontSize: 11, color: "#64748b" }}>{String(inv.description).slice(0, 50)}</div>}
                  </td>
                  <td style={{ padding: "12px 16px", borderBottom: "1px solid #141428", fontSize: 13, fontWeight: 600, color: "#a78bfa" }}>{bdt(Number(inv.investedAmount))}</td>
                  <td style={{ padding: "12px 16px", borderBottom: "1px solid #141428", fontSize: 13, color: "#3b82f6" }}>{inv.expectedReturn ? bdt(Number(inv.expectedReturn)) : "—"}</td>
                  <td style={{ padding: "12px 16px", borderBottom: "1px solid #141428", fontSize: 13, fontWeight: 600, color: "#10b981" }}>{inv.actualReturn ? bdt(Number(inv.actualReturn)) : "—"}</td>
                  <td style={{ padding: "12px 16px", borderBottom: "1px solid #141428", fontSize: 13, fontWeight: 700, color: Number(roi) > 0 ? "#10b981" : Number(roi) < 0 ? "#ef4444" : "#64748b" }}>{roi}%</td>
                  <td style={{ padding: "12px 16px", borderBottom: "1px solid #141428", fontSize: 12, color: "#64748b" }}>{inv.startDate ? format(new Date(String(inv.startDate)), "dd MMM yyyy") : "—"}</td>
                  <td style={{ padding: "12px 16px", borderBottom: "1px solid #141428", fontSize: 12, color: "#64748b" }}>{inv.endDate ? format(new Date(String(inv.endDate)), "dd MMM yyyy") : "—"}</td>
                  <td style={{ padding: "12px 16px", borderBottom: "1px solid #141428" }}><Badge status={String(inv.status)} /></td>
                  {isAdmin && (
                    <td style={{ padding: "12px 16px", borderBottom: "1px solid #141428" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => openEdit(inv)} style={{ background: "#141428", border: "1px solid #1e1e38", borderRadius: 6, padding: "5px 9px", cursor: "pointer", color: "#94a3b8" }}>
                          <FontAwesomeIcon icon={faPencil} style={{ fontSize: 11 }} />
                        </button>
                        {inv.status !== "cancelled" && (
                          <button onClick={() => deleteInvestment(String(inv.id))} style={{ background: "#450a0a", border: "none", borderRadius: 6, padding: "5px 9px", cursor: "pointer", color: "#f87171" }}>
                            <FontAwesomeIcon icon={faTrash} style={{ fontSize: 11 }} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        {!isLoading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#334155", fontSize: 13 }}>No investments found</div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreate || editItem) && (
        <Modal title={editItem ? "Edit Investment" : "Add Investment"} onClose={() => { setShowCreate(false); setEditItem(null); }}>
          <form onSubmit={saveInvestment} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div><label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 4 }}>Name *</label><input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} style={inp} placeholder="e.g. Real Estate Project A" /></div>
            <div><label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 4 }}>Description</label><textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} style={{ ...inp, resize: "vertical", minHeight: 60 }} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 4 }}>Invested Amount (BDT) *</label><input required type="number" min="0" value={form.investedAmount} onChange={e => setForm(f => ({...f, investedAmount: e.target.value}))} style={inp} /></div>
              <div><label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 4 }}>Expected Return (BDT)</label><input type="number" min="0" value={form.expectedReturn} onChange={e => setForm(f => ({...f, expectedReturn: e.target.value}))} style={inp} /></div>
              <div><label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 4 }}>Actual Return (BDT)</label><input type="number" min="0" value={form.actualReturn} onChange={e => setForm(f => ({...f, actualReturn: e.target.value}))} style={inp} /></div>
              <div><label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 4 }}>Status</label>
                <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))} style={inp}>
                  <option value="planned">Planned</option><option value="active">Active</option>
                  <option value="completed">Completed</option><option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div><label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 4 }}>Start Date</label><input type="date" value={form.startDate} onChange={e => setForm(f => ({...f, startDate: e.target.value}))} style={inp} /></div>
              <div><label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 4 }}>End Date</label><input type="date" value={form.endDate} onChange={e => setForm(f => ({...f, endDate: e.target.value}))} style={inp} /></div>
            </div>
            {msg && <div style={{ color: "#f87171", fontSize: 12 }}>{msg}</div>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => { setShowCreate(false); setEditItem(null); }} style={{ background: "#141428", border: "1px solid #1e1e38", color: "#94a3b8", borderRadius: 8, padding: "9px 16px", fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button type="submit" disabled={saving} style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                {saving ? "Saving…" : editItem ? "Save Changes" : "Add Investment"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
