import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import Sidebar from "@/components/layout/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#08080f" }}>
      <Sidebar userName={session.name} userRole={session.role} userEmail={session.email} />
      <main style={{ flex: 1, marginLeft: 240, padding: "28px 32px", minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}
