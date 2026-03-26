# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BarberBook is a multi-tenant SaaS platform for barbershop online booking. Each shop gets a subdomain (e.g., `myshop.localhost:3000`) for their public booking page. **The app is in Indonesian** - all UI text, WhatsApp messages, and seed data use Bahasa Indonesia.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** PostgreSQL with Prisma ORM (generated client in `src/generated/prisma/`)
- **Auth:** NextAuth.js v5 (beta) with JWT sessions
- **UI:** shadcn/ui + Tailwind CSS v4
- **Forms:** react-hook-form + Zod v4
- **WhatsApp:** Fonnte API
- **Scheduled Jobs:** Upstash QStash (for reminder scheduling)

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

### Multi-tenant Routing

The middleware (`src/middleware.ts`) handles:
1. Subdomain extraction and rewriting to `/booking/[slug]`
2. Authentication protection for `/dashboard` routes
3. Redirecting authenticated users away from auth pages

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
- Roles: `OWNER` (shop owner), `ADMIN` (platform admin)
- Session user type extended with `id` and `role` in `src/lib/auth.ts`
- **Dual protection:** Middleware redirects unauthenticated users from `/dashboard` and `/settings`. Dashboard layout (`src/app/(dashboard)/layout.tsx`) also calls `auth()` and redirects if no session.

### Database

- PostgreSQL via Prisma ORM
- Prisma client singleton in `src/lib/prisma.ts` (prevents multiple instances in dev)
- Generated Prisma types in `src/generated/prisma/`
- Schema includes: User, Shop, Service, Barber, Booking, WorkingDay
- Booking model has reminder tracking fields: `whatsappSent`, `confirmationSent`, `reminderSent`, `qstashMessageId`
- Seed file creates demo shop with services/barbers (`prisma/seed.ts`)

**Data conventions:**
- Prices stored as integers in Rupiah (no decimals)
- Booking times stored as strings in "HH:mm" format (e.g., "09:00")
- Working days: `dayOfWeek` uses 0=Sunday, 1=Monday, etc.
- Phone numbers use Indonesian format (prefix with "62" for WhatsApp)

**Demo accounts after seeding:**
- Owner: `owner@demo.com` / `password123`
- Admin: `admin@barberbook.com` / `password123`
- Demo shop slug: `demo-barbershop`

### API Routes

All API routes are in `src/app/api/`:
- `auth/[...nextauth]/` - NextAuth handlers
- `auth/register/` - User registration
- `bookings/` - CRUD for bookings (public create, owner manage)
- `bookings/send-reminder/` - QStash webhook for scheduled reminders
- `services/` - Shop services management
- `barbers/` - Shop barbers management
- `shops/` - Shop lookup by slug

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

### UI Components

- Uses shadcn/ui components in `src/components/ui/`
- Layout components in `src/components/layout/`
- Feature components in `src/components/booking/` and `src/components/dashboard/`
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

## Deployment

- Next.js configured with `output: "standalone"` for Docker deployment
- CI/CD via GitHub Actions (`.github/workflows/`):
  - `ci.yml` - Runs on all PRs (lint, build)
  - `deploy.yml` - Builds Docker image, pushes to ghcr.io, deploys via SSH on merge to master/main
- Production uses `docker-compose.prod.yml`
