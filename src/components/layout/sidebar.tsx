
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartLine, faUsers, faLayerGroup, faChartPie,
  faBuilding, faShare, faWallet, faPeopleGroup,
  faVoteYea, faTriangleExclamation, faArrowTrendUp,
  faSignOutAlt, faGear, faChevronRight, faKey,
} from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

const S = {
  sidebar: {
    width: 240, minHeight: "100vh", background: "#08080f",
    borderRight: "1px solid #1e1e38", display: "flex",
    flexDirection: "column" as const, position: "fixed" as const,
    top: 0, left: 0, zIndex: 50,
  },
  logo: {
    padding: "20px 20px 16px", display: "flex", alignItems: "center", gap: 10,
    borderBottom: "1px solid #1e1e38",
  },
  logoIcon: {
    width: 36, height: 36, borderRadius: 10, display: "flex",
    alignItems: "center", justifyContent: "center",
    background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
    boxShadow: "0 0 12px rgba(124,58,237,0.3)",
  },
  logoText: { fontSize: 18, fontWeight: 700, color: "#f1f5f9", letterSpacing: -0.3 },
  nav: { flex: 1, padding: "12px 10px", overflowY: "auto" as const },
  section: { marginBottom: 8 },
  sectionLabel: {
    fontSize: 10, fontWeight: 700, color: "#334155", letterSpacing: 1.2,
    textTransform: "uppercase" as const, padding: "8px 10px 4px",
  },
  navItem: (active: boolean) => ({
    display: "flex", alignItems: "center", gap: 10, padding: "9px 10px",
    borderRadius: 8, cursor: "pointer", textDecoration: "none",
    color: active ? "#f1f5f9" : "#64748b",
    background: active ? "#1a1a35" : "transparent",
    fontSize: 13, fontWeight: active ? 600 : 400,
    transition: "all 0.15s",
    borderLeft: active ? "2px solid #7c3aed" : "2px solid transparent",
    marginBottom: 1,
  }),
  navIcon: (active: boolean) => ({
    width: 16, textAlign: "center" as const,
    color: active ? "#7c3aed" : "#475569",
  }),
  footer: {
    padding: "12px 10px", borderTop: "1px solid #1e1e38",
  },
  userCard: {
    display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
    borderRadius: 8, background: "#0e0e1c", cursor: "pointer",
    marginBottom: 8, border: "1px solid #1e1e38",
  },
  avatar: {
    width: 30, height: 30, borderRadius: "50%", background: "#2e1065",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 12, fontWeight: 700, color: "#7c3aed", flexShrink: 0,
  },
};

interface NavItemProps {
  href: string;
  icon: typeof faChartLine;
  label: string;
  active: boolean;
}

function NavItem({ href, icon, label, active }: NavItemProps) {
  return (
    <Link href={href} style={S.navItem(active)}>
      <span style={S.navIcon(active)}>
        <FontAwesomeIcon icon={icon} style={{ fontSize: 13 }} />
      </span>
      {label}
      {active && (
        <FontAwesomeIcon icon={faChevronRight} style={{ marginLeft: "auto", fontSize: 10, color: "#7c3aed" }} />
      )}
    </Link>
  );
}

interface SidebarProps {
  userName: string;
  userRole: string;
  userEmail: string;
}

export default function Sidebar({ userName, userRole, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState("");
  const [pwOk, setPwOk] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) { setPwMsg("Passwords do not match"); return; }
    if (pwForm.next.length < 8) { setPwMsg("New password must be at least 8 characters"); return; }
    setPwSaving(true); setPwMsg("");
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
    });
    if (res.ok) {
      setPwOk(true); setPwMsg("Password changed successfully!");
      setTimeout(() => { setShowChangePw(false); setPwForm({ current: "", next: "", confirm: "" }); setPwMsg(""); setPwOk(false); }, 1500);
    } else {
      const j = await res.json();
      setPwMsg(j.error ?? "Failed to change password");
    }
    setPwSaving(false);
  }

  const isAdmin = userRole === "admin";

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const initials = (userName || "?").split(" ").map(n => n?.[0] ?? "").join("").toUpperCase().slice(0, 2) || "?";

  return (
    <div style={S.sidebar}>
      <div style={S.logo}>
        <div style={S.logoIcon}>
          <FontAwesomeIcon icon={faChartLine} style={{ fontSize: 16, color: "#fff" }} />
        </div>
        <span style={S.logoText}>Fundy</span>
      </div>

      <nav style={S.nav}>
        <NavItem href="/dashboard" icon={faChartPie} label="Dashboard" active={pathname === "/dashboard"} />
        <NavItem href="/funds" icon={faLayerGroup} label="Funds" active={pathname.startsWith("/funds")} />
        <NavItem href="/shares" icon={faShare} label="Shares" active={pathname.startsWith("/shares")} />
        <NavItem href="/investments" icon={faChartLine} label="Investments" active={pathname.startsWith("/investments")} />
        <NavItem href="/assets" icon={faBuilding} label="Assets" active={pathname.startsWith("/assets")} />
        <NavItem href="/wallet" icon={faWallet} label="Wallet" active={pathname.startsWith("/wallet")} />
        <NavItem href="/meetings" icon={faPeopleGroup} label="Meetings" active={pathname.startsWith("/meetings")} />
        <NavItem href="/votes" icon={faVoteYea} label="Votes" active={pathname.startsWith("/votes")} />
        <NavItem href="/fines" icon={faTriangleExclamation} label="Fines" active={pathname.startsWith("/fines")} />
        <NavItem href="/projections" icon={faArrowTrendUp} label="Projections" active={pathname.startsWith("/projections")} />

        {isAdmin && (
          <>
            <div style={S.sectionLabel}>Admin</div>
            <NavItem href="/members" icon={faUsers} label="Members" active={pathname.startsWith("/members")} />
          </>
        )}
      </nav>

      <div style={S.footer}>
        <div style={S.userCard}>
          <div style={S.avatar}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName}</div>
            <div style={{ fontSize: 10, color: "#475569", textTransform: "capitalize" }}>{userRole}</div>
          </div>
        </div>
        <button
          onClick={() => { setShowChangePw(true); setPwMsg(""); setPwOk(false); setPwForm({ current: "", next: "", confirm: "" }); }}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 8,
            padding: "8px 10px", borderRadius: 8, border: "none",
            background: "transparent", color: "#475569", cursor: "pointer",
            fontSize: 13, transition: "all 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "#f1f5f9")}
          onMouseLeave={e => (e.currentTarget.style.color = "#475569")}
        >
          <FontAwesomeIcon icon={faKey} style={{ fontSize: 12 }} />
          Change Password
        </button>
        <button
          onClick={logout}
          disabled={loggingOut}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 8,
            padding: "8px 10px", borderRadius: 8, border: "none",
            background: "transparent", color: "#475569", cursor: "pointer",
            fontSize: 13, transition: "all 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
          onMouseLeave={e => (e.currentTarget.style.color = "#475569")}
        >
          <FontAwesomeIcon icon={faSignOutAlt} style={{ fontSize: 13 }} />
          {loggingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>

      {showChangePw && (
        <div
          onClick={e => e.target === e.currentTarget && setShowChangePw(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}
        >
          <div style={{
            background: "#0e0e1c", border: "1px solid #1e1e38", borderRadius: 16,
            padding: 28, width: "100%", maxWidth: 400,
            maxHeight: "85vh", overflowY: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#f1f5f9" }}>Change Password</h2>
              <button onClick={() => setShowChangePw(false)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 20 }}>✕</button>
            </div>
            <form onSubmit={changePassword} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {(["current", "next", "confirm"] as const).map((field, i) => (
                <div key={field}>
                  <label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, display: "block", marginBottom: 4 }}>
                    {["Current Password", "New Password", "Confirm New Password"][i]}
                  </label>
                  <input
                    required
                    type="password"
                    value={pwForm[field]}
                    onChange={e => setPwForm(f => ({ ...f, [field]: e.target.value }))}
                    style={{ background: "#141428", border: "1px solid #1e1e38", borderRadius: 8, padding: "9px 12px", color: "#f1f5f9", fontSize: 13, width: "100%", boxSizing: "border-box" }}
                  />
                </div>
              ))}
              {pwMsg && (
                <div style={{ color: pwOk ? "#10b981" : "#f87171", fontSize: 12 }}>{pwMsg}</div>
              )}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowChangePw(false)} style={{ background: "#141428", border: "1px solid #1e1e38", color: "#94a3b8", borderRadius: 8, padding: "9px 16px", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                <button type="submit" disabled={pwSaving} style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  {pwSaving ? "Saving…" : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
