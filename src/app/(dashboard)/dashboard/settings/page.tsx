import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SettingsClient from "@/components/dashboard/settings-client";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const params = await searchParams;
  const isNew = params.new === "true";

  // Get user's shops
  const shops = await prisma.shop.findMany({
    where: { ownerId: session.user.id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      phone: true,
      whatsappNumber: true,
      address: true,
      openingTime: true,
      closingTime: true,
      isActive: true,
    },
  });

  return (
    <SettingsClient
      userId={session.user.id}
      initialShops={shops}
      isNew={isNew && shops.length === 0}
    />
  );
}