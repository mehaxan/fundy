
"use client";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faArrowUp, faArrowDown, faWallet, faSearch } from "@fortawesome/free-solid-svg-icons";
import useSWR from "swr";
import { format } from "date-fns";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const fetcher = (u: string) => fetch(u).then(r => r.json());
function bdt(n: number) { return `৳${(n || 0).toLocaleString("en-IN")}`; }

function Badge({ type }: { type: string }) {
  const m: Record<string, [string, string]> = {
    deposit: ["#064e3b", "#10b981"], withdrawal: ["#450a0a", "#f87171"],
    dividend: ["#2e1065", "#a78bfa"], fine: ["#451a03", "#f59e0b"],
    manual: ["#1e293b", "#64748b"], investment_return: ["#1e3a5f", "#60a5fa"],
  };
  const [bg, fg] = m[type] ?? ["#1e293b", "#94a3b8"];
  return <span style={{ background: bg, color: fg, padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: "capitalize" }}>{type.replace(/_/g, " ")}</span>;
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
        padding: 28, width: "100%", maxWidth: 480, maxHeight: "85vh", overflowY: "auto",
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

export default function WalletPage() {
  const { data: wallets = [], isLoading: walletsLoading } = useSWR<Record<string, unknown>[]>("/api/wallet", fetcher);
  const { data: txns = [], mutate: mutTxns, isLoading: txnsLoading } = useSWR<Record<string, unknown>[]>("/api/wallet/transactions", fetcher);
  const { data: me } = useSWR<Record<string, unknown>>("/api/auth/me", fetcher);
  const { data: users = [] } = useSWR<Record<string, unknown>[]>("/api/users", fetcher);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [form, setForm] = useState({ userId: "", type: "deposit", amount: "", description: "", direction: "credit" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const isAdmin = me?.role === "admin";

  const filteredTxns = (txns as Record<string, unknown>[]).filter(t =>
    (filterType === "all" || t.type === filterType) &&
    (search === "" || String(t.description ?? "").toLowerCase().includes(search.toLowerCase()) || String(t.userName ?? "").toLowerCase().includes(search.toLowerCase()))
  );

  const totalBalance = (wallets as Record<string, unknown>[]).reduce((a, w) => a + Number(w.balance ?? 0), 0);

  // For member's own chart
  const myTxns = (txns as Record<string, unknown>[]).slice(0, 20).reverse();
  let runningBalance = 0;
  const chartData = myTxns.map(t => {
    runningBalance += t.direction === "credit" ? Number(t.amount) : -Number(t.amount);
    return { date: t.createdAt ? format(new Date(String(t.createdAt)), "dd MMM") : "", balance: runningBalance };
  });

  async function addTransaction(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setMsg("");
    const res = await fetch("/api/wallet", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: Number(form.amount) }),
    });
    if (res.ok) { mutTxns(); setShowAdd(false); setForm({ userId: "", type: "deposit", amount: "", description: "", direction: "credit" }); }
    else { const j = await res.json(); setMsg(j.error); }
    setSaving(false);
  }

  return (
    <div className="animate-fade-up">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#f1f5f9", letterSpacing: -0.5 }}>Wallet</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>Member wallets and transactions</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowAdd(true)} style={{
            background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none",
            borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <FontAwesomeIcon icon={faPlus} /> Add Transaction
          </button>
        )}
      </div>

      {/* Admin: Wallet Overview */}
      {isAdmin && (
        <>
          <div style={{ background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 14, padding: "20px 22px", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>Member Wallets</h3>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#10b981" }}>Total: {bdt(totalBalance)}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
              {(wallets as Record<string, unknown>[]).map(w => (
                <div key={String(w.userId)} style={{ background: "#141428", border: "1px solid #1e1e38", borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: "50%", background: "#2e1065",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700, color: "#a78bfa",
                    }}>
                      {String(w.userName ?? "?").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{String(w.userName ?? "—")}</div>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#10b981" }}>{bdt(Number(w.balance))}</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                    {w.lastTransactionAt ? format(new Date(String(w.lastTransactionAt)), "dd MMM yyyy") : "No transactions"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Transaction Balance Chart (member) */}
      {!isAdmin && chartData.length > 1 && (
        <div style={{ background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 14, padding: "22px 22px 14px", marginBottom: 24 }}>
          <h3 style={{ margin: "0 0 18px", fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>Balance History</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e38" />
              <XAxis dataKey="date" tick={{ fill: "#475569", fontSize: 11 }} />
              <YAxis tick={{ fill: "#475569", fontSize: 11 }} tickFormatter={v => `৳${(v / 1000).toFixed(0)}K`} />
              <Tooltip contentStyle={{ background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 8 }} formatter={(v: unknown) => [bdt(Number(v)), "Balance"]} />
              <Area type="monotone" dataKey="balance" stroke="#7c3aed" fill="url(#balGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Transactions List */}
      <div style={{ marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200, maxWidth: 320 }}>
          <FontAwesomeIcon icon={faSearch} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#475569", fontSize: 13 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transactions…" style={{ ...inp, paddingLeft: 36 }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["all", "deposit", "withdrawal", "dividend", "fine", "investment_return", "manual"].map(f => (
            <button key={f} onClick={() => setFilterType(f)} style={{
              padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer",
              border: "none", background: filterType === f ? "#7c3aed" : "#141428",
              color: filterType === f ? "#fff" : "#64748b", textTransform: "capitalize",
            }}>{f.replace(/_/g, " ")}</button>
          ))}
        </div>
      </div>

      <div style={{ background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 14, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["", isAdmin ? "Member" : null, "Description", "Type", "Amount", "Date"].filter(Boolean).map(h => (
                <th key={String(h)} style={{ textAlign: "left", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, padding: "12px 16px", borderBottom: "1px solid #1e1e38" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {txnsLoading ? [...Array(6)].map((_, i) => (
              <tr key={i}><td colSpan={6} style={{ padding: 14 }}><div style={{ height: 14, background: "#141428", borderRadius: 4, width: "75%" }} /></td></tr>
            )) : filteredTxns.map((t: Record<string, unknown>) => (
              <tr key={String(t.id)} onMouseEnter={e => (e.currentTarget.style.background = "#0e0e1c80")} onMouseLeave={e => (e.currentTarget.style.background = "")}>
                <td style={{ padding: "10px 16px", borderBottom: "1px solid #141428", width: 40 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                    background: t.direction === "credit" ? "#064e3b" : "#450a0a",
                  }}>
                    <FontAwesomeIcon icon={t.direction === "credit" ? faArrowDown : faArrowUp} style={{ fontSize: 11, color: t.direction === "credit" ? "#10b981" : "#ef4444" }} />
                  </div>
                </td>
                {isAdmin && <td style={{ padding: "10px 16px", borderBottom: "1px solid #141428", fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{String(t.userName ?? "—")}</td>}
                <td style={{ padding: "10px 16px", borderBottom: "1px solid #141428", fontSize: 13, color: "#94a3b8", maxWidth: 300 }}>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{String(t.description ?? "—")}</div>
                </td>
                <td style={{ padding: "10px 16px", borderBottom: "1px solid #141428" }}><Badge type={String(t.type)} /></td>
                <td style={{ padding: "10px 16px", borderBottom: "1px solid #141428", fontSize: 14, fontWeight: 700, color: t.direction === "credit" ? "#10b981" : "#f87171", whiteSpace: "nowrap" }}>
                  {t.direction === "credit" ? "+" : "-"}{bdt(Number(t.amount))}
                </td>
                <td style={{ padding: "10px 16px", borderBottom: "1px solid #141428", fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>
                  {t.createdAt ? format(new Date(String(t.createdAt)), "dd MMM yyyy, hh:mm a") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!txnsLoading && filteredTxns.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#334155", fontSize: 13 }}>No transactions found</div>
        )}
      </div>

      {/* Add Transaction Modal (Admin only) */}
      {showAdd && (
        <Modal title="Add Transaction" onClose={() => setShowAdd(false)}>
          <form onSubmit={addTransaction} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 4 }}>Member *</label>
              <select required value={form.userId} onChange={e => setForm(f => ({...f, userId: e.target.value}))} style={inp}>
                <option value="">Select member…</option>
                {(users as Record<string, unknown>[]).map(u => (
                  <option key={String(u.id)} value={String(u.id)}>{String(u.name)} — {String(u.email)}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 4 }}>Type</label>
                <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))} style={inp}>
                  <option value="deposit">Deposit</option>
                  <option value="withdrawal">Withdrawal</option>
                  <option value="dividend">Dividend</option>
                  <option value="fine">Fine</option>
                  <option value="investment_return">Investment Return</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 4 }}>Direction</label>
                <select value={form.direction} onChange={e => setForm(f => ({...f, direction: e.target.value}))} style={inp}>
                  <option value="credit">Credit (+)</option>
                  <option value="debit">Debit (-)</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 4 }}>Amount (BDT) *</label>
              <input required type="number" min="1" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} style={inp} placeholder="e.g. 5000" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 4 }}>Description</label>
              <input value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} style={inp} placeholder="Transaction note…" />
            </div>
            {msg && <div style={{ color: "#f87171", fontSize: 12 }}>{msg}</div>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setShowAdd(false)} style={{ background: "#141428", border: "1px solid #1e1e38", color: "#94a3b8", borderRadius: 8, padding: "9px 16px", fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button type="submit" disabled={saving} style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                {saving ? "Adding…" : "Add Transaction"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
