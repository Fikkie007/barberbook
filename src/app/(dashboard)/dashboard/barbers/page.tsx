import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BarbersClient from "@/components/dashboard/barbers-client";
import { getActiveShopId, getUserShops } from "@/lib/shop-helpers";

export default async function BarbersPage({
  searchParams,
}: {
  searchParams: Promise<{ shop?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const params = await searchParams;
  const selectedShopId = params.shop;

  // Get user's shops
  const shops = await getUserShops(session.user.id, session.user.role);

  if (shops.length === 0) {
    redirect("/dashboard");
  }

  // Get active shop ID
  const activeShopId = await getActiveShopId(
    session.user.id,
    session.user.role,
    selectedShopId,
  );

  // OWNER must select a shop first
  if (!activeShopId) {
    if (session.user.role === "OWNER" && shops.length > 0) {
      return (
        <div className="flex h-[calc(100vh-8rem)] flex-col items-center justify-center text-center">
          <h2 className="text-2xl font-bold text-white">Pilih Toko</h2>
          <p className="mt-2 text-slate-400">
            Silakan pilih toko dari sidebar untuk melihat analytics.
          </p>
        </div>
      );
    }
    redirect("/dashboard");
  }

  // Get barbers
  const barbers = await prisma.barber.findMany({
    where: { shopId: activeShopId },
    orderBy: { name: "asc" },
  });

  return <BarbersClient shopId={activeShopId} initialBarbers={barbers} />;
}
