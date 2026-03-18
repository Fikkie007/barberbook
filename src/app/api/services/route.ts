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

    const services = await prisma.service.findMany({
      where: { shopId },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ services });
  } catch (error) {
    console.error("Get services error:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
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
    const { shopId, name, description, price, duration } = body;

    // Verify shop belongs to user
    const shop = await prisma.shop.findFirst({
      where: { id: shopId, ownerId: session.user.id },
    });

    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    // Get max sort order
    const maxSort = await prisma.service.aggregate({
      where: { shopId },
      _max: { sortOrder: true },
    });

    const service = await prisma.service.create({
      data: {
        shopId,
        name,
        description: description || null,
        price: parseInt(price),
        duration: parseInt(duration) || 30,
        sortOrder: (maxSort._max.sortOrder || 0) + 1,
      },
    });

    return NextResponse.json({ success: true, service });
  } catch (error) {
    console.error("Create service error:", error);
    return NextResponse.json(
      { error: "Failed to create service" },
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
    const { id, name, description, price, duration } = body;

    // Verify service belongs to user's shop
    const existingService = await prisma.service.findFirst({
      where: { id },
      include: { shop: true },
    });

    if (!existingService || existingService.shop.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const service = await prisma.service.update({
      where: { id },
      data: {
        name,
        description: description || null,
        price: parseInt(price),
        duration: parseInt(duration) || 30,
      },
    });

    return NextResponse.json({ success: true, service });
  } catch (error) {
    console.error("Update service error:", error);
    return NextResponse.json(
      { error: "Failed to update service" },
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

    // Verify service belongs to user's shop
    const existingService = await prisma.service.findFirst({
      where: { id },
      include: { shop: true },
    });

    if (!existingService || existingService.shop.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const service = await prisma.service.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json({ success: true, service });
  } catch (error) {
    console.error("Update service error:", error);
    return NextResponse.json(
      { error: "Failed to update service" },
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
      return NextResponse.json({ error: "Service ID required" }, { status: 400 });
    }

    // Verify service belongs to user's shop
    const existingService = await prisma.service.findFirst({
      where: { id },
      include: { shop: true },
    });

    if (!existingService || existingService.shop.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    await prisma.service.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete service error:", error);
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 }
    );
  }
}