
"use client";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faCalendarDays, faUsers, faPencil, faCheck } from "@fortawesome/free-solid-svg-icons";
import useSWR from "swr";
import { format, isPast } from "date-fns";

const fetcher = (u: string) => fetch(u).then(r => r.json());

function Badge({ status }: { status: string }) {
  const m: Record<string, [string, string]> = {
    scheduled: ["#1e3a5f", "#3b82f6"], completed: ["#064e3b", "#34d399"],
    cancelled: ["#450a0a", "#ef4444"], general: ["#1e3a5f", "#60a5fa"],
    emergency: ["#450a0a", "#ef4444"], annual: ["#2e1065", "#a78bfa"],
    special: ["#451a03", "#f59e0b"],
  };
  const [bg, fg] = m[status] ?? ["#1e293b", "#94a3b8"];
  return <span style={{ background: bg, color: fg, padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: "capitalize" }}>{status}</span>;
}

interface ModalProps { title: string; onClose: () => void; children: React.ReactNode; }
function Modal({ title, onClose, children }: ModalProps) {
  return (
    <>
      <div className="animate-fade-in" onClick={onClose} style={{
        position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.5)",
      }} />
      <div className="animate-slide-right" style={{
        position: "fixed", top: 0, right: 0, height: "100vh", zIndex: 101, width: 480,
        background: "#0e0e1c", borderLeft: "1px solid #1e1e38",
        overflowY: "auto", padding: 32,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#f1f5f9" }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 20 }}>✕</button>
        </div>
        {children}
      </div>
    </>
  );
}

const inp: React.CSSProperties = { background: "#141428", border: "1px solid #1e1e38", borderRadius: 8, padding: "9px 12px", color: "#f1f5f9", fontSize: 13, width: "100%", boxSizing: "border-box" };
const emptyForm = { title: "", description: "", type: "general", scheduledAt: "", location: "", attendeeIds: [] as string[], status: "scheduled" };

export default function MeetingsPage() {
  const { data: meetings = [], mutate, isLoading } = useSWR<Record<string, unknown>[]>("/api/meetings", fetcher);
  const { data: users = [] } = useSWR<Record<string, unknown>[]>("/api/users", fetcher);
  const { data: me } = useSWR<Record<string, unknown>>("/api/auth/me", fetcher);
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null);
  const [detailItem, setDetailItem] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [filter, setFilter] = useState("all");

  const isAdmin = me?.role === "admin";
  const filtered = (meetings as Record<string, unknown>[]).filter(m => filter === "all" || m.status === filter || m.type === filter);

  const upcoming = (meetings as Record<string, unknown>[]).filter(m => m.status === "scheduled" && !isPast(new Date(String(m.scheduledAt)))).length;

  async function saveMeeting(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setMsg("");
    const url = editItem ? `/api/meetings/${editItem.id}` : "/api/meetings";
    const method = editItem ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { mutate(); setShowCreate(false); setEditItem(null); setForm({ ...emptyForm }); }
    else { const j = await res.json(); setMsg(j.error); }
    setSaving(false);
  }

  async function markAttended(meetingId: string, attendeeId: string, attended: boolean) {
    await fetch(`/api/meetings/${meetingId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attendeeAttendance: [{ attendeeId, attended }] }),
    });
    mutate();
    if (detailItem) {
      const updated = await fetch(`/api/meetings/${meetingId}`).then(r => r.json());
      setDetailItem(updated);
    }
  }

  function toggleAttendee(uid: string) {
    setForm(f => ({
      ...f,
      attendeeIds: f.attendeeIds.includes(uid)
        ? f.attendeeIds.filter(id => id !== uid)
        : [...f.attendeeIds, uid],
    }));
  }

  function openEdit(m: Record<string, unknown>) {
    setEditItem(m);
    setForm({
      title: String(m.title ?? ""), description: String(m.description ?? ""),
      type: String(m.type ?? "general"),
      scheduledAt: m.scheduledAt ? String(m.scheduledAt).slice(0, 16) : "",
      location: String(m.location ?? ""),
      attendeeIds: [], status: String(m.status ?? "scheduled"),
    });
    setMsg("");
  }

  async function openDetail(m: Record<string, unknown>) {
    const detail = await fetch(`/api/meetings/${m.id}`).then(r => r.json());
    setDetailItem(detail);
  }

  return (
    <div className="animate-fade-up">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#f1f5f9", letterSpacing: -0.5 }}>Meetings</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>{upcoming} upcoming · {meetings.length} total</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setShowCreate(true); setEditItem(null); setForm({ ...emptyForm }); setMsg(""); }} style={{
            background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none",
            borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <FontAwesomeIcon icon={faPlus} /> Schedule Meeting
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {["all", "scheduled", "completed", "cancelled", "general", "emergency", "annual", "special"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer",
            border: "none", background: filter === f ? "#7c3aed" : "#141428",
            color: filter === f ? "#fff" : "#64748b", textTransform: "capitalize",
          }}>{f}</button>
        ))}
      </div>

      {/* Meeting Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {isLoading ? [...Array(4)].map((_, i) => (
          <div key={i} style={{ background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 12, padding: 20, height: 80 }} />
        )) : filtered.map((m: Record<string, unknown>) => (
          <div key={String(m.id)} className="card-hover" style={{
            background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 12,
            padding: "18px 20px", cursor: "pointer",
          }} onClick={() => openDetail(m)}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>{String(m.title)}</h3>
                  <Badge status={String(m.status)} />
                  <Badge status={String(m.type)} />
                </div>
                {!!m.description && (
                  <p style={{ margin: "0 0 8px", fontSize: 12, color: "#64748b", maxWidth: 600 }}>{String(m.description).slice(0, 120)}</p>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12, color: "#475569" }}>
                  <span><FontAwesomeIcon icon={faCalendarDays} style={{ marginRight: 5 }} />
                    {m.scheduledAt ? format(new Date(String(m.scheduledAt)), "dd MMM yyyy, hh:mm a") : "—"}
                  </span>
                  {!!m.location && <span>📍 {String(m.location)}</span>}
                  <span><FontAwesomeIcon icon={faUsers} style={{ marginRight: 5 }} />{Number(m.attendeeCount ?? 0)} attendees</span>
                </div>
              </div>
              {isAdmin && (
                <button onClick={e => { e.stopPropagation(); openEdit(m); }} style={{ background: "#141428", border: "1px solid #1e1e38", borderRadius: 6, padding: "6px 10px", cursor: "pointer", color: "#64748b", marginLeft: 12 }}>
                  <FontAwesomeIcon icon={faPencil} style={{ fontSize: 11 }} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {!isLoading && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#334155" }}>
          <FontAwesomeIcon icon={faCalendarDays} style={{ fontSize: 32, marginBottom: 12 }} />
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>No meetings found</div>
        </div>
      )}

      {/* Detail Modal */}
      {detailItem && (
        <Modal title={String(detailItem.title)} onClose={() => setDetailItem(null)}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <Badge status={String(detailItem.status)} />
            <Badge status={String(detailItem.type)} />
          </div>
          {!!detailItem.description && <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 16px" }}>{String(detailItem.description)}</p>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div style={{ background: "#141428", borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ fontSize: 10, color: "#475569", fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>Date & Time</div>
              <div style={{ fontSize: 13, color: "#f1f5f9" }}>{detailItem.scheduledAt ? format(new Date(String(detailItem.scheduledAt)), "dd MMM yyyy, hh:mm a") : "—"}</div>
            </div>
            {!!detailItem.location && (
              <div style={{ background: "#141428", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, color: "#475569", fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>Location</div>
                <div style={{ fontSize: 13, color: "#f1f5f9" }}>{String(detailItem.location)}</div>
              </div>
            )}
          </div>
          <div style={{ marginTop: 4 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
              Attendees ({((detailItem.attendees as unknown[]) ?? []).length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {((detailItem.attendees as Record<string, unknown>[]) ?? []).map((a: Record<string, unknown>) => (
                <div key={String(a.userId)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#141428", borderRadius: 8, padding: "8px 12px" }}>
                  <span style={{ fontSize: 13, color: "#cbd5e1" }}>{String(a.userName ?? a.userId)}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: a.attended ? "#10b981" : "#64748b" }}>{a.attended ? "✓ Attended" : "Absent"}</span>
                    {isAdmin && (
                      <button onClick={() => markAttended(String(detailItem.id), String(a.userId), !a.attended)} style={{
                        background: a.attended ? "#064e3b" : "#141428", border: `1px solid ${a.attended ? "#10b981" : "#1e1e38"}`,
                        color: a.attended ? "#10b981" : "#64748b", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 11,
                      }}>
                        {a.attended ? "Mark Absent" : "Mark Present"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {isAdmin && (
            <div style={{ marginTop: 20, display: "flex", gap: 8 }}>
              {detailItem.status === "scheduled" && (
                <button onClick={async () => {
                  await fetch(`/api/meetings/${detailItem.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "completed" }) });
                  mutate(); setDetailItem(null);
                }} style={{ background: "#064e3b", color: "#10b981", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  Mark Completed
                </button>
              )}
              {detailItem.status === "scheduled" && (
                <button onClick={async () => {
                  await fetch(`/api/meetings/${detailItem.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "cancelled" }) });
                  mutate(); setDetailItem(null);
                }} style={{ background: "#450a0a", color: "#f87171", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  Cancel Meeting
                </button>
              )}
            </div>
          )}
        </Modal>
      )}

      {/* Create/Edit Modal */}
      {(showCreate || editItem) && (
        <Modal title={editItem ? "Edit Meeting" : "Schedule Meeting"} onClose={() => { setShowCreate(false); setEditItem(null); }}>
          <form onSubmit={saveMeeting} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div><label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 4 }}>Title *</label><input required value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} style={inp} /></div>
            <div><label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 4 }}>Description</label><textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} style={{ ...inp, resize: "vertical", minHeight: 60 }} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 4 }}>Type</label>
                <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))} style={inp}>
                  <option value="general">General</option><option value="annual">Annual</option>
                  <option value="emergency">Emergency</option><option value="special">Special</option>
                </select>
              </div>
              <div><label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 4 }}>Status</label>
                <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))} style={inp}>
                  <option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div><label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 4 }}>Date & Time *</label><input required type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({...f, scheduledAt: e.target.value}))} style={inp} /></div>
              <div><label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 4 }}>Location</label><input value={form.location} onChange={e => setForm(f => ({...f, location: e.target.value}))} style={inp} placeholder="e.g. Conference Room A" /></div>
            </div>
            {!editItem && (
              <div>
                <label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 8 }}>Select Attendees</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 180, overflowY: "auto" }}>
                  {(users as Record<string, unknown>[]).map(u => (
                    <label key={String(u.id)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 10px", borderRadius: 6, background: form.attendeeIds.includes(String(u.id)) ? "#1a1a35" : "transparent" }}>
                      <input type="checkbox" checked={form.attendeeIds.includes(String(u.id))} onChange={() => toggleAttendee(String(u.id))} style={{ accentColor: "#7c3aed" }} />
                      <span style={{ fontSize: 13, color: "#cbd5e1" }}>{String(u.name)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            {msg && <div style={{ color: "#f87171", fontSize: 12 }}>{msg}</div>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => { setShowCreate(false); setEditItem(null); }} style={{ background: "#141428", border: "1px solid #1e1e38", color: "#94a3b8", borderRadius: 8, padding: "9px 16px", fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button type="submit" disabled={saving} style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                {saving ? "Saving…" : editItem ? "Save Changes" : "Schedule"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
