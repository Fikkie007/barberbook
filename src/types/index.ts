import { Booking, BookingStatus, BookingSource, Role, Service, Shop, Barber, User } from "@prisma/client";

// Re-export types from Prisma
export type { Booking, BookingStatus, BookingSource, Role, Service, Shop, Barber, User };

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Booking form data
export interface BookingFormData {
  serviceId: string;
  barberId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  bookingDate: string;
  bookingTime: string;
  notes?: string;
}

// Shop with relations
export interface ShopWithDetails extends Shop {
  services: Service[];
  barbers: Barber[];
  workingDays: WorkingDayData[];
}

export interface WorkingDayData {
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string | null;
  closeTime: string | null;
}

// Booking with relations
export interface BookingWithDetails extends Booking {
  service: Service;
  barber: Barber | null;
  shop: Shop;
}

// Dashboard stats
export interface DashboardStats {
  totalBookings: number;
  pendingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  onlineRevenue: number;
  offlineRevenue: number;
  todayBookings: number;
  thisWeekBookings: number;
  thisMonthBookings: number;
}

// Time slot
export interface TimeSlot {
  time: string;
  available: boolean;
  barberName?: string;
}

// Chart data
export interface RevenueData {
  date: string;
  revenue: number;
  bookings: number;
}

export interface BookingData {
  date: string;
  count: number;
}