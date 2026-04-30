
"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faChartLine, faCamera } from "@fortawesome/free-solid-svg-icons";
import useSWR from "swr";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const fetcher = (u: string) => fetch(u).then(r => r.json());
function bdt(n: number) { return `৳${(n || 0).toLocaleString("en-IN")}`; }
function bdtC(n: number) {
  if (n >= 10000000) return `৳${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `৳${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `৳${(n / 1000).toFixed(1)}K`;
  return bdt(n);
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

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
        position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 1001, width: 480,
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

export default function ProjectionsPage() {
  const { data: snapshots = [], mutate, isLoading } = useSWR<Record<string, unknown>[]>("/api/snapshots", fetcher);
  const { data: me } = useSWR<Record<string, unknown>>("/api/auth/me", fetcher);
  const [showSnap, setShowSnap] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [activeChart, setActiveChart] = useState<"growth" | "breakdown" | "roi">("growth");

  const isAdmin = me?.role === "admin";

  const chartData = (snapshots as Record<string, unknown>[]).map(s => ({
    name: `${MONTHS[Number(s.month) - 1]} ${String(s.year).slice(2)}`,
    "Net Worth": Number(s.netWorth),
    "Invested": Number(s.totalInvested),
    "Returns": Number(s.totalReturns),
    "Assets": Number(s.totalAssets),
    "Wallet": Number(s.totalWalletBalance),
    "Members": Number(s.totalMembers),
    "ROI %": Number(s.totalInvested) > 0 ? Number(((Number(s.totalReturns) / Number(s.totalInvested)) * 100).toFixed(2)) : 0,
  }));

  // Project next 6 months using linear regression on net worth
  const projected = (() => {
    if (chartData.length < 2) return [];
    const n = chartData.length;
    const xs = chartData.map((_, i) => i);
    const ys = chartData.map(d => d["Net Worth"]);
    const xMean = xs.reduce((a, x) => a + x, 0) / n;
    const yMean = ys.reduce((a, y) => a + y, 0) / n;
    const slope = xs.reduce((a, x, i) => a + (x - xMean) * (ys[i] - yMean), 0) / xs.reduce((a, x) => a + (x - xMean) ** 2, 0);
    const intercept = yMean - slope * xMean;
    const last = snapshots[snapshots.length - 1] as Record<string, number>;
    return Array.from({ length: 6 }, (_, i) => {
      const offset = n + i;
      const month = ((Number(last.month) - 1 + i + 1) % 12) + 1;
      const year = Number(last.year) + Math.floor((Number(last.month) + i) / 12);
      return {
        name: `${MONTHS[month - 1]} ${String(year).slice(2)} (proj)`,
        "Projected Net Worth": Math.round(intercept + slope * offset),
      };
    });
  })();

  const latestSnap = snapshots.length > 0 ? snapshots[snapshots.length - 1] as Record<string, number> : null;
  const prevSnap = snapshots.length > 1 ? snapshots[snapshots.length - 2] as Record<string, number> : null;

  const growthPct = latestSnap && prevSnap && prevSnap.netWorth > 0
    ? (((latestSnap.netWorth - prevSnap.netWorth) / prevSnap.netWorth) * 100).toFixed(1)
    : null;

  async function captureSnapshot() {
    setSaving(true); setMsg("");
    const res = await fetch("/api/snapshots", { method: "POST" });
    if (res.ok) { mutate(); setShowSnap(false); }
    else { const j = await res.json(); setMsg(j.error || "Failed"); }
    setSaving(false);
  }

  return (
    <div className="animate-fade-up">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#f1f5f9", letterSpacing: -0.5 }}>Projections</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>Growth tracking and future projections — {snapshots.length} monthly snapshots</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowSnap(true)} style={{
            background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none",
            borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <FontAwesomeIcon icon={faCamera} /> Capture Snapshot
          </button>
        )}
      </div>

      {/* Latest Snapshot KPIs */}
      {latestSnap && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, marginBottom: 28 }}>
          {[
            { label: "Net Worth", value: bdtC(latestSnap.netWorth), color: "#7c3aed", trend: growthPct ? Number(growthPct) : undefined },
            { label: "Total Invested", value: bdtC(latestSnap.totalInvested), color: "#10b981" },
            { label: "Total Returns", value: bdtC(latestSnap.totalReturns), color: "#3b82f6" },
            { label: "Assets", value: bdtC(latestSnap.totalAssets), color: "#f59e0b" },
            { label: "Wallet Balance", value: bdtC(latestSnap.totalWalletBalance), color: "#06b6d4" },
            { label: "Members", value: String(latestSnap.totalMembers), color: "#a78bfa" },
          ].map(s => (
            <div key={s.label} className="card-hover" style={{ background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
              {s.trend !== undefined && (
                <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4, color: s.trend >= 0 ? "#10b981" : "#ef4444" }}>
                  {s.trend >= 0 ? "▲" : "▼"} {Math.abs(s.trend)}% MoM
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Chart Selector */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {(["growth", "breakdown", "roi"] as const).map(c => (
          <button key={c} onClick={() => setActiveChart(c)} style={{
            padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
            border: "none", background: activeChart === c ? "#7c3aed" : "#141428",
            color: activeChart === c ? "#fff" : "#64748b", textTransform: "capitalize",
          }}>{c === "roi" ? "ROI %" : c.charAt(0).toUpperCase() + c.slice(1)}</button>
        ))}
      </div>

      {snapshots.length === 0 ? (
        <div style={{ background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 14, padding: "80px 0", textAlign: "center" }}>
          <FontAwesomeIcon icon={faChartLine} style={{ fontSize: 36, color: "#334155", marginBottom: 16 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: "#475569", marginBottom: 6 }}>No snapshots yet</div>
          <div style={{ fontSize: 13, color: "#334155" }}>Capture a monthly snapshot to start tracking growth</div>
        </div>
      ) : (
        <>
          {/* Growth Chart */}
          {activeChart === "growth" && (
            <div style={{ background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 14, padding: "22px 22px 14px", marginBottom: 20 }}>
              <h3 style={{ margin: "0 0 18px", fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>Net Worth Growth + 6-Month Projection</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={[...chartData, ...projected]}>
                  <defs>
                    <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e38" />
                  <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 10 }} angle={-30} textAnchor="end" height={50} />
                  <YAxis tick={{ fill: "#475569", fontSize: 11 }} tickFormatter={v => bdtC(v)} />
                  <Tooltip
                    contentStyle={{ background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 8 }}
                    formatter={(v: unknown, name: unknown) => [bdt(Number(v)), String(name)]}
                  />
                  <Area type="monotone" dataKey="Net Worth" stroke="#7c3aed" fill="url(#nwGrad)" strokeWidth={2} dot={false} connectNulls />
                  <Area type="monotone" dataKey="Projected Net Worth" stroke="#06b6d4" fill="url(#projGrad)" strokeWidth={2} strokeDasharray="6 3" dot={false} connectNulls />
                  <Legend wrapperStyle={{ fontSize: 11, color: "#64748b" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Breakdown Chart */}
          {activeChart === "breakdown" && (
            <div style={{ background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 14, padding: "22px 22px 14px", marginBottom: 20 }}>
              <h3 style={{ margin: "0 0 18px", fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>Portfolio Breakdown Over Time</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e38" />
                  <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 10 }} angle={-30} textAnchor="end" height={50} />
                  <YAxis tick={{ fill: "#475569", fontSize: 11 }} tickFormatter={v => bdtC(v)} />
                  <Tooltip contentStyle={{ background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 8 }} formatter={(v: unknown) => [bdt(Number(v))]} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "#64748b" }} />
                  <Bar dataKey="Invested" fill="#7c3aed" stackId="a" />
                  <Bar dataKey="Returns" fill="#10b981" stackId="a" />
                  <Bar dataKey="Assets" fill="#f59e0b" stackId="a" />
                  <Bar dataKey="Wallet" fill="#06b6d4" stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ROI Chart */}
          {activeChart === "roi" && (
            <div style={{ background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 14, padding: "22px 22px 14px", marginBottom: 20 }}>
              <h3 style={{ margin: "0 0 18px", fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>ROI % Over Time</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e38" />
                  <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 10 }} angle={-30} textAnchor="end" height={50} />
                  <YAxis tick={{ fill: "#475569", fontSize: 11 }} tickFormatter={v => `${v}%`} />
                  <Tooltip contentStyle={{ background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 8 }} formatter={(v: unknown) => [`${Number(v)}%`, "ROI"]} />
                  <Line type="monotone" dataKey="ROI %" stroke="#10b981" strokeWidth={2.5} dot={{ fill: "#10b981", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Snapshot History Table */}
          <div style={{ background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #1e1e38" }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>Snapshot History</h3>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Period", "Net Worth", "Invested", "Returns", "Assets", "Members", "ROI"].map(h => (
                    <th key={h} style={{ textAlign: "left", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, padding: "10px 16px", borderBottom: "1px solid #1e1e38" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...snapshots].reverse().map((s: Record<string, unknown>) => {
                  const roi = Number(s.totalInvested) > 0 ? ((Number(s.totalReturns) / Number(s.totalInvested)) * 100).toFixed(1) : "0.0";
                  return (
                    <tr key={String(s.id)} onMouseEnter={e => (e.currentTarget.style.background = "#0e0e1c80")} onMouseLeave={e => (e.currentTarget.style.background = "")}>
                      <td style={{ padding: "10px 16px", borderBottom: "1px solid #141428", fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>
                        {MONTHS[Number(s.month) - 1]} {String(s.year)}
                      </td>
                      <td style={{ padding: "10px 16px", borderBottom: "1px solid #141428", fontSize: 13, fontWeight: 700, color: "#7c3aed" }}>{bdtC(Number(s.netWorth))}</td>
                      <td style={{ padding: "10px 16px", borderBottom: "1px solid #141428", fontSize: 13, color: "#a78bfa" }}>{bdtC(Number(s.totalInvested))}</td>
                      <td style={{ padding: "10px 16px", borderBottom: "1px solid #141428", fontSize: 13, color: "#10b981" }}>{bdtC(Number(s.totalReturns))}</td>
                      <td style={{ padding: "10px 16px", borderBottom: "1px solid #141428", fontSize: 13, color: "#f59e0b" }}>{bdtC(Number(s.totalAssets))}</td>
                      <td style={{ padding: "10px 16px", borderBottom: "1px solid #141428", fontSize: 13, color: "#94a3b8" }}>{String(s.totalMembers)}</td>
                      <td style={{ padding: "10px 16px", borderBottom: "1px solid #141428", fontSize: 13, fontWeight: 700, color: Number(roi) >= 0 ? "#10b981" : "#ef4444" }}>{roi}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Capture Snapshot Modal */}
      {showSnap && (
        <Modal title="Capture Monthly Snapshot" onClose={() => setShowSnap(false)}>
          <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 20 }}>
            This will capture the current state of all funds, investments, assets, and wallets as a data point for growth tracking. Snapshots are typically taken at the end of each month.
          </p>
          <div style={{ background: "#141428", border: "1px solid #1e1e38", borderRadius: 10, padding: "12px 14px", marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>What will be captured</div>
            <div style={{ fontSize: 12, color: "#94a3b8", display: "flex", flexDirection: "column", gap: 4 }}>
              <div>• Net worth (all assets + investments + wallet)</div>
              <div>• Total invested & returns</div>
              <div>• Asset values</div>
              <div>• Wallet balances</div>
              <div>• Active member count</div>
            </div>
          </div>
          {msg && <div style={{ color: "#f87171", fontSize: 12, marginBottom: 12 }}>{msg}</div>}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: "auto", paddingTop: 16, paddingBottom: 28 }}>
            <button onClick={() => setShowSnap(false)} style={{ background: "#141428", border: "1px solid #1e1e38", color: "#94a3b8", borderRadius: 8, padding: "9px 16px", fontSize: 13, cursor: "pointer" }}>Cancel</button>
            <button onClick={captureSnapshot} disabled={saving} style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {saving ? "Capturing…" : "Capture Now"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
