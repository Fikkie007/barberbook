import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BarbersClient from "@/components/dashboard/barbers-client";

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
  const shops = await prisma.shop.findMany({
    where: { ownerId: session.user.id },
    select: { id: true, name: true },
  });

  if (shops.length === 0) {
    redirect("/dashboard");
  }

  const activeShopId = selectedShopId || shops[0].id;

  // Get barbers
  const barbers = await prisma.barber.findMany({
    where: { shopId: activeShopId },
    orderBy: { name: "asc" },
  });

  return <BarbersClient shopId={activeShopId} initialBarbers={barbers} />;
}