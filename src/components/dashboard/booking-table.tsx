"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Check, X, CheckCheck } from "lucide-react";

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
  service: { name: string };
  barber: { name: string } | null;
}

interface BookingTableProps {
  bookings: BookingWithRelations[];
  onStatusUpdate?: (id: string, status: string) => void;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-400",
  CONFIRMED: "bg-blue-500/10 text-blue-400",
  COMPLETED: "bg-green-500/10 text-green-400",
  CANCELLED: "bg-red-500/10 text-red-400",
};

const statusLabels: Record<string, string> = {
  PENDING: "Menunggu",
  CONFIRMED: "Dikonfirmasi",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

const sourceColors: Record<string, string> = {
  ONLINE: "bg-blue-500/10 text-blue-300",
  OFFLINE: "bg-green-500/10 text-green-300",
};

const sourceLabels: Record<string, string> = {
  ONLINE: "Online",
  OFFLINE: "Offline",
};

export default function BookingTable({ bookings, onStatusUpdate }: BookingTableProps) {
  const handleStatusUpdate = async (id: string, status: string) => {
    if (onStatusUpdate) {
      onStatusUpdate(id, status);
      return;
    }

    try {
      await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      window.location.reload();
    } catch (error) {
      console.error("Failed to update booking:", error);
    }
  };

  if (bookings.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400">
        Belum ada booking
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-slate-700 hover:bg-transparent">
          <TableHead className="text-slate-400">Pelanggan</TableHead>
          <TableHead className="text-slate-400">Layanan</TableHead>
          <TableHead className="text-slate-400">Barber</TableHead>
          <TableHead className="text-slate-400">Tanggal & Waktu</TableHead>
          <TableHead className="text-slate-400">Status</TableHead>
          <TableHead className="text-slate-400">Total</TableHead>
          <TableHead className="text-right text-slate-400">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((booking) => (
          <TableRow key={booking.id} className="border-slate-700">
            <TableCell>
              <div>
                <p className="font-medium text-white">{booking.customerName}</p>
                <p className="text-sm text-slate-400">{booking.customerPhone}</p>
              </div>
            </TableCell>
            <TableCell className="text-slate-300">{booking.service.name}</TableCell>
            <TableCell className="text-slate-300">
              {booking.barber?.name || "-"}
            </TableCell>
            <TableCell>
              <div>
                <p className="text-white">
                  {format(booking.bookingDate, "d MMM yyyy", { locale: id })}
                </p>
                <p className="text-sm text-slate-400">{booking.bookingTime}</p>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                <Badge className={statusColors[booking.status]}>
                  {statusLabels[booking.status]}
                </Badge>
                <Badge className={sourceColors[booking.source] || "bg-slate-500/10 text-slate-300"}>
                  {sourceLabels[booking.source] || booking.source}
                </Badge>
              </div>
            </TableCell>
            <TableCell className="text-white">
              {booking.tipAmount > 0 ? (
                <div>
                  <p>Rp {booking.totalPrice.toLocaleString("id-ID")}</p>
                  <p className="text-xs text-slate-400">
                    (+ Rp {booking.tipAmount.toLocaleString("id-ID")} tip)
                  </p>
                </div>
              ) : (
                <p>Rp {booking.totalPrice.toLocaleString("id-ID")}</p>
              )}
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button variant="ghost" size="icon" className="text-slate-400" />}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="border-slate-700 bg-slate-800">
                  {booking.status === "PENDING" && (
                    <DropdownMenuItem
                      className="text-slate-300 focus:bg-slate-700"
                      onClick={() => handleStatusUpdate(booking.id, "CONFIRMED")}
                    >
                      <Check className="mr-2 h-4 w-4 text-blue-400" />
                      Konfirmasi
                    </DropdownMenuItem>
                  )}
                  {(booking.status === "PENDING" || booking.status === "CONFIRMED") && (
                    <>
                      <DropdownMenuItem
                        className="text-slate-300 focus:bg-slate-700"
                        onClick={() => handleStatusUpdate(booking.id, "COMPLETED")}
                      >
                        <CheckCheck className="mr-2 h-4 w-4 text-green-400" />
                        Selesai
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-slate-300 focus:bg-slate-700"
                        onClick={() => handleStatusUpdate(booking.id, "CANCELLED")}
                      >
                        <X className="mr-2 h-4 w-4 text-red-400" />
                        Batalkan
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}