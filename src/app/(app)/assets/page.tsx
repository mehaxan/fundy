
"use client";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faBuilding, faPencil, faTrash, faArrowUp, faArrowDown } from "@fortawesome/free-solid-svg-icons";
import useSWR from "swr";
import { format } from "date-fns";

const fetcher = (u: string) => fetch(u).then(r => r.json());
function bdt(n: number) { return `৳${(n || 0).toLocaleString("en-IN")}`; }

function Badge({ status }: { status: string }) {
  const m: Record<string, [string, string]> = {
    active: ["#064e3b", "#10b981"], under_maintenance: ["#451a03", "#f59e0b"],
    disposed: ["#450a0a", "#ef4444"],
  };
  const [bg, fg] = m[status] ?? ["#1e293b", "#94a3b8"];
  return <span style={{ background: bg, color: fg, padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: "capitalize" }}>{status.replace(/_/g, " ")}</span>;
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
        padding: 28, width: "100%", maxWidth: 540, maxHeight: "85vh", overflowY: "auto",
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
const emptyForm = { name: "", description: "", category: "", purchaseValue: "", currentValue: "", purchaseDate: "", status: "active" };

const CATEGORIES = ["Real Estate", "Vehicle", "Equipment", "Technology", "Furniture", "Land", "Other"];
const CAT_ICONS: Record<string, string> = {
  "Real Estate": "🏢", "Vehicle": "🚗", "Equipment": "⚙️", "Technology": "💻",
  "Furniture": "🪑", "Land": "🌾", "Other": "📦",
};

export default function AssetsPage() {
  const { data: assets = [], mutate, isLoading } = useSWR<Record<string, unknown>[]>("/api/assets", fetcher);
  const { data: me } = useSWR<Record<string, unknown>>("/api/auth/me", fetcher);
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const isAdmin = me?.role === "admin";
  const filtered = (assets as Record<string, unknown>[]).filter(a => filterStatus === "all" || a.status === filterStatus);

  const totalPurchase = assets.reduce((a, x) => a + Number(x.purchaseValue ?? 0), 0);
  const totalCurrent = assets.reduce((a, x) => a + Number(x.currentValue ?? 0), 0);
  const appreciation = totalCurrent - totalPurchase;

  async function saveAsset(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setMsg("");
    const payload = {
      ...form,
      purchaseValue: Number(form.purchaseValue),
      currentValue: form.currentValue ? Number(form.currentValue) : undefined,
    };
    const url = editItem ? `/api/assets/${editItem.id}` : "/api/assets";
    const method = editItem ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) { mutate(); setShowCreate(false); setEditItem(null); setForm({ ...emptyForm }); }
    else { const j = await res.json(); setMsg(j.error); }
    setSaving(false);
  }

  async function disposeAsset(id: string) {
    if (!confirm("Mark asset as disposed?")) return;
    await fetch(`/api/assets/${id}`, { method: "DELETE" });
    mutate();
  }

  function openEdit(item: Record<string, unknown>) {
    setEditItem(item);
    setForm({
      name: String(item.name ?? ""), description: String(item.description ?? ""),
      category: String(item.category ?? ""), purchaseValue: String(item.purchaseValue ?? ""),
      currentValue: String(item.currentValue ?? ""),
      purchaseDate: item.purchaseDate ? String(item.purchaseDate).slice(0, 10) : "",
      status: String(item.status ?? "active"),
    });
    setMsg("");
  }

  return (
    <div className="animate-fade-up">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#f1f5f9", letterSpacing: -0.5 }}>Assets</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>Fund property and asset management</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setShowCreate(true); setEditItem(null); setForm({ ...emptyForm }); setMsg(""); }} style={{
            background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none",
            borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <FontAwesomeIcon icon={faPlus} /> Add Asset
          </button>
        )}
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Assets", value: String(assets.length), color: "#7c3aed" },
          { label: "Purchase Value", value: bdt(totalPurchase), color: "#3b82f6" },
          { label: "Current Value", value: bdt(totalCurrent), color: "#10b981" },
          { label: "Appreciation", value: `${appreciation >= 0 ? "+" : ""}${bdt(appreciation)}`, color: appreciation >= 0 ? "#10b981" : "#ef4444" },
        ].map(s => (
          <div key={s.label} style={{ background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {["all", "active", "under_maintenance", "disposed"].map(f => (
          <button key={f} onClick={() => setFilterStatus(f)} style={{
            padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
            border: "none", background: filterStatus === f ? "#7c3aed" : "#141428",
            color: filterStatus === f ? "#fff" : "#64748b", textTransform: "capitalize",
          }}>{f.replace(/_/g, " ")}</button>
        ))}
      </div>

      {/* Asset Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {isLoading ? [...Array(4)].map((_, i) => (
          <div key={i} style={{ background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 14, padding: 20, height: 180 }} />
        )) : filtered.map((asset: Record<string, unknown>) => {
          const gain = Number(asset.currentValue ?? 0) - Number(asset.purchaseValue ?? 0);
          const gainPct = Number(asset.purchaseValue) > 0 ? ((gain / Number(asset.purchaseValue)) * 100).toFixed(1) : "0.0";
          return (
            <div key={String(asset.id)} className="card-hover" style={{
              background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 14, padding: 20,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: 24 }}>{CAT_ICONS[String(asset.category ?? "")] ?? "📦"}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>{String(asset.name)}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{String(asset.category ?? "—")}</div>
                  </div>
                </div>
                <Badge status={String(asset.status)} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div style={{ background: "#141428", borderRadius: 8, padding: "8px 10px" }}>
                  <div style={{ fontSize: 10, color: "#475569", fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>Purchase</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8" }}>{bdt(Number(asset.purchaseValue))}</div>
                </div>
                <div style={{ background: "#141428", borderRadius: 8, padding: "8px 10px" }}>
                  <div style={{ fontSize: 10, color: "#475569", fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>Current</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>{asset.currentValue ? bdt(Number(asset.currentValue)) : "—"}</div>
                </div>
              </div>

              {asset.currentValue && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                  <FontAwesomeIcon icon={gain >= 0 ? faArrowUp : faArrowDown} style={{ fontSize: 11, color: gain >= 0 ? "#10b981" : "#ef4444" }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: gain >= 0 ? "#10b981" : "#ef4444" }}>
                    {gain >= 0 ? "+" : ""}{bdt(gain)} ({gainPct}%)
                  </span>
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #1e1e38", paddingTop: 10 }}>
                <span style={{ fontSize: 11, color: "#64748b" }}>
                  {asset.purchaseDate ? format(new Date(String(asset.purchaseDate)), "dd MMM yyyy") : "—"}
                </span>
                {isAdmin && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => openEdit(asset)} style={{ background: "#141428", border: "1px solid #1e1e38", borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: "#64748b" }}>
                      <FontAwesomeIcon icon={faPencil} style={{ fontSize: 10 }} />
                    </button>
                    {asset.status !== "disposed" && (
                      <button onClick={() => disposeAsset(String(asset.id))} style={{ background: "#450a0a", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: "#f87171" }}>
                        <FontAwesomeIcon icon={faTrash} style={{ fontSize: 10 }} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!isLoading && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#334155" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🏢</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>No assets found</div>
          <div style={{ fontSize: 13 }}>Add fund assets to track values</div>
        </div>
      )}

      {/* Modal */}
      {(showCreate || editItem) && (
        <Modal title={editItem ? "Edit Asset" : "Add Asset"} onClose={() => { setShowCreate(false); setEditItem(null); }}>
          <form onSubmit={saveAsset} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "span 2" }}><label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 4 }}>Asset Name *</label><input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} style={inp} /></div>
              <div><label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 4 }}>Category</label>
                <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} style={inp}>
                  <option value="">Select…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 4 }}>Status</label>
                <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))} style={inp}>
                  <option value="active">Active</option><option value="under_maintenance">Under Maintenance</option><option value="disposed">Disposed</option>
                </select>
              </div>
              <div><label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 4 }}>Purchase Value (BDT) *</label><input required type="number" min="0" value={form.purchaseValue} onChange={e => setForm(f => ({...f, purchaseValue: e.target.value}))} style={inp} /></div>
              <div><label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 4 }}>Current Value (BDT)</label><input type="number" min="0" value={form.currentValue} onChange={e => setForm(f => ({...f, currentValue: e.target.value}))} style={inp} /></div>
              <div><label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 4 }}>Purchase Date</label><input type="date" value={form.purchaseDate} onChange={e => setForm(f => ({...f, purchaseDate: e.target.value}))} style={inp} /></div>
              <div style={{ gridColumn: "span 2" }}><label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 4 }}>Description</label><textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} style={{ ...inp, resize: "vertical", minHeight: 60 }} /></div>
            </div>
            {msg && <div style={{ color: "#f87171", fontSize: 12 }}>{msg}</div>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => { setShowCreate(false); setEditItem(null); }} style={{ background: "#141428", border: "1px solid #1e1e38", color: "#94a3b8", borderRadius: 8, padding: "9px 16px", fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button type="submit" disabled={saving} style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                {saving ? "Saving…" : editItem ? "Save Changes" : "Add Asset"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
