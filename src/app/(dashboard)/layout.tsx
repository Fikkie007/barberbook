import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/layout/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  // Get shops based on role
  let shops: Array<{
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  }> = [];

  if (session.user.role === "CASHIER") {
    // CASHIER sees their assigned shop only
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        shopId: true,
        assignedShop: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
      },
    });

    if (user?.assignedShop) {
      shops = [user.assignedShop];
    }
  } else {
    // ADMIN and OWNER see shops they own
    shops = await prisma.shop.findMany({
      where: { ownerId: session.user.id },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
      },
    });
  }

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