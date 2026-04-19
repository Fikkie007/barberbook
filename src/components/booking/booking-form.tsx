"use client";

import { useState, useEffect } from "react";
import { format, startOfDay, isSameDay } from "date-fns";
import { id } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Service, Barber, WorkingDayData, ServicePackage } from "@/types";

interface PackageServiceItem {
  id: string;
  serviceId: string;
  sortOrder: number;
  service: Pick<Service, "id" | "name" | "price" | "duration">;
}

interface PackageItem extends Pick<ServicePackage, "id" | "name" | "description" | "price" | "duration"> {
  services: PackageServiceItem[];
}

interface BookingFormProps {
  shop: {
    id: string;
    name: string;
    phone: string;
    whatsappNumber: string;
    openingTime: string;
    closingTime: string;
    services: Pick<
      Service,
      "id" | "name" | "description" | "price" | "duration"
    >[];
    packages: PackageItem[];
    barbers: Pick<Barber, "id" | "name">[];
    workingDays: WorkingDayData[];
  };
}

interface FormData {
  serviceId: string;
  packageId: string;
  barberId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  bookingDate: Date | undefined;
  bookingTime: string;
  notes: string;
  tipAmount: number;
  selectionType: "service" | "package";
}

const STEPS = [
  { id: 1, title: "Pilih Layanan" },
  { id: 2, title: "Pilih Waktu" },
  { id: 3, title: "Data Diri" },
  { id: 4, title: "Konfirmasi" },
];

export default function BookingForm({ shop }: BookingFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockedSlots, setBlockedSlots] = useState<{ start: number; end: number }[]>([]);

  const [formData, setFormData] = useState<FormData>({
    serviceId: "",
    packageId: "",
    barberId: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    bookingDate: undefined,
    bookingTime: "",
    notes: "",
    tipAmount: 0,
    selectionType: "service",
  });

  const selectedService = shop.services.find(
    (s) => s.id === formData.serviceId,
  );
  const selectedPackage = shop.packages.find(
    (p) => p.id === formData.packageId,
  );
  const selectedBarber = shop.barbers.find((b) => b.id === formData.barberId);

  // Fetch blocked time slots when barber and date are selected
  useEffect(() => {
    if (!formData.barberId || !formData.bookingDate) {
      setBlockedSlots([]);
      return;
    }

    const fetchBlockedSlots = async () => {
      try {
        const dateStr = formData.bookingDate!.toISOString();
        const response = await fetch(
          `/api/bookings/barber-availability?barberId=${formData.barberId}&date=${dateStr}`
        );
        const data = await response.json();
        if (response.ok) {
          setBlockedSlots(data.blockedSlots);
        }
      } catch (err) {
        console.error("Failed to fetch barber availability:", err);
        setBlockedSlots([]);
      }
    };

    fetchBlockedSlots();
  }, [formData.barberId, formData.bookingDate]);

  // Get the selected item (service or package)
  const selectedItem = formData.selectionType === "package" ? selectedPackage : selectedService;
  const itemPrice = selectedItem?.price || 0;

  // Generate time slots based on shop hours
  const generateTimeSlots = () => {
    const slots: string[] = [];
    const [openHour, openMin] = shop.openingTime.split(":").map(Number);
    const [closeHour, closeMin] = shop.closingTime.split(":").map(Number);

    let currentHour = openHour;
    let currentMin = openMin;

    while (
      currentHour < closeHour ||
      (currentHour === closeHour && currentMin < closeMin)
    ) {
      slots.push(
        `${currentHour.toString().padStart(2, "0")}:${currentMin.toString().padStart(2, "0")}`,
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

  // Check if date is available
  const isDateAvailable = (date: Date) => {
    const dayOfWeek = date.getDay();
    const workingDay = shop.workingDays.find((w) => w.dayOfWeek === dayOfWeek);
    return workingDay?.isOpen ?? false;
  };

  // Check if time slot is available
  const isTimeSlotAvailable = (time: string) => {
    const now = new Date();
    const selectedDate = formData.bookingDate;

    if (!selectedDate) return true;

    // If selected date is today, check if time has passed
    if (isSameDay(selectedDate, now)) {
      const [hour, min] = time.split(":").map(Number);
      const slotTime = new Date(selectedDate);
      slotTime.setHours(hour, min, 0, 0);
      if (slotTime <= now) return false;
    }

    // Check for barber conflicts if barber is selected
    if (formData.barberId && blockedSlots.length > 0) {
      const slotDuration = selectedItem?.duration || 60;
      const slotStartMinutes =
        parseInt(time.split(":")[0]) * 60 + parseInt(time.split(":")[1]);
      const slotEndMinutes = slotStartMinutes + slotDuration;

      // Check if slot overlaps with any blocked slot
      for (const blocked of blockedSlots) {
        if (slotStartMinutes < blocked.end && slotEndMinutes > blocked.start) {
          return false;
        }
      }
    }

    return true;
  };

  const handleInputChange = (
    field: keyof FormData,
    value: string | Date | undefined | null,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value ?? "" }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.selectionType === "package"
          ? !!formData.packageId
          : !!formData.serviceId;
      case 2:
        return !!formData.bookingDate && !!formData.bookingTime;
      case 3:
        return !!formData.customerName && !!formData.customerPhone;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!formData.bookingDate) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: shop.id,
          serviceId: formData.selectionType === "service" ? formData.serviceId : null,
          packageId: formData.selectionType === "package" ? formData.packageId : null,
          barberId:
            formData.barberId && formData.barberId !== ""
              ? formData.barberId
              : null,
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          customerEmail: formData.customerEmail || null,
          bookingDate: formData.bookingDate.toISOString(),
          bookingTime: formData.bookingTime,
          notes: formData.notes || null,
          tipAmount: formData.tipAmount || 0,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal membuat booking");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    const itemName = formData.selectionType === "package"
      ? selectedPackage?.name
      : selectedService?.name;

    return (
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
        <CardContent className="pt-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500">
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Booking Berhasil!</h2>
          <p className="mt-2 text-slate-400">
            Anda akan menerima konfirmasi via WhatsApp.
          </p>
          <div className="mt-6 rounded-lg bg-slate-700/50 p-4 text-left">
            <h3 className="font-semibold text-white">Detail Booking</h3>
            <div className="mt-2 space-y-1 text-sm text-slate-300">
              <p>
                Tanggal:{" "}
                {formData.bookingDate &&
                  format(formData.bookingDate, "EEEE, d MMMM yyyy", {
                    locale: id,
                  })}
              </p>
              <p>Waktu: {formData.bookingTime}</p>
              <p>{formData.selectionType === "package" ? "Paket" : "Layanan"}: {itemName}</p>
              {formData.tipAmount > 0 ? (
                <div className="pt-2 border-t border-slate-600">
                  <p>{formData.selectionType === "package" ? "Paket" : "Layanan"}: Rp {itemPrice.toLocaleString("id-ID")}</p>
                  <p>Tip: Rp {formData.tipAmount.toLocaleString("id-ID")}</p>
                  <p className="font-semibold text-white">
                    Total: Rp {(itemPrice + formData.tipAmount).toLocaleString("id-ID")}
                  </p>
                </div>
              ) : (
                <p>Total: Rp {itemPrice.toLocaleString("id-ID")}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold ${
                currentStep >= step.id
                  ? "bg-amber-500 text-slate-900"
                  : "bg-slate-700 text-slate-400"
              }`}
            >
              {step.id}
            </div>
            <span
              className={`ml-2 hidden text-sm font-medium sm:block ${
                currentStep >= step.id ? "text-white" : "text-slate-400"
              }`}
            >
              {step.title}
            </span>
            {index < STEPS.length - 1 && (
              <div
                className={`mx-4 h-0.5 w-8 ${
                  currentStep > step.id ? "bg-amber-500" : "bg-slate-700"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-white">
            {STEPS[currentStep - 1].title}
          </CardTitle>
          <CardDescription className="text-slate-400">
            {currentStep === 1 && "Pilih layanan yang diinginkan"}
            {currentStep === 2 && "Pilih tanggal dan waktu booking"}
            {currentStep === 3 && "Isi data diri Anda"}
            {currentStep === 4 && "Periksa dan konfirmasi booking"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Step 1: Select Service or Package */}
          {currentStep === 1 && (
            <div className="space-y-4">
              {/* Toggle between Services and Packages */}
              <Tabs
                value={formData.selectionType}
                onValueChange={(value) => {
                  setFormData({
                    ...formData,
                    selectionType: value as "service" | "package",
                    serviceId: value === "service" ? "" : formData.serviceId,
                    packageId: value === "package" ? "" : formData.packageId,
                  });
                }}
                className="w-full"
              >
                <TabsList className="bg-transparent border-none p-0 gap-2">
                  <TabsTrigger
                    value="service"
                    className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900 text-slate-400 hover:text-slate-200 px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Layanan
                  </TabsTrigger>
                  <TabsTrigger
                    value="package"
                    className="data-[state=active]:bg-amber-500 data-[state=active]:text-slate-900 text-slate-400 hover:text-slate-200 px-4 py-2 rounded-lg font-medium transition-colors"
                    disabled={shop.packages.length === 0}
                  >
                    Paket
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Services Grid */}
              {formData.selectionType === "service" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {shop.services.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => handleInputChange("serviceId", service.id)}
                      className={`rounded-lg border p-4 text-left transition-all ${
                        formData.serviceId === service.id
                          ? "border-amber-500 bg-amber-500/10"
                          : "border-slate-600 bg-slate-700/30 hover:border-slate-500"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-white">
                            {service.name}
                          </h3>
                          {service.description && (
                            <p className="mt-1 text-sm text-slate-400">
                              {service.description}
                            </p>
                          )}
                          <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                            <span>{service.duration} menit</span>
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-amber-500/20 text-amber-400"
                        >
                          Rp {service.price.toLocaleString("id-ID")}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Packages Grid */}
              {formData.selectionType === "package" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {shop.packages.map((pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => handleInputChange("packageId", pkg.id)}
                      className={`rounded-lg border p-4 text-left transition-all ${
                        formData.packageId === pkg.id
                          ? "border-amber-500 bg-amber-500/10"
                          : "border-slate-600 bg-slate-700/30 hover:border-slate-500"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-white">
                            {pkg.name}
                          </h3>
                          {pkg.description && (
                            <p className="mt-1 text-sm text-slate-400">
                              {pkg.description}
                            </p>
                          )}
                          <ul className="mt-2 text-sm text-slate-400 space-y-1">
                            {pkg.services.map((ps) => (
                              <li key={ps.id} className="flex items-center gap-1">
                                <span className="text-amber-400">•</span>
                                {ps.service.name}
                              </li>
                            ))}
                          </ul>
                          <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                            <span>{pkg.duration} menit</span>
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-amber-500/20 text-amber-400"
                        >
                          Rp {pkg.price.toLocaleString("id-ID")}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {formData.selectionType === "service" && shop.services.length === 0 && (
                <div className="rounded-lg border border-slate-600 bg-slate-700/30 p-4 text-center text-slate-400">
                  Belum ada layanan tersedia
                </div>
              )}

              {formData.selectionType === "package" && shop.packages.length === 0 && (
                <div className="rounded-lg border border-slate-600 bg-slate-700/30 p-4 text-center text-slate-400">
                  Belum ada paket tersedia
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Date & Time */}
          {currentStep === 2 && (
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <Label className="text-slate-300">Pilih Tanggal</Label>
                <div className="mt-2 flex justify-center">
                  <Calendar
                    mode="single"
                    selected={formData.bookingDate}
                    onSelect={(date) => handleInputChange("bookingDate", date)}
                    disabled={[{ before: startOfDay(new Date()) }]}
                    modifiers={{ available: (date) => isDateAvailable(date) }}
                    className="rounded-lg border border-slate-600 bg-slate-800 p-3 [&_.rdp-month]:text-white [&_.rdp-caption_label]:text-white [&_.rdp-weekday]:text-slate-400 [&_.rdp-day]:text-white [&_button]:text-white [&_button:hover]:bg-slate-700 [&_button[data-selected-single=true]]:bg-amber-500 [&_button[data-selected-single=true]]:text-slate-900 [&_.rdp-day_disabled]:text-slate-600 [&_.rdp-outside]:text-slate-600 [&_.rdp-nav_button]:text-white [&_.rdp-nav_button:hover]:bg-slate-700 [&_.rdp-today]:bg-slate-700 [&_.rdp-today]:text-amber-400"
                  />
                </div>
              </div>
              <div>
                <Label className="text-slate-300">Pilih Waktu</Label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {timeSlots.map((time) => {
                    const available = isTimeSlotAvailable(time);
                    return (
                      <button
                        key={time}
                        onClick={() =>
                          available && handleInputChange("bookingTime", time)
                        }
                        disabled={!available}
                        className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                          formData.bookingTime === time
                            ? "bg-amber-500 text-slate-900"
                            : available
                              ? "bg-slate-700 text-white hover:bg-slate-600"
                              : "bg-slate-800 text-slate-500 cursor-not-allowed"
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
                {shop.barbers.length > 0 && (
                  <div className="mt-4">
                    <Label className="text-slate-300">
                      Pilih Barber (Opsional)
                    </Label>
                    <Select
                      value={formData.barberId}
                      onValueChange={(value) => {
                        handleInputChange("barberId", value);
                        // Reset time when barber changes
                        handleInputChange("bookingTime", "");
                      }}
                    >
                      <SelectTrigger className="mt-2 w-full border-slate-600 bg-slate-700 text-white">
                        <SelectValue placeholder="Pilih barber">
                          {formData.barberId === ""
                            ? "Barber manapun"
                            : shop.barbers.find((b) => b.id === formData.barberId)?.name || "Pilih barber"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="border-slate-600 bg-slate-800 text-white">
                        <SelectItem
                          value=""
                          className="text-white bg-slate-800 hover:bg-amber-500/20 hover:text-amber-400 focus:bg-amber-500/20 focus:text-amber-400"
                        >
                          Barber manapun
                        </SelectItem>
                        {shop.barbers.map((barber) => (
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
                )}
              </div>
            </div>
          )}

          {/* Step 3: Customer Info */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerName" className="text-slate-300">
                  Nama Lengkap
                </Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) =>
                    handleInputChange("customerName", e.target.value)
                  }
                  placeholder="John Doe"
                  className="border-slate-600 bg-slate-700/50 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone" className="text-slate-300">
                  Nomor WhatsApp
                </Label>
                <Input
                  id="customerPhone"
                  value={formData.customerPhone}
                  onChange={(e) =>
                    handleInputChange("customerPhone", e.target.value)
                  }
                  placeholder="08123456789"
                  className="border-slate-600 bg-slate-700/50 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail" className="text-slate-300">
                  Email (Opsional)
                </Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) =>
                    handleInputChange("customerEmail", e.target.value)
                  }
                  placeholder="nama@email.com"
                  className="border-slate-600 bg-slate-700/50 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipAmount" className="text-slate-300">
                  Tip (Opsional)
                </Label>
                <Input
                  id="tipAmount"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.tipAmount || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tipAmount: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  className="border-slate-600 bg-slate-700/50 text-white"
                />
                <p className="text-xs text-slate-400">
                  Berikan tip untuk barber Anda (dalam Rupiah)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-slate-300">
                  Catatan (Opsional)
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Catatan khusus untuk booking Anda..."
                  className="border-slate-600 bg-slate-700/50 text-white"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="rounded-lg bg-slate-700/50 p-4">
                <h3 className="font-semibold text-white">Ringkasan Booking</h3>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between text-slate-300">
                    <span>Toko</span>
                    <span className="text-white">{shop.name}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>{formData.selectionType === "package" ? "Paket" : "Layanan"}</span>
                    <span className="text-white">
                      {formData.selectionType === "package" ? selectedPackage?.name : selectedService?.name}
                    </span>
                  </div>
                  {formData.selectionType === "package" && selectedPackage && (
                    <div className="text-slate-400 text-xs">
                      <span>Termasuk: </span>
                      {selectedPackage.services.map(ps => ps.service.name).join(", ")}
                    </div>
                  )}
                  {selectedBarber && (
                    <div className="flex justify-between text-slate-300">
                      <span>Barber</span>
                      <span className="text-white">{selectedBarber.name}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-300">
                    <span>Tanggal</span>
                    <span className="text-white">
                      {formData.bookingDate &&
                        format(formData.bookingDate, "EEEE, d MMMM yyyy", {
                          locale: id,
                        })}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Waktu</span>
                    <span className="text-white">{formData.bookingTime}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Nama</span>
                    <span className="text-white">{formData.customerName}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>No. WhatsApp</span>
                    <span className="text-white">{formData.customerPhone}</span>
                  </div>
                  {formData.customerEmail && (
                    <div className="flex justify-between text-slate-300">
                      <span>Email</span>
                      <span className="text-white">
                        {formData.customerEmail}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-slate-600 pt-3">
                    {formData.tipAmount > 0 ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-300">{formData.selectionType === "package" ? "Paket" : "Layanan"}</span>
                          <span className="text-white">
                            Rp {itemPrice.toLocaleString("id-ID")}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-300">Tip</span>
                          <span className="text-white">
                            Rp {formData.tipAmount.toLocaleString("id-ID")}
                          </span>
                        </div>
                        <div className="flex justify-between text-base font-semibold pt-2 border-t border-slate-600">
                          <span className="text-white">Total</span>
                          <span className="text-amber-400">
                            Rp {(itemPrice + formData.tipAmount).toLocaleString("id-ID")}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between text-base font-semibold">
                        <span className="text-white">Total</span>
                        <span className="text-amber-400">
                          Rp {itemPrice.toLocaleString("id-ID")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-6 flex justify-between">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="border-slate-600 bg-slate-700 text-white hover:bg-slate-600"
              >
                Kembali
              </Button>
            ) : (
              <div />
            )}
            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
                className="bg-amber-500 text-slate-900 hover:bg-amber-400"
              >
                Lanjut
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="bg-amber-500 text-slate-900 hover:bg-amber-400"
              >
                {loading ? "Memproses..." : "Konfirmasi Booking"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
