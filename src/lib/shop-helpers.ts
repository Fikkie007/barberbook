import { prisma } from "@/lib/prisma";

/**
 * Get the shop IDs for a user based on their role
 * - ADMIN: all shops
 * - OWNER: shops they own
 * - CASHIER: shop they're assigned to
 */
export async function getUserShopIds(userId: string, role: string): Promise<string[]> {
  if (role === "CASHIER") {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { shopId: true },
    });
    return user?.shopId ? [user.shopId] : [];
  }

  if (role === "ADMIN") {
    // ADMIN can see all shops
    const shops = await prisma.shop.findMany({
      select: { id: true },
    });
    return shops.map((s) => s.id);
  }

  // OWNER sees shops they own
  const shops = await prisma.shop.findMany({
    where: { ownerId: userId },
    select: { id: true },
  });
  return shops.map((s) => s.id);
}

/**
 * Get the shops for a user based on their role
 * - ADMIN: all shops
 * - OWNER: shops they own
 * - CASHIER: shop they're assigned to
 */
export async function getUserShops(userId: string, role: string) {
  if (role === "CASHIER") {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        assignedShop: {
          select: { id: true, name: true, slug: true, logo: true },
        },
      },
    });
    return user?.assignedShop ? [user.assignedShop] : [];
  }

  if (role === "ADMIN") {
    // ADMIN can see all shops
    return prisma.shop.findMany({
      select: { id: true, name: true, slug: true, logo: true },
      orderBy: { name: "asc" },
    });
  }

  // OWNER sees shops they own
  return prisma.shop.findMany({
    where: { ownerId: userId },
    select: { id: true, name: true, slug: true, logo: true },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Get the active shop ID for a user
 * - ADMIN: can select any shop, defaults to first if none selected
 * - OWNER: must select a shop (returns null if none selected)
 * - CASHIER: always returns their assigned shop
 */
export async function getActiveShopId(
  userId: string,
  role: string,
  selectedShopId?: string | null
): Promise<string | null> {
  const shopIds = await getUserShopIds(userId, role);

  if (shopIds.length === 0) return null;

  // CASHIER always has one shop
  if (role === "CASHIER") {
    return shopIds[0];
  }

  // ADMIN can use first shop as default
  if (role === "ADMIN") {
    if (selectedShopId && shopIds.includes(selectedShopId)) {
      return selectedShopId;
    }
    return shopIds[0];
  }

  // OWNER must explicitly select a shop
  if (selectedShopId && shopIds.includes(selectedShopId)) {
    return selectedShopId;
  }

  // No shop selected for OWNER - return null to force selection
  return null;
}