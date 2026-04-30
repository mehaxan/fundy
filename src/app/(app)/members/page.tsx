
"use client";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserPlus, faSearch, faUserCheck, faUserXmark,
  faPencil, faEllipsisV, faWallet,
} from "@fortawesome/free-solid-svg-icons";
import useSWR from "swr";
import { format } from "date-fns";

const fetcher = (u: string) => fetch(u).then(r => r.json());
function bdt(n: number) { return `৳${(n || 0).toLocaleString("en-IN")}`; }

function Badge({ status }: { status: string }) {
  const m: Record<string, [string, string]> = {
    admin: ["#2e1065", "#a78bfa"], member: ["#1e3a5f", "#60a5fa"],
    active: ["#064e3b", "#10b981"], inactive: ["#450a0a", "#f87171"],
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
        padding: 28, width: "100%", margin: "0 auto", maxWidth: 520,
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

const inp: React.CSSProperties = {
  background: "#141428", border: "1px solid #1e1e38", borderRadius: 8,
  padding: "9px 12px", color: "#f1f5f9", fontSize: 13, width: "100%", boxSizing: "border-box",
};

export default function MembersPage() {
  const { data: members = [], mutate, isLoading } = useSWR<Record<string, unknown>[]>("/api/users", fetcher);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: "member", address: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const filtered = members.filter((m: Record<string, unknown>) =>
    String(m.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    String(m.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  async function addUser(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setMsg("");
    const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { mutate(); setShowAdd(false); setForm({ name: "", email: "", phone: "", password: "", role: "member", address: "" }); }
    else { const j = await res.json(); setMsg(j.error); }
    setSaving(false);
  }

  async function updateUser(e: React.FormEvent) {
    e.preventDefault(); if (!editUser) return; setSaving(true); setMsg("");
    const res = await fetch(`/api/users/${editUser.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { mutate(); setEditUser(null); }
    else { const j = await res.json(); setMsg(j.error); }
    setSaving(false);
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch(`/api/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !isActive }) });
    mutate();
  }

  function openEdit(m: Record<string, unknown>) {
    setEditUser(m);
    setForm({ name: String(m.name ?? ""), email: String(m.email ?? ""), phone: String(m.phone ?? ""), password: "", role: String(m.role ?? "member"), address: String(m.address ?? "") });
    setMsg("");
  }

  return (
    <div className="animate-fade-up">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#f1f5f9", letterSpacing: -0.5 }}>Members</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>{members.length} total members</p>
        </div>
        <button onClick={() => { setShowAdd(true); setMsg(""); }} style={{
          background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none",
          borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <FontAwesomeIcon icon={faUserPlus} /> Add Member
        </button>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 20, maxWidth: 380 }}>
        <FontAwesomeIcon icon={faSearch} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#475569", fontSize: 13 }} />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          style={{ ...inp, paddingLeft: 36, width: 380 }}
        />
      </div>

      {/* Table */}
      <div style={{ background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 14, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Member", "Email", "Phone", "Role", "Wallet", "Joined", "Status", ""].map(h => (
                <th key={h} style={{ textAlign: "left", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, padding: "12px 16px", borderBottom: "1px solid #1e1e38" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? [...Array(5)].map((_, i) => (
              <tr key={i}><td colSpan={8} style={{ padding: 14 }}><div style={{ height: 14, background: "#141428", borderRadius: 4, width: "80%" }} /></td></tr>
            )) : filtered.map((m: Record<string, unknown>) => (
              <tr key={String(m.id)} style={{ transition: "background 0.1s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#0e0e1c80")}
                onMouseLeave={e => (e.currentTarget.style.background = "")}>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid #141428" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%", background: "#2e1065",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, color: "#a78bfa", flexShrink: 0,
                    }}>
                      {String(m.name ?? "?").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#f1f5f9" }}>{String(m.name)}</span>
                  </div>
                </td>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid #141428", fontSize: 13, color: "#94a3b8" }}>{String(m.email)}</td>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid #141428", fontSize: 13, color: "#94a3b8" }}>{m.phone ? String(m.phone) : "—"}</td>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid #141428" }}><Badge status={String(m.role)} /></td>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid #141428", fontSize: 13, fontWeight: 600, color: "#10b981" }}>{bdt(Number(m.walletBalance ?? 0))}</td>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid #141428", fontSize: 12, color: "#64748b" }}>
                  {m.joinedAt ? format(new Date(String(m.joinedAt)), "dd MMM yyyy") : "—"}
                </td>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid #141428" }}>
                  <Badge status={m.isActive ? "active" : "inactive"} />
                </td>
                <td style={{ padding: "12px 16px", borderBottom: "1px solid #141428" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => openEdit(m)} style={{ background: "#141428", border: "1px solid #1e1e38", borderRadius: 6, padding: "5px 9px", cursor: "pointer", color: "#94a3b8" }}>
                      <FontAwesomeIcon icon={faPencil} style={{ fontSize: 11 }} />
                    </button>
                    <button onClick={() => toggleActive(String(m.id), Boolean(m.isActive))} style={{ background: "#141428", border: "1px solid #1e1e38", borderRadius: 6, padding: "5px 9px", cursor: "pointer", color: m.isActive ? "#ef4444" : "#10b981" }}>
                      <FontAwesomeIcon icon={m.isActive ? faUserXmark : faUserCheck} style={{ fontSize: 11 }} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#334155", fontSize: 13 }}>No members found</div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAdd && (
        <Modal title="Add New Member" onClose={() => setShowAdd(false)}>
          <form onSubmit={addUser} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div><label style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Full Name *</label><input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} style={inp} placeholder="John Doe" /></div>
              <div><label style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Email *</label><input required type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} style={inp} placeholder="john@example.com" /></div>
              <div><label style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Phone</label><input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} style={inp} placeholder="+8801XXXXXXXXX" /></div>
              <div><label style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Password *</label><input required type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} style={inp} placeholder="Min 8 chars" /></div>
              <div><label style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Role</label>
                <select value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))} style={{ ...inp }}>
                  <option value="member">Member</option><option value="admin">Admin</option>
                </select>
              </div>
              <div><label style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Address</label><input value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} style={inp} placeholder="Dhaka, Bangladesh" /></div>
            </div>
            {msg && <div style={{ color: "#f87171", fontSize: 12 }}>{msg}</div>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
              <button type="button" onClick={() => setShowAdd(false)} style={{ background: "#141428", border: "1px solid #1e1e38", color: "#94a3b8", borderRadius: 8, padding: "9px 16px", fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button type="submit" disabled={saving} style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                {saving ? "Adding…" : "Add Member"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {editUser && (
        <Modal title="Edit Member" onClose={() => setEditUser(null)}>
          <form onSubmit={updateUser} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div><label style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Full Name</label><input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} style={inp} /></div>
              <div><label style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Email</label><input value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} style={inp} /></div>
              <div><label style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Phone</label><input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} style={inp} /></div>
              <div><label style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Role</label>
                <select value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))} style={inp}>
                  <option value="member">Member</option><option value="admin">Admin</option>
                </select>
              </div>
              <div style={{ gridColumn: "span 2" }}><label style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>Address</label><input value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} style={inp} /></div>
            </div>
            {msg && <div style={{ color: "#f87171", fontSize: 12 }}>{msg}</div>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
              <button type="button" onClick={() => setEditUser(null)} style={{ background: "#141428", border: "1px solid #1e1e38", color: "#94a3b8", borderRadius: 8, padding: "9px 16px", fontSize: 13, cursor: "pointer" }}>Cancel</button>
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
