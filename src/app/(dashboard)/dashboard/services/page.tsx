import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ServicesClient from "@/components/dashboard/services-client";
import PackagesClient from "@/components/dashboard/packages-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

  // Get user's shops
  const shops = await prisma.shop.findMany({
    where: { ownerId: session.user.id },
    select: { id: true, name: true },
  });

  if (shops.length === 0) {
    redirect("/dashboard");
  }

  const activeShopId = selectedShopId || shops[0].id;

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
        <PackagesClient shopId={activeShopId} initialPackages={packages} services={services} />
      </TabsContent>
    </Tabs>
  );
}