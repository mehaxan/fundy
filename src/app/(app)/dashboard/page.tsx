
"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers, faLayerGroup, faChartLine, faBuilding,
  faWallet, faTriangleExclamation, faCircleCheck,
  faArrowUp, faArrowDown, faClock, faCalendarDays,
} from "@fortawesome/free-solid-svg-icons";
import useSWR from "swr";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { format } from "date-fns";

const fetcher = (url: string) => fetch(url).then(r => r.json());

function bdt(n: number) { return `৳${(n || 0).toLocaleString("en-IN")}`; }
function bdtC(n: number) {
  if (n >= 10000000) return `৳${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `৳${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `৳${(n / 1000).toFixed(1)}K`;
  return bdt(n);
}

interface StatCardProps {
  label: string; value: string; sub?: string;
  color?: string; icon: React.ReactNode; trend?: number;
}
function StatCard({ label, value, sub, color = "#7c3aed", icon, trend }: StatCardProps) {
  return (
    <div className="card-hover" style={{
      background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 14,
      padding: "20px 22px", cursor: "default",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6 }}>{label}</span>
        <span style={{
          width: 34, height: 34, borderRadius: 10, display: "flex",
          alignItems: "center", justifyContent: "center",
          background: color + "20", color, fontSize: 14,
        }}>{icon}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "#f1f5f9", letterSpacing: -0.5, marginBottom: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#64748b" }}>{sub}</div>}
      {trend !== undefined && (
        <div style={{ fontSize: 12, color: trend >= 0 ? "#10b981" : "#ef4444", fontWeight: 600, marginTop: 6 }}>
          {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}% vs last month
        </div>
      )}
    </div>
  );
}

function Badge({ status }: { status: string }) {
  const colors: Record<string, [string, string]> = {
    active: ["#064e3b", "#10b981"], completed: ["#064e3b", "#34d399"],
    pending: ["#451a03", "#f59e0b"], scheduled: ["#1e3a5f", "#3b82f6"],
    cancelled: ["#450a0a", "#ef4444"], deposit: ["#064e3b", "#10b981"],
    withdrawal: ["#450a0a", "#f87171"], dividend: ["#2e1065", "#a78bfa"],
    fine: ["#451a03", "#f59e0b"], manual: ["#1e293b", "#64748b"],
    investment_return: ["#064e3b", "#34d399"],
  };
  const [bg, fg] = colors[status] ?? ["#1e293b", "#94a3b8"];
  return (
    <span style={{
      background: bg, color: fg, padding: "2px 8px", borderRadius: 20,
      fontSize: 11, fontWeight: 600, textTransform: "capitalize", letterSpacing: 0.3,
    }}>{status.replace(/_/g, " ")}</span>
  );
}

const CHART_COLORS = ["#7c3aed", "#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

export default function DashboardPage() {
  const { data, isLoading, error } = useSWR("/api/dashboard", fetcher, { refreshInterval: 30000 });

  if (error) return <div style={{ color: "#ef4444", padding: 40 }}>Failed to load dashboard</div>;

  const roi = data ? data.totalInvested > 0
    ? ((data.totalReturns / data.totalInvested) * 100).toFixed(1)
    : "0.0" : "—";

  const snapshotChartData = (data?.snapshots ?? []).map((s: Record<string, number>) => ({
    name: `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][s.month - 1]} ${String(s.year).slice(2)}`,
    "Net Worth": s.netWorth,
    "Invested": s.totalInvested,
    "Assets": s.totalAssets,
    "Returns": s.totalReturns,
  }));

  const investmentPieData = [
    { name: "Active Investments", value: data?.totalInvested ?? 0 },
    { name: "Returns", value: data?.totalReturns ?? 0 },
    { name: "Assets", value: data?.totalAssets ?? 0 },
    { name: "Wallet", value: data?.totalWalletBalance ?? 0 },
  ].filter(d => d.value > 0);

  const skeleton = (w: number | string, h: number) => (
    <div style={{
      width: w, height: h, background: "#141428", borderRadius: 6,
      animation: "pulse 1.5s ease-in-out infinite",
    }} />
  );

  return (
    <div className="animate-fade-up">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#f1f5f9", letterSpacing: -0.5 }}>
          Dashboard
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
          Fund analytics & overview — All amounts in BDT
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
        <StatCard label="Net Worth" value={isLoading ? "—" : bdtC(data.netWorth)} icon={<FontAwesomeIcon icon={faChartLine} />} color="#7c3aed" />
        <StatCard label="Total Members" value={isLoading ? "—" : data.totalMembers} sub="Active members" icon={<FontAwesomeIcon icon={faUsers} />} color="#3b82f6" />
        <StatCard label="Total Invested" value={isLoading ? "—" : bdtC(data.totalInvested)} sub={`ROI: ${roi}%`} icon={<FontAwesomeIcon icon={faLayerGroup} />} color="#10b981" />
        <StatCard label="Total Assets" value={isLoading ? "—" : bdtC(data.totalAssets)} sub={`${data?.activeFunds ?? 0} active funds`} icon={<FontAwesomeIcon icon={faBuilding} />} color="#f59e0b" />
        <StatCard label="Wallet Balance" value={isLoading ? "—" : bdtC(data.totalWalletBalance)} sub="All members combined" icon={<FontAwesomeIcon icon={faWallet} />} color="#06b6d4" />
        <StatCard label="Pending Fines" value={isLoading ? "—" : bdt(data?.pendingFines?.amount ?? 0)} sub={`${data?.pendingFines?.count ?? 0} outstanding`} icon={<FontAwesomeIcon icon={faTriangleExclamation} />} color="#ef4444" />
        <StatCard label="Share Requests" value={isLoading ? "—" : String(data?.pendingShares ?? 0)} sub="Awaiting approval" icon={<FontAwesomeIcon icon={faCircleCheck} />} color="#a78bfa" />
        <StatCard label="Active Investments" value={isLoading ? "—" : String(data?.activeInvestments ?? 0)} sub="Running now" icon={<FontAwesomeIcon icon={faChartLine} />} color="#34d399" />
      </div>

      {/* Charts Row 1 */}
      <div className="chart-grid" style={{ marginBottom: 20 }}>
        {/* Growth Chart */}
        <div style={{ background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 14, padding: "22px 22px 14px" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>Fund Growth Over Time</h3>
          {snapshotChartData.length === 0 ? (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#334155", fontSize: 13 }}>
              No snapshot data yet — add monthly snapshots to track growth
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={snapshotChartData}>
                <defs>
                  <linearGradient id="gNW" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gInv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e38" />
                <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 11 }} />
                <YAxis tick={{ fill: "#475569", fontSize: 11 }} tickFormatter={v => bdtC(v)} />
                <Tooltip
                  contentStyle={{ background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 8 }}
                  labelStyle={{ color: "#94a3b8" }}
                  formatter={(v: unknown) => [bdt(Number(v))]}
                />
                <Area type="monotone" dataKey="Net Worth" stroke="#7c3aed" fill="url(#gNW)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="Invested" stroke="#10b981" fill="url(#gInv)" strokeWidth={2} dot={false} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#64748b" }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Portfolio Distribution */}
        <div style={{ background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 14, padding: "22px 22px 14px" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>Portfolio Distribution</h3>
          {investmentPieData.length === 0 ? (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#334155", fontSize: 13 }}>No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={investmentPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  dataKey="value" paddingAngle={3}>
                  {investmentPieData.map((_: unknown, i: number) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 8 }}
                  formatter={(v: unknown) => [bdt(Number(v))]}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: "#64748b" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="chart-grid">
        {/* Recent Transactions */}
        <div style={{ background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 14, padding: "22px 22px 8px" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>Recent Transactions</h3>
          {isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  {skeleton(34, 34)}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                    {skeleton("60%", 12)}{skeleton("40%", 10)}
                  </div>
                  {skeleton(80, 16)}
                </div>
              ))}
            </div>
          ) : !data?.recentTransactions?.length ? (
            <div style={{ color: "#334155", fontSize: 13, textAlign: "center", padding: "30px 0" }}>No transactions yet</div>
          ) : (
            <div>
              {data.recentTransactions.map((txn: Record<string, unknown>) => (
                <div key={String(txn.id)} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
                  borderBottom: "1px solid #0e0e1c",
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, display: "flex",
                    alignItems: "center", justifyContent: "center", flexShrink: 0,
                    background: txn.direction === "credit" ? "#064e3b" : "#450a0a",
                  }}>
                    <FontAwesomeIcon
                      icon={txn.direction === "credit" ? faArrowDown : faArrowUp}
                      style={{ fontSize: 13, color: txn.direction === "credit" ? "#10b981" : "#ef4444" }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#cbd5e1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {String(txn.description)}
                    </div>
                    <div style={{ fontSize: 11, color: "#475569" }}>
                      {format(new Date(String(txn.createdAt)), "dd MMM yyyy")}
                    </div>
                  </div>
                  <Badge status={String(txn.type)} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: txn.direction === "credit" ? "#10b981" : "#ef4444", marginLeft: 8 }}>
                    {txn.direction === "credit" ? "+" : "-"}{bdt(Number(txn.amount))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Meetings */}
        <div style={{ background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 14, padding: "22px 22px 14px" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>Upcoming Meetings</h3>
          {!data?.upcomingMeetings?.length ? (
            <div style={{ color: "#334155", fontSize: 13, textAlign: "center", padding: "30px 0" }}>No upcoming meetings</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {data.upcomingMeetings.map((m: Record<string, unknown>) => (
                <div key={String(m.id)} style={{
                  background: "#141428", border: "1px solid #1e1e38", borderRadius: 10,
                  padding: "12px 14px",
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9", marginBottom: 4 }}>{String(m.title)}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#475569" }}>
                    <FontAwesomeIcon icon={faCalendarDays} />
                    {format(new Date(String(m.scheduledAt)), "dd MMM yyyy, hh:mm a")}
                    <Badge status={String(m.type)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
