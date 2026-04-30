
"use client";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faLayerGroup, faChevronRight, faPencil } from "@fortawesome/free-solid-svg-icons";
import useSWR from "swr";
import { format } from "date-fns";

const fetcher = (u: string) => fetch(u).then(r => r.json());
function bdt(n: number) { return `৳${(n || 0).toLocaleString("en-IN")}`; }

function Badge({ status }: { status: string }) {
  const m: Record<string, [string, string]> = {
    active: ["#064e3b", "#10b981"], closed: ["#1e293b", "#94a3b8"], paused: ["#451a03", "#f59e0b"],
  };
  const [bg, fg] = m[status] ?? ["#1e293b", "#94a3b8"];
  return <span style={{ background: bg, color: fg, padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: "capitalize" }}>{status}</span>;
}

interface ModalProps { title: string; onClose: () => void; children: React.ReactNode; }
function Modal({ title, onClose, children }: ModalProps) {
  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);
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

export default function FundsPage() {
  const { data: funds = [], mutate, isLoading } = useSWR<Record<string, unknown>[]>("/api/funds", fetcher);
  const [showCreate, setShowCreate] = useState(false);
  const [editFund, setEditFund] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({ name: "", description: "", sharePrice: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function createFund(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setMsg("");
    const res = await fetch("/api/funds", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, sharePrice: Number(form.sharePrice) }) });
    if (res.ok) { mutate(); setShowCreate(false); setForm({ name: "", description: "", sharePrice: "" }); }
    else { const j = await res.json(); setMsg(j.error); }
    setSaving(false);
  }

  async function updateFund(e: React.FormEvent) {
    e.preventDefault(); if (!editFund) return; setSaving(true); setMsg("");
    const res = await fetch(`/api/funds/${editFund.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.name, description: form.description, sharePrice: Number(form.sharePrice) }) });
    if (res.ok) { mutate(); setEditFund(null); }
    else { const j = await res.json(); setMsg(j.error); }
    setSaving(false);
  }

  async function setStatus(id: string, status: string) {
    await fetch(`/api/funds/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    mutate();
  }

  const totalValue = funds.reduce((a, f) => a + Number(f.totalValue ?? 0), 0);

  return (
    <div className="animate-fade-up">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#f1f5f9", letterSpacing: -0.5 }}>Funds</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
            {funds.length} funds · Total value: {bdt(totalValue)}
          </p>
        </div>
        <button onClick={() => { setShowCreate(true); setMsg(""); }} style={{
          background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none",
          borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <FontAwesomeIcon icon={faPlus} /> Create Fund
        </button>
      </div>

      {/* Fund Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        {isLoading ? [...Array(3)].map((_, i) => (
          <div key={i} style={{ background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 14, padding: 22, height: 180 }} />
        )) : funds.map((f: Record<string, unknown>) => (
          <div key={String(f.id)} className="card-hover" style={{
            background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 14, padding: 22,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "#2e1065", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FontAwesomeIcon icon={faLayerGroup} style={{ color: "#7c3aed", fontSize: 16 }} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>{String(f.name)}</div>
                  <Badge status={String(f.status)} />
                </div>
              </div>
              <button onClick={() => { setEditFund(f); setForm({ name: String(f.name), description: String(f.description ?? ""), sharePrice: String(f.sharePrice) }); setMsg(""); }}
                style={{ background: "#141428", border: "1px solid #1e1e38", borderRadius: 6, padding: "5px 9px", cursor: "pointer", color: "#64748b" }}>
                <FontAwesomeIcon icon={faPencil} style={{ fontSize: 11 }} />
              </button>
            </div>

            {!!f.description && <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 14px" }}>{String(f.description)}</p>}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div style={{ background: "#141428", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, color: "#475569", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Share Price</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#a78bfa" }}>{bdt(Number(f.sharePrice))}</div>
              </div>
              <div style={{ background: "#141428", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, color: "#475569", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Total Value</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#10b981" }}>{bdt(Number(f.totalValue ?? 0))}</div>
              </div>
              <div style={{ background: "#141428", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, color: "#475569", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Shares Sold</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>{Number(f.totalShareQty ?? 0).toLocaleString()}</div>
              </div>
              <div style={{ background: "#141428", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, color: "#475569", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Pending</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: Number(f.pendingShares) > 0 ? "#f59e0b" : "#64748b" }}>{String(f.pendingShares ?? 0)}</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #1e1e38", paddingTop: 12 }}>
              <span style={{ fontSize: 11, color: "#64748b" }}>
                Created {f.createdAt ? format(new Date(String(f.createdAt)), "dd MMM yyyy") : "—"}
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                {String(f.status) === "active" && (
                  <button onClick={() => setStatus(String(f.id), "paused")} style={{ background: "#451a03", color: "#f59e0b", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>Pause</button>
                )}
                {String(f.status) === "paused" && (
                  <button onClick={() => setStatus(String(f.id), "active")} style={{ background: "#064e3b", color: "#10b981", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>Resume</button>
                )}
                {String(f.status) !== "closed" && (
                  <button onClick={() => setStatus(String(f.id), "closed")} style={{ background: "#1e293b", color: "#94a3b8", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>Close</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {!isLoading && funds.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px 0", color: "#334155" }}>
          <FontAwesomeIcon icon={faLayerGroup} style={{ fontSize: 32, marginBottom: 12 }} />
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>No funds yet</div>
          <div style={{ fontSize: 13 }}>Create your first fund to get started</div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <Modal title="Create Fund" onClose={() => setShowCreate(false)}>
          <form onSubmit={createFund} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div><label style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Fund Name *</label><input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} style={inp} placeholder="e.g. Growth Fund 2025" /></div>
            <div><label style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Description</label><textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} style={{ ...inp, resize: "vertical", minHeight: 80 }} placeholder="What is this fund for?" /></div>
            <div><label style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Share Price (BDT) *</label><input required type="number" min="1" value={form.sharePrice} onChange={e => setForm(f => ({...f, sharePrice: e.target.value}))} style={inp} placeholder="e.g. 1000" /></div>
            {msg && <div style={{ color: "#f87171", fontSize: 12 }}>{msg}</div>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setShowCreate(false)} style={{ background: "#141428", border: "1px solid #1e1e38", color: "#94a3b8", borderRadius: 8, padding: "9px 16px", fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button type="submit" disabled={saving} style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                {saving ? "Creating…" : "Create Fund"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {editFund && (
        <Modal title="Edit Fund" onClose={() => setEditFund(null)}>
          <form onSubmit={updateFund} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div><label style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Fund Name</label><input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} style={inp} /></div>
            <div><label style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Description</label><textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} style={{ ...inp, resize: "vertical", minHeight: 80 }} /></div>
            <div><label style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Share Price (BDT)</label><input type="number" value={form.sharePrice} onChange={e => setForm(f => ({...f, sharePrice: e.target.value}))} style={inp} /></div>
            {msg && <div style={{ color: "#f87171", fontSize: 12 }}>{msg}</div>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setEditFund(null)} style={{ background: "#141428", border: "1px solid #1e1e38", color: "#94a3b8", borderRadius: 8, padding: "9px 16px", fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button type="submit" disabled={saving} style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
