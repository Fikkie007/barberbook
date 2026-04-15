"use client";

import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { CustomerFrequency } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChartEmptyState } from "./chart-utils";

interface TopCustomersTableProps {
  data: CustomerFrequency[];
}

export default function TopCustomersTable({ data }: TopCustomersTableProps) {
  if (data.length === 0) {
    return <ChartEmptyState message="Belum ada data pelanggan" height={64} />;
  }

  const topCustomers = data.slice(0, 10);

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-slate-700 hover:bg-transparent">
          <TableHead className="text-slate-400">Pelanggan</TableHead>
          <TableHead className="text-slate-400">No. HP</TableHead>
          <TableHead className="text-slate-400">Jumlah Booking</TableHead>
          <TableHead className="text-slate-400">Total Belanja</TableHead>
          <TableHead className="text-slate-400">Booking Pertama</TableHead>
          <TableHead className="text-slate-400">Booking Terakhir</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {topCustomers.map((customer, index) => (
          <TableRow key={`${customer.customerPhone}-${index}`} className="border-slate-700">
            <TableCell>
              <div className="flex items-center gap-2">
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  index === 0 ? "bg-amber-500 text-slate-900" :
                  index === 1 ? "bg-slate-400 text-slate-900" :
                  index === 2 ? "bg-slate-600 text-white" :
                  "bg-slate-700/50 text-slate-300"
                }`}>
                  {index + 1}
                </span>
                <span className="text-white">{customer.customerName}</span>
              </div>
            </TableCell>
            <TableCell className="text-slate-300">{customer.customerPhone}</TableCell>
            <TableCell className="text-white">
              <span className={`rounded-full px-2 py-1 text-xs ${
                customer.bookingCount === 1 ? "bg-green-500/10 text-green-400" :
                customer.bookingCount === 2 ? "bg-blue-500/10 text-blue-400" :
                customer.bookingCount >= 3 ? "bg-purple-500/10 text-purple-400" :
                ""
              }`}>
                {customer.bookingCount}x
              </span>
            </TableCell>
            <TableCell className="text-amber-400 font-medium">
              Rp {customer.totalSpent.toLocaleString("id-ID")}
            </TableCell>
            <TableCell className="text-slate-300">
              {format(parseISO(customer.firstBooking), "d MMM yyyy", { locale: id })}
            </TableCell>
            <TableCell className="text-slate-300">
              {format(parseISO(customer.lastBooking), "d MMM yyyy", { locale: id })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}