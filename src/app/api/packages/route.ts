import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get("shopId");

    if (!shopId) {
      return NextResponse.json({ error: "Shop ID required" }, { status: 400 });
    }

    const packages = await prisma.servicePackage.findMany({
      where: { shopId },
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

    return NextResponse.json({ packages });
  } catch (error) {
    console.error("Get packages error:", error);
    return NextResponse.json(
      { error: "Failed to fetch packages" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { shopId, name, description, price, duration, serviceIds } = body;

    // Verify shop belongs to user
    const shop = await prisma.shop.findFirst({
      where: { id: shopId, ownerId: session.user.id },
    });

    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    // Get max sort order
    const maxSort = await prisma.servicePackage.aggregate({
      where: { shopId },
      _max: { sortOrder: true },
    });

    // Create package with services
    const packageData = await prisma.servicePackage.create({
      data: {
        shopId,
        name,
        description: description || null,
        price: parseInt(price),
        duration: parseInt(duration) || 60,
        sortOrder: (maxSort._max.sortOrder || 0) + 1,
        services: {
          create: serviceIds.map((serviceId: string, index: number) => ({
            serviceId,
            sortOrder: index,
          })),
        },
      },
      include: {
        services: {
          include: {
            service: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, package: packageData });
  } catch (error) {
    console.error("Create package error:", error);
    return NextResponse.json(
      { error: "Failed to create package" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description, price, duration, serviceIds } = body;

    // Verify package belongs to user's shop
    const existingPackage = await prisma.servicePackage.findFirst({
      where: { id },
      include: { shop: true },
    });

    if (!existingPackage || existingPackage.shop.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    // Delete existing service relations and create new ones
    await prisma.packageService.deleteMany({
      where: { packageId: id },
    });

    const packageData = await prisma.servicePackage.update({
      where: { id },
      data: {
        name,
        description: description || null,
        price: parseInt(price),
        duration: parseInt(duration) || 60,
        services: {
          create: serviceIds.map((serviceId: string, index: number) => ({
            serviceId,
            sortOrder: index,
          })),
        },
      },
      include: {
        services: {
          include: {
            service: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, package: packageData });
  } catch (error) {
    console.error("Update package error:", error);
    return NextResponse.json(
      { error: "Failed to update package" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, isActive } = body;

    // Verify package belongs to user's shop
    const existingPackage = await prisma.servicePackage.findFirst({
      where: { id },
      include: { shop: true },
    });

    if (!existingPackage || existingPackage.shop.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    const packageData = await prisma.servicePackage.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json({ success: true, package: packageData });
  } catch (error) {
    console.error("Update package status error:", error);
    return NextResponse.json(
      { error: "Failed to update package status" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Package ID required" }, { status: 400 });
    }

    // Verify package belongs to user's shop
    const existingPackage = await prisma.servicePackage.findFirst({
      where: { id },
      include: { shop: true },
    });

    if (!existingPackage || existingPackage.shop.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    await prisma.servicePackage.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete package error:", error);
    return NextResponse.json(
      { error: "Failed to delete package" },
      { status: 500 }
    );
  }
}