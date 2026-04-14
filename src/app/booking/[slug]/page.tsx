import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import BookingForm from "@/components/booking/booking-form";

interface BookingPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BookingPageProps) {
  const { slug } = await params;
  const shop = await prisma.shop.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });

  if (!shop) {
    return { title: "Toko tidak ditemukan" };
  }

  return {
    title: `Booking - ${shop.name} | BarberBook`,
    description: shop.description || `Booking online di ${shop.name}`,
  };
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { slug } = await params;

  const shop = await prisma.shop.findUnique({
    where: { slug, isActive: true },
    include: {
      services: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
      packages: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          services: {
            orderBy: { sortOrder: "asc" },
            include: {
              service: true,
            },
          },
        },
      },
      barbers: {
        where: { isActive: true },
      },
      workingDays: true,
    },
  });

  if (!shop) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-slate-800/50">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent" />
        <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            {shop.logo && (
              <div className="mx-auto mb-6 h-20 w-20 overflow-hidden rounded-full bg-amber-500">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={shop.logo}
                  alt={shop.name}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {shop.name}
            </h1>
            {shop.description && (
              <p className="mt-3 text-lg text-slate-300">{shop.description}</p>
            )}
            <div className="mt-4 flex items-center justify-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {shop.openingTime} - {shop.closingTime}
              </span>
              <span className="flex items-center gap-1">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {shop.address}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Form */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <BookingForm
          shop={{
            id: shop.id,
            name: shop.name,
            phone: shop.phone,
            whatsappNumber: shop.whatsappNumber,
            openingTime: shop.openingTime,
            closingTime: shop.closingTime,
            services: shop.services.map((s) => ({
              id: s.id,
              name: s.name,
              description: s.description,
              price: s.price,
              duration: s.duration,
            })),
            packages: shop.packages.map((p) => ({
              id: p.id,
              name: p.name,
              description: p.description,
              price: p.price,
              duration: p.duration,
              services: p.services.map((ps) => ({
                id: ps.id,
                serviceId: ps.serviceId,
                sortOrder: ps.sortOrder,
                service: {
                  id: ps.service.id,
                  name: ps.service.name,
                  price: ps.service.price,
                  duration: ps.service.duration,
                },
              })),
            })),
            barbers: shop.barbers.map((b) => ({
              id: b.id,
              name: b.name,
            })),
            workingDays: shop.workingDays.map((w) => ({
              dayOfWeek: w.dayOfWeek,
              isOpen: w.isOpen,
              openTime: w.openTime,
              closeTime: w.closeTime,
            })),
          }}
        />
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-slate-800/30 py-6">
        <div className="mx-auto max-w-4xl px-4 text-center text-sm text-slate-400">
          <p>Powered by BarberBook - Platform Booking Barbershop</p>
        </div>
      </footer>
    </div>
  );
}
