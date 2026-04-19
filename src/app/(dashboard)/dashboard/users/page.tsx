import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdminOrOwner } from "@/lib/rbac";
import UsersClient from "@/components/dashboard/users-client";
import { getUserShops, getActiveShopId } from "@/lib/shop-helpers";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ shop?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  if (!isAdminOrOwner(session.user.role)) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const selectedShopId = params.shop;

  // Get user's shops based on role
  const shops = await getUserShops(session.user.id, session.user.role);

  // Get active shop ID
  const activeShopId = await getActiveShopId(
    session.user.id,
    session.user.role,
    selectedShopId
  );

  // OWNER must select a shop first
  if (!activeShopId) {
    if (session.user.role === "OWNER" && shops.length > 0) {
      return (
        <div className="flex h-[calc(100vh-8rem)] flex-col items-center justify-center text-center">
          <h2 className="text-2xl font-bold text-white">Pilih Toko</h2>
          <p className="mt-2 text-slate-400">
            Silakan pilih toko dari sidebar untuk melihat pengguna.
          </p>
        </div>
      );
    }
    redirect("/dashboard");
  }

  // Get users for the selected shop:
  // 1. CASHIER users assigned to this shop
  // 2. OWNER users who own this shop
  const [cashiers, owner] = await Promise.all([
    // CASHIER users assigned to this shop
    prisma.user.findMany({
      where: {
        isActive: true,
        shopId: activeShopId,
        role: "CASHIER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        shopId: true,
        assignedShop: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        shops: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    // Get the owner of this shop
    prisma.shop.findUnique({
      where: { id: activeShopId },
      select: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
            createdAt: true,
            shopId: true,
            assignedShop: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            shops: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    }),
  ]);

  // Combine users: owner + cashiers
  const users = owner?.owner ? [owner.owner, ...cashiers] : cashiers;

  return (
    <UsersClient
      initialUsers={users.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
      }))}
      shops={shops}
      activeShopId={activeShopId}
    />
  );
}