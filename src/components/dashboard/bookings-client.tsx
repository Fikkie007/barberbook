"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import BookingTable from "@/components/dashboard/booking-table";
import OfflineBookingDialog from "@/components/dashboard/offline-booking-dialog";

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface PackageServiceItem {
  id: string;
  serviceId: string;
  sortOrder: number;
  service: Service;
}

interface ServicePackage {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  services: PackageServiceItem[];
}

interface Barber {
  id: string;
  name: string;
}

interface WorkingDay {
  dayOfWeek: number;
  isOpen: boolean;
}

interface BookingWithRelations {
  id: string;
  customerName: string;
  customerPhone: string;
  bookingDate: Date;
  bookingTime: string;
  status: string;
  source: string;
  totalPrice: number;
  servicePrice: number;
  tipAmount: number;
  service: { name: string } | null;
  package: { name: string; services: { service: { name: string } }[] } | null;
  barber: { name: string } | null;
}

interface BookingsClientProps {
  shopId: string;
  initialBookings: BookingWithRelations[];
  services: Service[];
  packages: ServicePackage[];
  barbers: Barber[];
  workingDays: WorkingDay[];
  shopHours: {
    openingTime: string;
    closingTime: string;
  };
  selectedStatus?: string;
}

export default function BookingsClient({
  shopId,
  initialBookings,
  services,
  packages,
  barbers,
  workingDays,
  shopHours,
  selectedStatus,
}: BookingsClientProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bookings, setBookings] = useState<BookingWithRelations[]>(initialBookings);

  // Compute status counts from current bookings state
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      PENDING: 0,
      CONFIRMED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    for (const booking of bookings) {
      counts[booking.status] = (counts[booking.status] || 0) + 1;
    }
    return counts;
  }, [bookings]);

  const handleBookingSuccess = async () => {
    // Refresh bookings list
    try {
      const params = new URLSearchParams();
      params.set("shopId", shopId); // Fixed: was "shop", should be "shopId"
      if (selectedStatus) {
        params.set("status", selectedStatus);
      }

      const response = await fetch(`/api/bookings?${params.toString()}`);
      const data = await response.json();

      if (response.ok && data.bookings) {
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error("Failed to refresh bookings:", error);
      // Fallback: reload page
      window.location.reload();
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        // Update local state
        setBookings(
          bookings.map((b) => (b.id === id ? { ...b, status } : b))
        );
      }
    } catch (error) {
      console.error("Failed to update booking:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Kelola Booking</h1>
        <Button
          className="bg-amber-500 text-slate-900 hover:bg-amber-400"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Booking Offline
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <a
          href="/dashboard/bookings"
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            !selectedStatus
              ? "bg-amber-500 text-slate-900"
              : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Semua ({bookings.length})
        </a>
        <a
          href="/dashboard/bookings?status=PENDING"
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            selectedStatus === "PENDING"
              ? "bg-yellow-500 text-slate-900"
              : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Menunggu ({statusCounts.PENDING || 0})
        </a>
        <a
          href="/dashboard/bookings?status=CONFIRMED"
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            selectedStatus === "CONFIRMED"
              ? "bg-blue-500 text-slate-900"
              : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Dikonfirmasi ({statusCounts.CONFIRMED || 0})
        </a>
        <a
          href="/dashboard/bookings?status=COMPLETED"
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            selectedStatus === "COMPLETED"
              ? "bg-green-500 text-slate-900"
              : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Selesai ({statusCounts.COMPLETED || 0})
        </a>
        <a
          href="/dashboard/bookings?status=CANCELLED"
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            selectedStatus === "CANCELLED"
              ? "bg-red-500 text-slate-900"
              : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
          }`}
        >
          Dibatalkan ({statusCounts.CANCELLED || 0})
        </a>
      </div>

      {/* Bookings Table */}
      <div className="rounded-lg border border-slate-700 bg-slate-800/50">
        <BookingTable bookings={bookings} onStatusUpdate={handleStatusUpdate} />
      </div>

      {/* Offline Booking Dialog */}
      <OfflineBookingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        shopId={shopId}
        services={services}
        packages={packages}
        barbers={barbers}
        workingDays={workingDays}
        shopHours={shopHours}
        onSuccess={handleBookingSuccess}
      />
    </div>
  );
}