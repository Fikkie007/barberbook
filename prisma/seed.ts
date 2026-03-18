import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const hashedPassword = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@barberbook.com" },
    update: {},
    create: {
      name: "Admin BarberBook",
      email: "admin@barberbook.com",
      phone: "081234567890",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("Created admin user:", admin.email);

  // Create demo shop owner
  const owner = await prisma.user.upsert({
    where: { email: "owner@demo.com" },
    update: {},
    create: {
      name: "Demo Owner",
      email: "owner@demo.com",
      phone: "081234567891",
      password: hashedPassword,
      role: "OWNER",
    },
  });

  console.log("Created owner user:", owner.email);

  // Create demo shop
  const shop = await prisma.shop.upsert({
    where: { slug: "demo-barbershop" },
    update: {},
    create: {
      name: "Demo Barbershop",
      slug: "demo-barbershop",
      description: "Barbershop modern dengan pelayanan terbaik",
      phone: "081234567892",
      whatsappNumber: "6281234567892",
      address: "Jl. Demo No. 123, Jakarta",
      logo: "/logo-placeholder.png",
      bannerImage: "/banner-placeholder.png",
      openingTime: "09:00",
      closingTime: "21:00",
      ownerId: owner.id,
    },
  });

  console.log("Created shop:", shop.name);

  // Create services
  const services = await Promise.all([
    prisma.service.upsert({
      where: { id: "service-haircut" },
      update: {},
      create: {
        id: "service-haircut",
        shopId: shop.id,
        name: "Potong Rambut",
        description: "Potong rambut dengan style modern",
        price: 35000,
        duration: 30,
        sortOrder: 1,
      },
    }),
    prisma.service.upsert({
      where: { id: "service-shave" },
      update: {},
      create: {
        id: "service-shave",
        shopId: shop.id,
        name: "Cukur Jenggot",
        description: "Cukur jenggot dan kumis",
        price: 25000,
        duration: 20,
        sortOrder: 2,
      },
    }),
    prisma.service.upsert({
      where: { id: "service-complete" },
      update: {},
      create: {
        id: "service-complete",
        shopId: shop.id,
        name: "Paket Lengkap",
        description: "Potong rambut + cukur jenggot + cuci rambut",
        price: 75000,
        duration: 60,
        sortOrder: 3,
      },
    }),
    prisma.service.upsert({
      where: { id: "service-haircolor" },
      update: {},
      create: {
        id: "service-haircolor",
        shopId: shop.id,
        name: "Cat Rambut",
        description: "Pewarnaan rambut dengan warna pilihan",
        price: 150000,
        duration: 90,
        sortOrder: 4,
      },
    }),
  ]);

  console.log("Created", services.length, "services");

  // Create barbers
  const barbers = await Promise.all([
    prisma.barber.upsert({
      where: { id: "barber-1" },
      update: {},
      create: {
        id: "barber-1",
        shopId: shop.id,
        name: "Ahmad",
        phone: "081234567893",
      },
    }),
    prisma.barber.upsert({
      where: { id: "barber-2" },
      update: {},
      create: {
        id: "barber-2",
        shopId: shop.id,
        name: "Budi",
        phone: "081234567894",
      },
    }),
    prisma.barber.upsert({
      where: { id: "barber-3" },
      update: {},
      create: {
        id: "barber-3",
        shopId: shop.id,
        name: "Chandra",
        phone: "081234567895",
      },
    }),
  ]);

  console.log("Created", barbers.length, "barbers");

  // Create working days
  const workingDays = await Promise.all(
    [0, 1, 2, 3, 4, 5, 6].map((day) =>
      prisma.workingDay.upsert({
        where: {
          shopId_dayOfWeek: {
            shopId: shop.id,
            dayOfWeek: day,
          },
        },
        update: {},
        create: {
          shopId: shop.id,
          dayOfWeek: day,
          isOpen: day !== 0, // Tutup hari Minggu
          openTime: day === 6 ? "10:00" : "09:00",
          closeTime: day === 6 ? "18:00" : "21:00",
        },
      })
    )
  );

  console.log("Created", workingDays.length, "working days");

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });