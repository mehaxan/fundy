import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import Sidebar from "@/components/layout/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role={session.role} email={session.email} />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
