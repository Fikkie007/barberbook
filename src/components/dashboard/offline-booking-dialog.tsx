"use client";

import { useState } from "react";
import { format, startOfDay, isSameDay } from "date-fns";
import { id } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Phone, Scissors, CalendarDays, Clock, User2, Mail, FileText } from "lucide-react";

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface Barber {
  id: string;
  name: string;
}

interface WorkingDay {
  dayOfWeek: number;
  isOpen: boolean;
}

interface OfflineBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: string;
  services: Service[];
  barbers: Barber[];
  workingDays: WorkingDay[];
  shopHours: {
    openingTime: string;
    closingTime: string;
  };
  onSuccess: () => void;
}

interface FormData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  serviceId: string;
  barberId: string;
  bookingDate: Date | undefined;
  bookingTime: string;
  notes: string;
  tipAmount: number;
}

export default function OfflineBookingDialog({
  open,
  onOpenChange,
  shopId,
  services,
  barbers,
  workingDays,
  shopHours,
  onSuccess,
}: OfflineBookingDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    serviceId: "",
    barberId: "",
    bookingDate: new Date(), // Default to today
    bookingTime: "",
    notes: "",
    tipAmount: 0,
  });

  const selectedService = services.find((s) => s.id === formData.serviceId);

  // Generate time slots based on shop hours
  const generateTimeSlots = () => {
    const slots: string[] = [];

    // Defensive check for invalid shop hours
    if (!shopHours?.openingTime || !shopHours?.closingTime) {
      // Return default slots if shop hours are not set
      for (let h = 9; h < 21; h++) {
        slots.push(`${h.toString().padStart(2, "0")}:00`);
        slots.push(`${h.toString().padStart(2, "0")}:30`);
      }
      return slots;
    }

    const [openHour, openMin] = shopHours.openingTime.split(":").map(Number);
    const [closeHour, closeMin] = shopHours.closingTime.split(":").map(Number);

    // Validate parsed values
    if (isNaN(openHour) || isNaN(closeHour)) {
      for (let h = 9; h < 21; h++) {
        slots.push(`${h.toString().padStart(2, "0")}:00`);
        slots.push(`${h.toString().padStart(2, "0")}:30`);
      }
      return slots;
    }

    let currentHour = openHour;
    let currentMin = openMin;

    while (
      currentHour < closeHour ||
      (currentHour === closeHour && currentMin < closeMin)
    ) {
      slots.push(
        `${currentHour.toString().padStart(2, "0")}:${currentMin.toString().padStart(2, "0")}`
      );
      currentMin += 30;
      if (currentMin >= 60) {
        currentHour++;
        currentMin = 0;
      }
    }

    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Check if date is available based on working days
  const isDateAvailable = (date: Date) => {
    const dayOfWeek = date.getDay();
    const workingDay = workingDays.find((w) => w.dayOfWeek === dayOfWeek);
    return workingDay?.isOpen ?? false;
  };

  // Check if time slot is in the past (for today)
  const isTimeSlotAvailable = (time: string) => {
    const now = new Date();
    const selectedDate = formData.bookingDate;

    if (!selectedDate) return true;

    // If selected date is today, check if time has passed
    if (isSameDay(selectedDate, now)) {
      const [hour, min] = time.split(":").map(Number);
      const slotTime = new Date(selectedDate);
      slotTime.setHours(hour, min, 0, 0);
      return slotTime > now;
    }

    return true;
  };

  // Get available time slots for selected date
  const availableTimeSlots = timeSlots.filter(isTimeSlotAvailable);

  const resetForm = () => {
    setFormData({
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      serviceId: "",
      barberId: "",
      bookingDate: new Date(),
      bookingTime: "",
      notes: "",
      tipAmount: 0,
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Manual validation
    if (!formData.customerName.trim()) {
      setError("Nama pelanggan wajib diisi");
      setLoading(false);
      return;
    }

    if (!formData.customerPhone.trim()) {
      setError("Nomor telepon wajib diisi");
      setLoading(false);
      return;
    }

    // Phone validation: minimum 10 digits
    const phoneDigits = formData.customerPhone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      setError("Nomor telepon minimal 10 digit");
      setLoading(false);
      return;
    }

    if (!formData.serviceId) {
      setError("Pilih layanan terlebih dahulu");
      setLoading(false);
      return;
    }

    if (!formData.bookingDate) {
      setError("Pilih tanggal booking");
      setLoading(false);
      return;
    }

    // Date validation: must be today or future
    const today = startOfDay(new Date());
    const selectedDay = startOfDay(formData.bookingDate);
    if (selectedDay < today) {
      setError("Tanggal booking tidak boleh sebelum hari ini");
      setLoading(false);
      return;
    }

    if (!formData.bookingTime) {
      setError("Pilih waktu booking terlebih dahulu");
      setLoading(false);
      return;
    }

    // Additional validation: check shopId exists
    if (!shopId) {
      setError("ID toko tidak valid. Refresh halaman dan coba lagi.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          serviceId: formData.serviceId,
          barberId: formData.barberId || null,
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          customerEmail: formData.customerEmail || null,
          bookingDate: formData.bookingDate.toISOString(),
          bookingTime: formData.bookingTime,
          notes: formData.notes || null,
          tipAmount: formData.tipAmount || 0,
          source: "OFFLINE",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal membuat booking");
      }

      // Success
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  // Reset form when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="border-slate-700 bg-slate-800 max-w-xl w-full p-0 gap-0">
        {/* Header Section */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-700">
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-amber-500" />
            Tambah Booking Offline
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Catat booking untuk pelanggan walk-in
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Main Form Content - Scrollable */}
          <div className="px-6 py-4 space-y-5 max-h-[60vh] overflow-y-auto">
            {/* Section: Customer Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
                <User className="h-4 w-4" />
                <span>Informasi Pelanggan</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-xs">Nama *</Label>
                  <Input
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="Nama pelanggan"
                    className="border-slate-600 bg-slate-700/50 text-white h-9"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-xs">No. Telepon *</Label>
                  <Input
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    placeholder="08123456789"
                    className="border-slate-600 bg-slate-700/50 text-white h-9"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section: Service Selection */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
                <Scissors className="h-4 w-4" />
                <span>Layanan</span>
              </div>
              {services.length === 0 ? (
                <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3 text-sm text-yellow-400">
                  Belum ada layanan. Tambah layanan di menu Layanan terlebih dahulu.
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-xs">Pilih Layanan *</Label>
                  <Select
                    value={formData.serviceId}
                    onValueChange={(value) => setFormData({ ...formData, serviceId: value ?? "" })}
                  >
                    <SelectTrigger className="w-full border-slate-600 bg-slate-700/50 text-white h-9">
                      <SelectValue placeholder="Pilih layanan">
                        {selectedService ? `${selectedService.name} - Rp ${selectedService.price.toLocaleString("id-ID")}` : "Pilih layanan"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="border-slate-600 bg-slate-800 text-white [&_[data-slot=select-scroll-up-button]]:bg-slate-800 [&_[data-slot=select-scroll-down-button]]:bg-slate-800 [&_[data-slot=select-scroll-up-button]_svg]:text-slate-400 [&_[data-slot=select-scroll-down-button]_svg]:text-slate-400">
                      {services.map((service) => (
                        <SelectItem
                          key={service.id}
                          value={service.id}
                          className="text-white bg-slate-800 hover:bg-amber-500/20 hover:text-amber-400 focus:bg-amber-500/20 focus:text-amber-400"
                        >
                          {service.name} - Rp {service.price.toLocaleString("id-ID")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Section: Date & Time */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
                <Clock className="h-4 w-4" />
                <span>Tanggal & Waktu</span>
              </div>

              {/* Date Row */}
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs">Tanggal *</Label>
                <div className="rounded-lg border border-slate-600 bg-slate-800 p-3">
                  <Calendar
                    mode="single"
                    selected={formData.bookingDate}
                    onSelect={(date) => setFormData({ ...formData, bookingDate: date })}
                    disabled={[{ before: startOfDay(new Date()) }]}
                    modifiers={{ available: isDateAvailable }}
                    className="w-full border-0 bg-transparent [&_.rdp]:w-full [&_.rdp-month]:w-full [&_.rdp-months]:w-full [&_.rdp-month]:text-white [&_.rdp-caption]:flex [&_.rdp-caption]:justify-between [&_.rdp-caption_label]:text-white [&_.rdp-weekday]:text-slate-400 [&_.rdp-day]:text-white [&_.rdp-nav]:flex [&_.rdp-nav_button]:text-white [&_.rdp-nav_button]:bg-slate-700 [&_.rdp-nav_button]:border-slate-600 [&_.rdp-nav_button]:rounded [&_.rdp-nav_button:hover]:bg-slate-600 [&_button]:text-white [&_button:hover]:bg-slate-700 [&_button[data-selected-single=true]]:bg-amber-500 [&_button[data-selected-single=true]]:text-slate-900 [&_.rdp-day_disabled]:text-slate-500 [&_.rdp-outside]:text-slate-500 [&_.rdp-today:not([data-selected-single])]:bg-slate-700 [&_.rdp-today:not([data-selected-single])]:text-amber-400"
                  />
                </div>
              </div>

              {/* Time Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-xs">Waktu *</Label>
                  {availableTimeSlots.length === 0 ? (
                    <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2 text-xs text-red-400">
                      Tidak ada waktu tersedia untuk hari ini. Pilih tanggal lain.
                    </div>
                  ) : (
                    <Select
                      value={formData.bookingTime}
                      onValueChange={(value) => setFormData({ ...formData, bookingTime: value ?? "" })}
                    >
                      <SelectTrigger className="w-full border-slate-600 bg-slate-700/50 text-white h-9">
                        <SelectValue placeholder="Pilih waktu">
                          {formData.bookingTime || "Pilih waktu"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="border-slate-600 bg-slate-800 text-white max-h-[200px] [&_[data-slot=select-scroll-up-button]]:bg-slate-800 [&_[data-slot=select-scroll-down-button]]:bg-slate-800 [&_[data-slot=select-scroll-up-button]_svg]:text-slate-400 [&_[data-slot=select-scroll-down-button]_svg]:text-slate-400">
                        {availableTimeSlots.map((time) => (
                          <SelectItem
                            key={time}
                            value={time}
                            className="text-white bg-slate-800 hover:bg-amber-500/20 hover:text-amber-400 focus:bg-amber-500/20 focus:text-amber-400"
                          >
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-xs">Barber</Label>
                  <Select
                    value={formData.barberId}
                    onValueChange={(value) => setFormData({ ...formData, barberId: value ?? "" })}
                  >
                    <SelectTrigger className="w-full border-slate-600 bg-slate-700/50 text-white h-9">
                      <SelectValue placeholder="Barber manapun">
                        {formData.barberId === ""
                          ? "Barber manapun"
                          : barbers.find((b) => b.id === formData.barberId)?.name || "Barber manapun"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="border-slate-600 bg-slate-800 text-white [&_[data-slot=select-scroll-up-button]]:bg-slate-800 [&_[data-slot=select-scroll-down-button]]:bg-slate-800 [&_[data-slot=select-scroll-up-button]_svg]:text-slate-400 [&_[data-slot=select-scroll-down-button]_svg]:text-slate-400">
                      <SelectItem
                        value=""
                        className="text-white bg-slate-800 hover:bg-amber-500/20 hover:text-amber-400 focus:bg-amber-500/20 focus:text-amber-400"
                      >
                        Barber manapun
                      </SelectItem>
                      {barbers.map((barber) => (
                        <SelectItem
                          key={barber.id}
                          value={barber.id}
                          className="text-white bg-slate-800 hover:bg-amber-500/20 hover:text-amber-400 focus:bg-amber-500/20 focus:text-amber-400"
                        >
                          {barber.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Section: Optional Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
                <FileText className="h-4 w-4" />
                <span>Detail Tambahan (Opsional)</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-xs">Email</Label>
                  <Input
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    placeholder="email@example.com"
                    className="border-slate-600 bg-slate-700/50 text-white h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300 text-xs">Catatan</Label>
                  <Input
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Catatan khusus..."
                    className="border-slate-600 bg-slate-700/50 text-white h-9"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300 text-xs">Tip (Rp)</Label>
                <Input
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.tipAmount || ""}
                  onChange={(e) => setFormData({ ...formData, tipAmount: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="border-slate-600 bg-slate-700/50 text-white h-9"
                />
                <p className="text-xs text-slate-500">Tip untuk barber (opsional)</p>
              </div>
            </div>
          </div>

          {/* Footer Section - Fixed */}
          <div className="px-6 py-4 border-t border-slate-700 bg-slate-800/50">
            {/* Price Summary */}
            {selectedService && (
              <div className="mb-3 rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-300 text-sm">Layanan:</span>
                    <span className="text-white font-medium">{selectedService.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {formData.tipAmount > 0 ? (
                      <div className="text-right">
                        <div className="text-xs text-slate-400">
                          Rp {selectedService.price.toLocaleString("id-ID")} + Rp {formData.tipAmount.toLocaleString("id-ID")} tip
                        </div>
                        <span className="text-amber-400 font-bold">
                          Rp {(selectedService.price + formData.tipAmount).toLocaleString("id-ID")}
                        </span>
                      </div>
                    ) : (
                      <span className="text-amber-400 font-bold">
                        Rp {selectedService.price.toLocaleString("id-ID")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className="flex-1 border-slate-600 bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={loading || services.length === 0 || availableTimeSlots.length === 0 || !formData.customerName || !formData.customerPhone || !formData.serviceId || !formData.bookingTime}
                className="flex-1 bg-amber-500 text-slate-900 hover:bg-amber-400 font-medium disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2m6.362-4.788l3.86-2.914c0-.378-.108-.766-.322-1.166a3.012 3.012 0 00-1.052-1.106l-3.86 2.914zm0 0l3.86 2.914c.38.577.602 1.214.602 1.906 0 1.65-1.35 3-3 3h-3.86l3.86-2.914z" />
                    </svg>
                    Menyimpan...
                  </span>
                ) : (
                  "Simpan Booking"
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}