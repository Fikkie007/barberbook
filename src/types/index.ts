import { Booking, BookingStatus, BookingSource, Role, Service, Shop, Barber, User, ServicePackage, PackageService } from "@prisma/client";

// Re-export types from Prisma
export type { Booking, BookingStatus, BookingSource, Role, Service, Shop, Barber, User, ServicePackage, PackageService };

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Booking form data
export interface BookingFormData {
  serviceId?: string;
  packageId?: string;
  barberId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  bookingDate: string;
  bookingTime: string;
  notes?: string;
  tipAmount?: number;
}

// Shop with relations
export interface ShopWithDetails extends Shop {
  services: Service[];
  packages: ServicePackageWithServices[];
  barbers: Barber[];
  workingDays: WorkingDayData[];
}

export interface WorkingDayData {
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string | null;
  closeTime: string | null;
}

// ServicePackage with services
export interface ServicePackageWithServices extends ServicePackage {
  services: (PackageService & {
    service: Service;
  })[];
}

// Booking with relations
export interface BookingWithDetails extends Booking {
  service: Service | null;
  package: ServicePackageWithServices | null;
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
  serviceRevenue: number;    // revenue from services only
  tipRevenue: number;        // revenue from tips only
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

// Analytics types
export interface BarberPerformance {
  barberId: string | null;
  barberName: string;
  bookingCount: number;
  revenue: number;
}

export interface ServicePopularity {
  id: string;
  name: string;
  type: 'service' | 'package';
  bookingCount: number;
  revenue: number;
}

export interface HourlyBookings {
  hour: number;
  count: number;
}

export interface DailyBookings {
  dayOfWeek: number;
  count: number;
}

export interface CustomerFrequency {
  customerPhone: string;
  customerName: string;
  bookingCount: number;
  totalSpent: number;
  firstBooking: string;  // ISO date string for client serialization
  lastBooking: string;   // ISO date string for client serialization
  isNew: boolean;
}

export interface CustomerSegments {
  newCustomers: number;
  returningCustomers: number;
  newRevenue: number;
  returningRevenue: number;
}

export interface BookingTrends {
  date: string;
  bookings: number;
  revenue: number;
}

export interface PackageVsSingle {
  packageCount: number;
  singleCount: number;
  packageRevenue: number;
  singleRevenue: number;
}