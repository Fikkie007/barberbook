import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shops = await prisma.shop.findMany({
      where: { ownerId: session.user.id },
      include: {
        _count: { select: { bookings: true, services: true, barbers: true } },
      },
    });

    return NextResponse.json({ shops });
  } catch (error) {
    console.error("Get shops error:", error);
    return NextResponse.json(
      { error: "Failed to fetch shops" },
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
    const {
      name,
      slug,
      description,
      phone,
      whatsappNumber,
      address,
      openingTime,
      closingTime,
    } = body;

    // Check if slug is already taken
    const existingShop = await prisma.shop.findUnique({
      where: { slug },
    });

    if (existingShop) {
      return NextResponse.json(
        { error: "Slug sudah digunakan. Pilih nama lain." },
        { status: 400 }
      );
    }

    // Create shop
    const shop = await prisma.shop.create({
      data: {
        name,
        slug,
        description: description || null,
        phone,
        whatsappNumber,
        address,
        openingTime: openingTime || "09:00",
        closingTime: closingTime || "21:00",
        ownerId: session.user.id,
      },
    });

    // Create default working days
    await Promise.all(
      [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) =>
        prisma.workingDay.create({
          data: {
            shopId: shop.id,
            dayOfWeek,
            isOpen: dayOfWeek !== 0, // Tutup Minggu
            openTime: dayOfWeek === 6 ? "10:00" : "09:00",
            closeTime: dayOfWeek === 6 ? "18:00" : "21:00",
          },
        })
      )
    );

    return NextResponse.json({ success: true, shop });
  } catch (error) {
    console.error("Create shop error:", error);
    return NextResponse.json(
      { error: "Failed to create shop" },
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
    const {
      id,
      name,
      slug,
      description,
      phone,
      whatsappNumber,
      address,
      openingTime,
      closingTime,
    } = body;

    // Verify shop belongs to user
    const existingShop = await prisma.shop.findFirst({
      where: { id, ownerId: session.user.id },
    });

    if (!existingShop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    // Check if new slug is already taken by another shop
    if (slug !== existingShop.slug) {
      const slugExists = await prisma.shop.findUnique({
        where: { slug },
      });
      if (slugExists) {
        return NextResponse.json(
          { error: "Slug sudah digunakan. Pilih nama lain." },
          { status: 400 }
        );
      }
    }

    const shop = await prisma.shop.update({
      where: { id },
      data: {
        name,
        slug,
        description: description || null,
        phone,
        whatsappNumber,
        address,
        openingTime,
        closingTime,
      },
    });

    return NextResponse.json({ success: true, shop });
  } catch (error) {
    console.error("Update shop error:", error);
    return NextResponse.json(
      { error: "Failed to update shop" },
      { status: 500 }
    );
  }
}