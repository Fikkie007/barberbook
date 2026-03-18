# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working in this repository.

## Project Overview

BarberBook is a multi-tenant SaaS platform for barbershop online booking. Each shop gets a subdomain (e.g., `myshop.localhost:3000`) for their public booking page. **The app is in Indonesian language** - all UI text, WhatsApp messages, and seed data use Bahasa Indonesia.

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

For local subdomain testing, add to `/etc/hosts`:
```
127.0.0.1 demo-barbershop.localhost
```

### Authentication

- Uses NextAuth.js v5 (beta) with credentials provider
- Session strategy: JWT
- Custom login page at `/auth/login`
- Roles: `OWNER` (shop owner), `ADMIN` (platform admin)
- Session user type extended with `id` and `role` in `src/lib/auth.ts`

### Database

- PostgreSQL via Prisma ORM
- Prisma client singleton in `src/lib/prisma.ts` (prevents multiple instances in dev)
- Schema includes: User, Shop, Service, Barber, Booking, WorkingDay
- Seed file creates demo shop with services/barbers (`prisma/seed.ts`)

**Demo accounts after seeding:**
- Owner: `owner@demo.com` / `password123`
- Admin: `admin@barberbook.com` / `password123`
- Demo shop slug: `demo-barbershop`

### API Routes

All API routes are in `src/app/api/`:
- `auth/[...nextauth]/` - NextAuth handlers
- `auth/register/` - User registration
- `bookings/` - CRUD for bookings (public create, owner manage)
- `services/` - Shop services management
- `barbers/` - Shop barbers management
- `shops/` - Shop lookup by slug

### WhatsApp Integration

- Uses Fonnte API for WhatsApp notifications
- Configuration in `src/lib/whatsapp.ts`
- Message templates for booking confirmation, reminder, completion, cancellation
- Falls back to console.log in development (no API key)

### Types

- All types centralized in `src/types/index.ts`
- Prisma types re-exported for use throughout app
- Extended types: `ShopWithDetails`, `BookingWithDetails`, `DashboardStats`

### UI Components

- Uses shadcn/ui components in `src/components/ui/`
- Layout components in `src/components/layout/`
- Feature components in `src/components/booking/` and `src/components/dashboard/`
- Form validation with react-hook-form + zod

## Environment Variables

Required in `.env`:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Secret for NextAuth JWT signing
- `NEXTAUTH_URL` - Base URL (optional in dev)
- `NEXT_PUBLIC_APP_DOMAIN` - Domain for subdomain routing (e.g., `localhost:3000`)
- `NEXT_PUBLIC_APP_URL` - Full app URL (e.g., `http://localhost:3000`)
- `FONNTE_API_KEY` - WhatsApp API key (optional for dev)
- `FONNTE_API_URL` - WhatsApp API URL (optional)
