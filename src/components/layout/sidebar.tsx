
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartLine, faUsers, faLayerGroup, faChartPie,
  faBuilding, faShare, faWallet, faPeopleGroup,
  faVoteYea, faTriangleExclamation, faArrowTrendUp,
  faSignOutAlt, faGear, faChevronRight,
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
    </div>
  );
}
