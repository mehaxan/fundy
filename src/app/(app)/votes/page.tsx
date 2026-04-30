
"use client";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faSquarePollVertical, faCheckDouble } from "@fortawesome/free-solid-svg-icons";
import useSWR from "swr";
import { format, isPast } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const fetcher = (u: string) => fetch(u).then(r => r.json());

function Badge({ status }: { status: string }) {
  const m: Record<string, [string, string]> = {
    open: ["#064e3b", "#10b981"], closed: ["#1e293b", "#94a3b8"],
    draft: ["#1e293b", "#64748b"], cancelled: ["#450a0a", "#ef4444"],
    yes: ["#064e3b", "#10b981"], no: ["#450a0a", "#f87171"],
    abstain: ["#1e293b", "#64748b"],
  };
  const [bg, fg] = m[status] ?? ["#1e293b", "#94a3b8"];
  return <span style={{ background: bg, color: fg, padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: "capitalize" }}>{status}</span>;
}

interface ModalProps { title: string; onClose: () => void; children: React.ReactNode; }
function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="animate-fade-in" onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div className="animate-fade-up" style={{
        background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 16,
        padding: 28, width: "100%", maxWidth: 560, maxHeight: "85vh", overflowY: "auto",
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

export default function VotesPage() {
  const { data: votes = [], mutate, isLoading } = useSWR<Record<string, unknown>[]>("/api/votes", fetcher);
  const { data: me } = useSWR<Record<string, unknown>>("/api/auth/me", fetcher);
  const [showCreate, setShowCreate] = useState(false);
  const [detailItem, setDetailItem] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({ title: "", description: "", closesAt: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [filter, setFilter] = useState("all");
  const [myVote, setMyVote] = useState<string>("");
  const [voteReason, setVoteReason] = useState("");

  const isAdmin = me?.role === "admin";
  const filtered = (votes as Record<string, unknown>[]).filter(v => filter === "all" || v.status === filter);

  async function createVote(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setMsg("");
    const res = await fetch("/api/votes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { mutate(); setShowCreate(false); setForm({ title: "", description: "", closesAt: "" }); }
    else { const j = await res.json(); setMsg(j.error); }
    setSaving(false);
  }

  async function openDetail(v: Record<string, unknown>) {
    const detail = await fetch(`/api/votes/${v.id}`).then(r => r.json());
    setDetailItem(detail);
    setMyVote(String(detail.myResponse?.response ?? ""));
    setVoteReason(String(detail.myResponse?.reason ?? ""));
  }

  async function submitVote() {
    if (!detailItem || !myVote) return;
    setSaving(true);
    const res = await fetch(`/api/votes/${detailItem.id}/respond`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response: myVote, reason: voteReason }),
    });
    if (res.ok) {
      const updated = await fetch(`/api/votes/${detailItem.id}`).then(r => r.json());
      setDetailItem(updated);
    }
    setSaving(false);
  }

  async function closeVote(id: string) {
    await fetch(`/api/votes/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "closed" }) });
    mutate();
    setDetailItem(null);
  }

  return (
    <div className="animate-fade-up">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#f1f5f9", letterSpacing: -0.5 }}>Votes</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>Fund decisions and member voting</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowCreate(true)} style={{
            background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none",
            borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <FontAwesomeIcon icon={faPlus} /> Create Vote
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {["all", "open", "closed", "draft", "cancelled"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
            border: "none", background: filter === f ? "#7c3aed" : "#141428",
            color: filter === f ? "#fff" : "#64748b", textTransform: "capitalize",
          }}>{f}</button>
        ))}
      </div>

      {/* Vote Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {isLoading ? [...Array(3)].map((_, i) => (
          <div key={i} style={{ background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 12, padding: 20, height: 100 }} />
        )) : filtered.map((v: Record<string, unknown>) => {
          const yes = Number(v.yesCount ?? 0);
          const no = Number(v.noCount ?? 0);
          const abstain = Number(v.abstainCount ?? 0);
          const total = yes + no + abstain;
          const yesPct = total > 0 ? Math.round((yes / total) * 100) : 0;
          const noPct = total > 0 ? Math.round((no / total) * 100) : 0;
          return (
            <div key={String(v.id)} className="card-hover" style={{
              background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 12,
              padding: "18px 20px", cursor: "pointer",
            }} onClick={() => openDetail(v)}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>{String(v.title)}</h3>
                    <Badge status={String(v.status)} />
                  </div>
                  {!!v.description && <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>{String(v.description).slice(0, 100)}</p>}
                </div>
                <div style={{ textAlign: "right", fontSize: 12, color: "#64748b", whiteSpace: "nowrap", marginLeft: 12 }}>
                  {Number(v.responseCount ?? 0)} responses
                  {!!v.closesAt && <div>{isPast(new Date(String(v.closesAt))) ? "Closed" : `Closes ${format(new Date(String(v.closesAt)), "dd MMM")}`}</div>}
                </div>
              </div>
              {total > 0 && (
                <div>
                  <div style={{ display: "flex", gap: 2, height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 4 }}>
                    <div style={{ width: `${yesPct}%`, background: "#10b981" }} />
                    <div style={{ width: `${noPct}%`, background: "#ef4444" }} />
                    <div style={{ width: `${100 - yesPct - noPct}%`, background: "#334155" }} />
                  </div>
                  <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#475569" }}>
                    <span style={{ color: "#10b981" }}>✓ Yes: {yes} ({yesPct}%)</span>
                    <span style={{ color: "#f87171" }}>✗ No: {no} ({noPct}%)</span>
                    <span>— Abstain: {abstain}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!isLoading && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#334155" }}>
          <FontAwesomeIcon icon={faSquarePollVertical} style={{ fontSize: 32, marginBottom: 12 }} />
          <div style={{ fontSize: 15, fontWeight: 600 }}>No votes found</div>
        </div>
      )}

      {/* Detail Modal */}
      {detailItem && (
        <Modal title={String(detailItem.title)} onClose={() => setDetailItem(null)}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <Badge status={String(detailItem.status)} />
            {!!detailItem.closesAt && <span style={{ fontSize: 11, color: "#64748b" }}>Closes: {format(new Date(String(detailItem.closesAt)), "dd MMM yyyy, hh:mm a")}</span>}
          </div>
          {!!detailItem.description && <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 20px" }}>{String(detailItem.description)}</p>}

          {/* Results Chart */}
          {(detailItem.responses as unknown[])?.length > 0 && (() => {
            const resps = (detailItem.responses as Record<string, unknown>[]);
            const yes = resps.filter(r => r.response === "yes").length;
            const no = resps.filter(r => r.response === "no").length;
            const abstain = resps.filter(r => r.response === "abstain").length;
            const chartData = [{ name: "Yes", value: yes, fill: "#10b981" }, { name: "No", value: no, fill: "#ef4444" }, { name: "Abstain", value: abstain, fill: "#64748b" }];
            return (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Results ({resps.length} votes)</div>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={chartData} layout="vertical">
                    <XAxis type="number" tick={{ fill: "#475569", fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} width={50} />
                    <Tooltip contentStyle={{ background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 8 }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            );
          })()}

          {/* My Vote */}
          {detailItem.status === "open" && (
            <div style={{ background: "#141428", border: "1px solid #1e1e38", borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
                {detailItem.myResponse ? "Your Vote" : "Cast Your Vote"}
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                {["yes", "no", "abstain"].map(opt => (
                  <button key={opt} onClick={() => setMyVote(opt)} style={{
                    flex: 1, padding: "9px 0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer",
                    border: `2px solid ${myVote === opt ? (opt === "yes" ? "#10b981" : opt === "no" ? "#ef4444" : "#64748b") : "#1e1e38"}`,
                    background: myVote === opt ? (opt === "yes" ? "#064e3b" : opt === "no" ? "#450a0a" : "#1e293b") : "transparent",
                    color: myVote === opt ? (opt === "yes" ? "#10b981" : opt === "no" ? "#f87171" : "#94a3b8") : "#64748b",
                    textTransform: "capitalize",
                  }}>{opt === "yes" ? "✓ Yes" : opt === "no" ? "✗ No" : "— Abstain"}</button>
                ))}
              </div>
              <input value={voteReason} onChange={e => setVoteReason(e.target.value)} style={inp} placeholder="Reason (optional)" />
              <button onClick={submitVote} disabled={!myVote || saving} style={{
                marginTop: 10, width: "100%", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff",
                border: "none", borderRadius: 8, padding: "10px 0", fontSize: 13, fontWeight: 600,
                cursor: myVote ? "pointer" : "not-allowed", opacity: myVote ? 1 : 0.5,
              }}>
                {saving ? "Submitting…" : detailItem.myResponse ? "Update Vote" : "Submit Vote"}
              </button>
            </div>
          )}

          {/* Responses */}
          {isAdmin && (detailItem.responses as unknown[])?.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>All Responses</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" }}>
                {(detailItem.responses as Record<string, unknown>[]).map((r: Record<string, unknown>) => (
                  <div key={String(r.userId)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#141428", borderRadius: 8, padding: "8px 12px" }}>
                    <span style={{ fontSize: 13, color: "#cbd5e1" }}>{String(r.userName ?? r.userId)}</span>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {!!r.reason && <span style={{ fontSize: 11, color: "#475569" }}>{String(r.reason).slice(0, 40)}</span>}
                      <Badge status={String(r.response)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isAdmin && detailItem.status === "open" && (
            <button onClick={() => closeVote(String(detailItem.id))} style={{ marginTop: 16, background: "#1e293b", color: "#94a3b8", border: "1px solid #1e1e38", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              Close Vote
            </button>
          )}
        </Modal>
      )}

      {/* Create Modal */}
      {showCreate && (
        <Modal title="Create Vote" onClose={() => setShowCreate(false)}>
          <form onSubmit={createVote} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div><label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 4 }}>Title *</label><input required value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} style={inp} placeholder="What are we voting on?" /></div>
            <div><label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 4 }}>Description</label><textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} style={{ ...inp, resize: "vertical", minHeight: 80 }} placeholder="Provide context for voters…" /></div>
            <div><label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 4 }}>Closes At</label><input type="datetime-local" value={form.closesAt} onChange={e => setForm(f => ({...f, closesAt: e.target.value}))} style={inp} /></div>
            {msg && <div style={{ color: "#f87171", fontSize: 12 }}>{msg}</div>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setShowCreate(false)} style={{ background: "#141428", border: "1px solid #1e1e38", color: "#94a3b8", borderRadius: 8, padding: "9px 16px", fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button type="submit" disabled={saving} style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                {saving ? "Creating…" : "Create Vote"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
