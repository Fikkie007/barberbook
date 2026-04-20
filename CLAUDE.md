# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BarberBook is a multi-tenant SaaS platform for barbershop online booking. Each shop gets a subdomain (e.g., `myshop.localhost:3000`) for their public booking page. **The app is in Indonesian** - all UI text, WhatsApp messages, and seed data use Bahasa Indonesia.

## Tech Stack

- **Framework:** Next.js 16.2 (App Router)
- **Database:** PostgreSQL with Prisma ORM v7 (using `@prisma/adapter-pg` connection pool adapter)
- **Auth:** NextAuth.js v5 (beta.31) with JWT sessions
- **UI:** shadcn/ui + Tailwind CSS v4
- **Forms:** react-hook-form + Zod v4
- **Charts:** Recharts for dashboard revenue visualization
- **WhatsApp:** Fonnte API
- **Scheduled Jobs:** Upstash QStash (for reminder scheduling)

**TypeScript:** Strict mode enabled (TypeScript v6). Import paths use `@/*` alias (e.g., `@/lib/auth`). Prisma types imported from `@prisma/client` (generated types in `src/generated/prisma/`).

## Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

npx prisma migrate dev   # Run database migrations
npx prisma db seed       # Seed database with demo data
npx prisma studio        # Open Prisma database GUI
npx prisma generate      # Generate Prisma client

npx tsx scripts/test-qstash.ts          # Test QStash configuration
npx tsx scripts/test-reminder-flow.ts   # Test reminder scheduling flow
npx tsx scripts/test-webhook-manual.ts  # Manual webhook testing
```

**Note:** No automated test suite is configured. Tests are run via manual scripts in `scripts/`.

### Docker Commands

```bash
docker compose up -d                    # Start app with PostgreSQL
docker compose --profile dev up -d      # Start with QStash local for dev
docker compose -f docker-compose.prod.yml up -d  # Production deployment
```

## Architecture

### Route Groups

- `(dashboard)/` - Protected routes requiring authentication (session checked in layout)
- `(public)/` - Landing page and public routes
- `booking/[slug]/` - Public booking pages accessed via subdomain rewrite
- `queue/[slug]/` - Live queue display page for barbershops (TV display mode)

### Multi-tenant Routing

The middleware (`src/middleware.ts`) handles:
1. Subdomain extraction and rewriting to `/booking/[slug]`
2. Authentication protection for `/dashboard` routes
3. Redirecting authenticated users away from auth pages
4. **Reverse proxy support:** Uses `X-Forwarded-Proto` header for correct HTTPS detection behind proxies (important for production deployment)

For local subdomain testing:
- **Linux/Mac:** Add to `/etc/hosts`
- **Windows:** Add to `C:\Windows\System32\drivers\etc\hosts`

```
127.0.0.1 demo-barbershop.localhost
```

### Authentication

- Uses NextAuth.js v5 (beta) with credentials provider
- Session strategy: JWT
- Custom login page at `/auth/login`
- Roles: `ADMIN` (platform admin), `OWNER` (shop owner), `CASHIER` (shop staff)
- Session user type extended with `id` and `role` in `src/lib/auth.ts`
- **Dual protection:** Middleware redirects unauthenticated users from `/dashboard` and `/settings`. Dashboard layout (`src/app/(dashboard)/layout.tsx`) also calls `auth()` and redirects if no session.
- `trustHost: true` enabled for reverse proxy compatibility

### Role-Based Access Control (RBAC)

RBAC system in `src/lib/rbac.ts` with permission checks:

| Role | Permissions |
|------|-------------|
| `ADMIN` | users:read/create/update/delete, shops:read:all/create/update:all, analytics:read, bookings:manage, services:manage, barbers:manage |
| `OWNER` | Same as ADMIN (full access for owned shops) |
| `CASHIER` | bookings:manage, services:manage (limited to assigned shop) |

Helper functions:
- `hasPermission(role, permission)` - Check if role has specific permission
- `isAdminOrOwner(role)` - Check if role is ADMIN or OWNER
- `isCashier(role)` - Check if role is CASHIER

**Navigation filtering:** Sidebar in `src/components/layout/sidebar.tsx` filters nav items by role:
- Items with `roles: ["ADMIN", "OWNER"]` are hidden for CASHIER
- Items with `excludeRoles: ["CASHIER"]` are hidden for CASHIER
- CASHIER sees only: Dashboard, Booking, Layanan

**Shop access:** CASHIER users see only their assigned shop (no shop selection dropdown). ADMIN/OWNER can select from multiple shops.

### Database

- PostgreSQL via Prisma ORM v7 with connection pool adapter (`@prisma/adapter-pg` + `pg` package)
- Prisma client singleton in `src/lib/prisma.ts` (prevents multiple instances in dev, uses Pool adapter)
- Generated Prisma types in `src/generated/prisma/`
- Schema includes: User, Shop, Service, ServicePackage, PackageService, Barber, Booking, WorkingDay
- User model has `isActive` field for soft delete (deactivating users instead of hard delete)
- User model has `shopId` field for CASHIER role assignment (shop they're assigned to)
- User-Shop relations: `OwnedShops` (OWNER's shops), `AssignedShop` (CASHIER's assigned shop)
- Booking model has reminder tracking fields: `whatsappSent`, `confirmationSent`, `reminderSent`, `qstashMessageId`
- Booking model has `source` field (`ONLINE` or `OFFLINE`) to track booking origin
- Booking model has `serviceId` (optional) for single service bookings and `packageId` (optional) for package bookings
- Booking model has pricing fields: `servicePrice` (base service/package price at booking time), `tipAmount` (tip in rupiah), `totalPrice` (calculated as servicePrice + tipAmount)
- Seed file creates demo shop with services/barbers (`prisma/seed.ts`)

**Data conventions:**
- Prices stored as integers in Rupiah (no decimals)
- Booking times stored as strings in "HH:mm" format (e.g., "09:00")
- Working days: `dayOfWeek` uses 0=Sunday, 1=Monday, etc.
- Phone numbers use Indonesian format (prefix with "62" for WhatsApp)
- Service packages: `PackageService` junction table links packages to services with `sortOrder` for ordering; package price is independent of individual service prices (allows discounts)

**Demo accounts after seeding:**
- Owner: `owner@demo.com` / `password123` (role: OWNER)
- Admin: `admin@barberbook.com` / `password123` (role: ADMIN)
- Demo shop slug: `demo-barbershop`

**Role-based demo accounts:**
- ADMIN can access all shops and manage all users
- OWNER can manage their own shops and create cashiers
- CASHIER (create via Users page) can only access assigned shop

### API Routes

All API routes are in `src/app/api/`:
- `auth/[...nextauth]/` - NextAuth handlers
- `auth/register/` - User registration
- `bookings/` - CRUD for bookings (public create, owner manage; supports `source: ONLINE|OFFLINE` parameter; supports single service or package bookings; **server-side conflict validation**)
- `bookings/barber-availability/` - GET endpoint for real-time barber availability (returns blocked time slots for a barber on a specific date)
- `bookings/queue/` - Get queue data for live display (returns bookings with queue positions and stats)
- `bookings/send-reminder/` - QStash webhook for scheduled reminders
- `cron/` - Cron endpoint for processing pending notifications (call hourly)
- `services/` - Shop services management
- `packages/` - Shop packages management (bundle multiple services)
- `barbers/` - Shop barbers management
- `shops/` - Shop lookup by slug
- `users/` - User management API (ADMIN/OWNER only; GET list, POST create)
- `users/[id]/` - Single user operations (PATCH update, DELETE deactivate)

### WhatsApp Integration

- Uses Fonnte API for WhatsApp notifications
- Configuration in `src/lib/whatsapp.ts`
- Message templates for booking confirmation, reminder, completion, cancellation
- Falls back to console.log in development (no API key)

### Scheduled Reminders (QStash)

- Uses Upstash QStash for scheduling WhatsApp reminders 24 hours before appointments
- Configuration in `src/lib/qstash.ts` and `src/lib/qstash-verify.ts`
- Reminder scheduling endpoint at `/api/bookings/send-reminder`
- Reminders only scheduled if appointment is more than 24 hours away
- Falls back gracefully in development (no QStash token)

**Local QStash testing:**
```bash
docker run -d -p 4000:3000 upstash/qstash-local
# Set QSTASH_URL=http://localhost:4000 in .env
```

### Types

- All types centralized in `src/types/index.ts`
- Prisma types re-exported for use throughout app
- Extended types: `ShopWithDetails`, `BookingWithDetails`, `DashboardStats`
- `DashboardStats` includes revenue breakdowns: `onlineRevenue`/`offlineRevenue` (by booking source), `serviceRevenue`/`tipRevenue` (by revenue type)
- `BlockedSlot` for barber availability: `{start: number, end: number, bookingId: string}` (minutes from midnight)
- Analytics types: `BarberPerformance`, `ServicePopularity`, `HourlyBookings`, `DailyBookings`, `CustomerFrequency`, `CustomerSegments`, `BookingTrends`, `PackageVsSingle`

### Hooks

Custom React hooks in `src/hooks/`:

- `useBarberAvailability(barberId, date)` - Fetches blocked time slots for a barber on a specific date, returns `BlockedSlot[]`
- `isTimeSlotAvailable(time, duration, blockedSlots, selectedDate)` - Helper function to check if a time slot is available (handles today check + overlap detection)

### Shop Helpers

Shop access helper functions in `src/lib/shop-helpers.ts`:

- `getUserShopIds(userId, role)` - Get accessible shop IDs based on role:
  - ADMIN: all shops
  - OWNER: shops they own
  - CASHIER: assigned shop only

- `getUserShops(userId, role)` - Get accessible shops with details (id, name, slug):
  - ADMIN: all shops (ordered by name)
  - OWNER: owned shops (ordered by creation)
  - CASHIER: assigned shop only

- `getActiveShopId(userId, role, selectedShopId)` - Get current active shop for user:
  - ADMIN: can use first shop as default, or selected shop if valid
  - OWNER: must explicitly select a shop (returns null if none selected)
  - CASHIER: always returns their assigned shop

### Dashboard Features

- Stats cards show booking counts and revenue totals
- Revenue chart displays monthly breakdown by source (online vs offline) using stacked area chart
- Booking table shows all bookings with service/package, barber, and source info
- Services page has tabs for managing individual services and service packages
- Offline booking dialog (`src/components/dashboard/offline-booking-dialog.tsx`) allows owners to create walk-in bookings with `source: OFFLINE`
- Packages management (`src/components/dashboard/packages-client.tsx`) allows creating bundles of multiple services with discounted pricing
- Analytics page (`src/app/(dashboard)/dashboard/analytics/page.tsx`) provides comprehensive business insights
- Users page (`src/app/(dashboard)/dashboard/users/page.tsx`) for user management (ADMIN/OWNER only)

### Barber Availability (Conflict Detection)

The system prevents double-booking barbers through real-time conflict detection:

**Implementation:**
- API endpoint: `/api/bookings/barber-availability/` - GET endpoint that returns blocked time slots for a barber on a specific date
- Shared hook: `src/hooks/use-barber-availability.ts` - `useBarberAvailability(barberId, date)` returns `BlockedSlot[]`
- Shared helper: `isTimeSlotAvailable(time, duration, blockedSlots, selectedDate)` checks for overlaps
- Type: `BlockedSlot` in `src/types/index.ts` with `{start: number, end: number, bookingId: string}`
- Server-side validation in `/api/bookings` POST endpoint also checks for conflicts

**Date handling:**
- Frontend sends dates in `YYYY-MM-DD` format (local date, not ISO UTC)
- API uses local date boundaries: `new Date(year, month-1, day, 0, 0, 0)` instead of UTC
- This prevents misclassification for bookings that cross midnight in non-UTC timezones

**Overlap detection logic:**
```typescript
// Overlap: new starts before existing ends AND new ends after existing starts
if (slotStartMinutes < blockedEndMinutes && slotEndMinutes > blockedStartMinutes) {
  return false; // Slot is blocked
}
```

**Affected components:**
- `src/components/booking/booking-form.tsx` - Public booking page (uses `useBarberAvailability` hook)
- `src/components/dashboard/offline-booking-dialog.tsx` - Offline booking dialog (uses shared hook)

**Error message:** "Barber memiliki jadwal booking pada waktu tersebut. Pilih waktu lain atau barber berbeda." (HTTP 409 Conflict)

### User Management

Users page at `/dashboard/users` allows ADMIN and OWNER to:

- **View users:** Shows owner + cashiers for selected shop
- **Create cashier:** Add new CASHIER user assigned to current shop
- **Edit user:** Update name, phone, and role (can change OWNER ↔ CASHIER)
- **Deactivate user:** Soft delete via `isActive: false` (preserves data)

User management API at `/api/users`:
- `GET` - List all active users (ADMIN/OWNER)
- `POST` - Create new user with role and shop assignment
- `PATCH /api/users/[id]` - Update user details
- `DELETE /api/users/[id]` - Deactivate user (soft delete)

Users client component: `src/components/dashboard/users-client.tsx`

### Analytics Dashboard

The Analytics page provides detailed business analytics with four sections:

**Barber Performance:**
- Bar chart showing booking counts and revenue per barber
- Top performers card highlighting best barbers

**Service Analytics:**
- Popular services/packages chart (top 10 by booking count)
- Revenue distribution pie chart by service/package
- Package vs single service comparison

**Time Patterns:**
- Hourly bookings chart showing busiest hours
- Weekly pattern chart showing busiest days
- Booking trends line chart over the year

**Customer Insights:**
- New vs returning customer segments
- Customer frequency distribution
- Top customers table by total spending

Analytics components are in `src/components/dashboard/analytics/` and use types from `src/types/index.ts` (`BarberPerformance`, `ServicePopularity`, `HourlyBookings`, `DailyBookings`, `CustomerFrequency`, `CustomerSegments`, `BookingTrends`, `PackageVsSingle`).

### Queue Display (TV Mode)

The queue display page (`/queue/[slug]`) provides a live, TV-friendly view for barbershops to display in their waiting area:

- **Real-time updates:** Polls API every 5 seconds for live queue status
- **Active bookings:** Shows only PENDING and CONFIRMED bookings with queue positions
- **Large display:** Designed for TV screens with large text and dark theme
- **Status badges:** Indonesian status labels (MENUNGGU, DIPROSES, SELESAI, DIBATALKAN)
- **Stats footer:** Shows total, pending, in-progress, and completed counts
- **LIVE indicator:** Shows connection status (green for live, red for offline)

Access via: `yourdomain.com/queue/demo-barbershop` or directly by slug path.

Queue component is in `src/components/queue/queue-display.tsx` and uses the `/api/bookings/queue` API endpoint.

### UI Components

- Uses shadcn/ui components in `src/components/ui/`
- Layout components in `src/components/layout/`
- Sidebar (`src/components/layout/sidebar.tsx`) with role-based navigation filtering:
  - Nav items can have `roles` (required roles) or `excludeRoles` (excluded roles)
  - CASHIER excluded from: Analytics, Barbers, Settings
  - Users page visible only for ADMIN/OWNER
  - CASHIER sees static shop name (no selection dropdown)
- Feature components in `src/components/booking/`, `src/components/dashboard/`, and `src/components/queue/`
- Key dashboard components: `stats-card.tsx`, `booking-table.tsx`, `revenue-chart.tsx`, `offline-booking-dialog.tsx`, `packages-client.tsx`, `services-client.tsx`, `users-client.tsx`
- Analytics components: `barber-performance-chart.tsx`, `top-barbers-card.tsx`, `service-popularity-chart.tsx`, `service-revenue-chart.tsx`, `package-vs-single-chart.tsx`, `hourly-bookings-chart.tsx`, `weekly-pattern-chart.tsx`, `booking-trends-chart.tsx`, `customer-segments-chart.tsx`, `customer-frequency-chart.tsx`, `top-customers-table.tsx`
- Queue components: `queue-display.tsx` for live TV queue display
- Key UI components: `tabs.tsx` for tabbed navigation (services/packages tabs)
- Form validation with react-hook-form + Zod

## Environment Variables

Required in `.env`:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Secret for NextAuth JWT signing
- `NEXTAUTH_URL` - Base URL (optional in dev)
- `NEXT_PUBLIC_APP_DOMAIN` - Domain for subdomain routing (e.g., `localhost:3000`)
- `NEXT_PUBLIC_APP_URL` - Full app URL (e.g., `http://localhost:3000`)

Optional for WhatsApp notifications:
- `FONNTE_API_KEY` - WhatsApp API key
- `FONNTE_API_URL` - WhatsApp API URL

Optional for scheduled reminders:
- `QSTASH_URL` - QStash endpoint (defaults to Upstash `https://qstash.upstash.io`, use `http://localhost:4000` for local QStash)
- `QSTASH_TOKEN` - Upstash QStash token
- `QSTASH_CURRENT_SIGNING_KEY` - QStash signing key for webhook verification
- `QSTASH_NEXT_SIGNING_KEY` - QStash next signing key for key rotation

Optional for cron endpoint:
- `CRON_SECRET` - Secret token to authenticate cron requests (protects endpoint from abuse)

## Coding Patterns

### Error Handling in External Services

WhatsApp and QStash integrations are designed to fail gracefully:
- Missing API keys result in console logs, not errors
- Booking creation succeeds even if notifications fail
- Always wrap external API calls in try-catch and continue on failure

### Date/Time Formatting

All dates displayed to users use `date-fns` with Indonesian locale:
```tsx
import { format } from "date-fns";
import { id } from "date-fns/locale";

format(date, "EEEE, d MMMM yyyy", { locale: id });
```

### API Response Convention

APIs return JSON with this structure:
```tsx
{ success: true, data: {...} }  // Success
{ error: "Pesan error" }         // Error (in Indonesian)
```

### Pricing Calculation

When creating bookings, the pricing fields are calculated as:
- `servicePrice` = price from the Service model at booking time (captured to preserve historical pricing)
- `tipAmount` = optional tip provided by customer (defaults to 0)
- `totalPrice` = servicePrice + tipAmount

Revenue breakdown in dashboard separates service revenue from tip revenue for reporting purposes.

## Deployment

- Next.js configured with `output: "standalone"` for Docker deployment
- CI/CD via GitHub Actions (`.github/workflows/`):
  - `ci.yml` - Runs on all PRs (lint, build)
  - `deploy.yml` - Builds Docker image, pushes to ghcr.io, deploys via SSH on merge to master/main
- Production uses `docker-compose.prod.yml`

### Cron Job Setup

The `/api/cron` endpoint processes pending WhatsApp notifications. Set up an external cron service to call it hourly.

**Authentication options:**
- Authorization header: `Authorization: Bearer <CRON_SECRET>`
- Query parameter: `?token=<CRON_SECRET>`

**Crontab example:**
```
0 * * * * curl -H "Authorization: Bearer $CRON_SECRET" https://yourdomain.com/api/cron
```

The cron job handles:
1. Sending pending booking confirmations
2. Sending reminders for bookings within 24 hours
