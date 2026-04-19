import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminOrOwner } from "@/lib/rbac";
import { getUserShopIds } from "@/lib/shop-helpers";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isAdminOrOwner(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ADMIN sees all users; OWNER sees users from their shops only
    const accessibleShopIds = await getUserShopIds(
      session.user.id,
      session.user.role
    );

    // Build the where clause based on role
    const whereClause =
      session.user.role === "ADMIN"
        ? { isActive: true } // ADMIN sees all active users
        : {
            // OWNER sees only users related to their accessible shops
            isActive: true,
            OR: [
              // CASHIER users assigned to accessible shops
              {
                role: "CASHIER" as const,
                shopId: { in: accessibleShopIds },
              },
              // OWNER users who own accessible shops
              {
                role: "OWNER" as const,
                shops: { some: { id: { in: accessibleShopIds } } },
              },
            ],
          };

    const users = await prisma.user.findMany({
      where: whereClause,
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
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data pengguna" },
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

    if (!isAdminOrOwner(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, phone, password, role, shopId } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Nama, email, password, dan role wajib diisi" },
        { status: 400 }
      );
    }

    if (!["ADMIN", "OWNER", "CASHIER"].includes(role)) {
      return NextResponse.json(
        { error: "Role harus ADMIN, OWNER, atau CASHIER" },
        { status: 400 }
      );
    }

    // CASHIER must have shopId
    if (role === "CASHIER" && !shopId) {
      return NextResponse.json(
        { error: "CASHIER harus ditugaskan ke toko" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        password: hashedPassword,
        role,
        shopId: role === "CASHIER" ? shopId : null,
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
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Gagal membuat pengguna" },
      { status: 500 }
    );
  }
}