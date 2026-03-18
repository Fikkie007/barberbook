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

    const barbers = await prisma.barber.findMany({
      where: { shopId },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ barbers });
  } catch (error) {
    console.error("Get barbers error:", error);
    return NextResponse.json(
      { error: "Failed to fetch barbers" },
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
    const { shopId, name, phone } = body;

    // Verify shop belongs to user
    const shop = await prisma.shop.findFirst({
      where: { id: shopId, ownerId: session.user.id },
    });

    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const barber = await prisma.barber.create({
      data: {
        shopId,
        name,
        phone: phone || null,
      },
    });

    return NextResponse.json({ success: true, barber });
  } catch (error) {
    console.error("Create barber error:", error);
    return NextResponse.json(
      { error: "Failed to create barber" },
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
    const { id, name, phone } = body;

    // Verify barber belongs to user's shop
    const existingBarber = await prisma.barber.findFirst({
      where: { id },
      include: { shop: true },
    });

    if (!existingBarber || existingBarber.shop.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Barber not found" }, { status: 404 });
    }

    const barber = await prisma.barber.update({
      where: { id },
      data: {
        name,
        phone: phone || null,
      },
    });

    return NextResponse.json({ success: true, barber });
  } catch (error) {
    console.error("Update barber error:", error);
    return NextResponse.json(
      { error: "Failed to update barber" },
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

    // Verify barber belongs to user's shop
    const existingBarber = await prisma.barber.findFirst({
      where: { id },
      include: { shop: true },
    });

    if (!existingBarber || existingBarber.shop.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Barber not found" }, { status: 404 });
    }

    const barber = await prisma.barber.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json({ success: true, barber });
  } catch (error) {
    console.error("Update barber error:", error);
    return NextResponse.json(
      { error: "Failed to update barber" },
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
      return NextResponse.json({ error: "Barber ID required" }, { status: 400 });
    }

    // Verify barber belongs to user's shop
    const existingBarber = await prisma.barber.findFirst({
      where: { id },
      include: { shop: true },
    });

    if (!existingBarber || existingBarber.shop.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Barber not found" }, { status: 404 });
    }

    await prisma.barber.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete barber error:", error);
    return NextResponse.json(
      { error: "Failed to delete barber" },
      { status: 500 }
    );
  }
}