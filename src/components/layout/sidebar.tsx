"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "▦" },
  { href: "/funds", label: "Funds", icon: "◈" },
  { href: "/investments", label: "Investments", icon: "◎" },
  { href: "/wallet", label: "Wallet", icon: "◉" },
];

const ADMIN_NAV = [
  { href: "/admin/users", label: "Users", icon: "⊕" },
  { href: "/admin/wallet", label: "Wallet Mgmt", icon: "⊗" },
];

interface Props {
  role: string;
  email: string;
}

export default function Sidebar({ role, email }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const isAdmin = role === "admin" || role === "manager";

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
      <div className="px-5 py-4 border-b border-gray-100">
        <span className="text-lg font-bold text-blue-600">Fundy</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                active ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="pt-4 pb-1 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Admin
            </div>
            {ADMIN_NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                    active ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="px-4 py-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 truncate mb-2">{email}</p>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          Sign out →
        </button>
      </div>
    </aside>
  );
}
