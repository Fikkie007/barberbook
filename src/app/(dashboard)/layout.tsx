import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/sidebar";
import { getUserShops } from "@/lib/shop-helpers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Get shops based on role using centralized helper
  const shops = await getUserShops(session.user.id, session.user.role);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Sidebar
        user={{
          name: session.user.name || "User",
          email: session.user.email || "",
          role: session.user.role,
        }}
        shops={shops}
      />
      <main className="lg:pl-64">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}