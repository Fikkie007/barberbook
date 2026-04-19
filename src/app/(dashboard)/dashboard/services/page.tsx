import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ServicesClient from "@/components/dashboard/services-client";
import PackagesClient from "@/components/dashboard/packages-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUserShops, getActiveShopId } from "@/lib/shop-helpers";

export default async function ServicesPage({
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

  // Get user's shops based on role
  const shops = await getUserShops(session.user.id, session.user.role);

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
            Silakan pilih toko dari sidebar untuk melihat layanan.
          </p>
        </div>
      );
    }
    redirect("/dashboard");
  }

  // Get services
  const services = await prisma.service.findMany({
    where: { shopId: activeShopId },
    orderBy: { sortOrder: "asc" },
  });

  // Get packages with their services
  const packages = await prisma.servicePackage.findMany({
    where: { shopId: activeShopId },
    orderBy: { sortOrder: "asc" },
    include: {
      services: {
        orderBy: { sortOrder: "asc" },
        include: {
          service: true,
        },
      },
    },
  });

  return (
    <Tabs defaultValue="services" className="space-y-6">
      <TabsList className="bg-transparent border-none p-0 gap-2">
        <TabsTrigger
          value="services"
          className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900 text-slate-400 hover:text-slate-200 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Layanan
        </TabsTrigger>
        <TabsTrigger
          value="packages"
          className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900 text-slate-400 hover:text-slate-200 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Paket
        </TabsTrigger>
      </TabsList>
      <TabsContent value="services">
        <ServicesClient shopId={activeShopId} initialServices={services} />
      </TabsContent>
      <TabsContent value="packages">
        <PackagesClient
          shopId={activeShopId}
          initialPackages={packages}
          services={services}
        />
      </TabsContent>
    </Tabs>
  );
}
