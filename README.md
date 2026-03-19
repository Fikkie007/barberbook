# BarberBook

Platform booking online untuk barbershop. Multi-tenant SaaS dengan notifikasi WhatsApp otomatis.

## Fitur

- 📅 **Booking Online 24/7** - Pelanggan bisa booking kapan saja
- 💬 **Notifikasi WhatsApp Otomatis** - Konfirmasi, reminder, dan notifikasi otomatis
- 🏪 **Multi-tenant** - Setiap toko memiliki subdomain unik
- 📊 **Dashboard Owner** - Kelola booking, layanan, dan barber
- 📱 **Mobile Friendly** - Responsif di semua perangkat

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** PostgreSQL dengan Prisma ORM
- **Auth:** NextAuth.js v5
- **UI:** shadcn/ui + Tailwind CSS
- **WhatsApp API:** Fonnte
- **Scheduled Jobs:** Upstash QStash

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Fonnte account (untuk WhatsApp notifications)

## Getting Started

### 1. Clone repository

```bash
git clone https://github.com/yourusername/barberbook.git
cd barberbook
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

```bash
cp .env.example .env
```

Edit `.env` dengan konfigurasi Anda:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/barberbook"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Fonnte WhatsApp API (optional)
FONNTE_API_KEY="your-fonnte-api-key"
FONNTE_API_URL="https://api.fonnte.com/send"

# Upstash QStash (optional - untuk scheduled reminders)
QSTASH_URL="https://qstash.upstash.io"
QSTASH_TOKEN="your-qstash-token"
QSTASH_CURRENT_SIGNING_KEY="your-signing-key"
QSTASH_NEXT_SIGNING_KEY="your-next-signing-key"

# App Config
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_DOMAIN="localhost:3000"
```

### 4. Setup database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed database dengan demo data
npx prisma db seed
```

### 5. Run development server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## Demo Account

Setelah menjalankan seed, gunakan akun berikut:

- **Email:** owner@demo.com
- **Password:** password123

## Multi-tenant Routing

Aplikasi menggunakan subdomain untuk routing multi-tenant:

- `localhost:3000` - Landing page
- `demo-barbershop.localhost:3000` - Halaman booking untuk toko "demo-barbershop"
- `localhost:3000/dashboard` - Dashboard owner (perlu login)

Untuk testing subdomain di localhost, edit file `/etc/hosts`:

```
127.0.0.1 demo-barbershop.localhost
```

## WhatsApp Integration

1. Daftar di [Fonnte](https://fonnte.com/)
2. Dapatkan API key dari dashboard
3. Scan QR code untuk menghubungkan WhatsApp
4. Tambahkan `FONNTE_API_KEY` ke `.env`

Pesan otomatis akan dikirim saat:
- Booking baru dibuat (konfirmasi)
- Status booking diubah ke COMPLETED (terima kasih)
- Booking dibatalkan (pembatalan)
- 24 jam sebelum appointment (reminder) - memerlukan QStash

## Scheduled Reminders (QStash)

Aplikasi menggunakan Upstash QStash untuk menjadwalkan pengingat WhatsApp 24 jam sebelum appointment.

### Setup Upstash QStash

1. Daftar di [Upstash Console](https://console.upstash.com/)
2. Buat QStash instance
3. Copy token dan signing keys ke `.env`

### Local Development dengan QStash Local

```bash
# Jalankan QStash local dengan Docker
docker run -d -p 4000:3000 upstash/qstash-local

# Set environment variables
QSTASH_URL="http://localhost:4000"
QSTASH_TOKEN="any-token-works-locally"
```

### Test QStash Configuration

```bash
npx tsx scripts/test-qstash.ts
```

## Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/barberbook)

1. Push ke GitHub
2. Import project di Vercel
3. Add environment variables
4. Deploy

### Manual

```bash
npm run build
npm run start
```

## Scripts

```bash
npm run dev          # Development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

npx prisma studio    # Open database GUI
npx prisma migrate dev   # Run migrations
npx prisma db seed       # Seed database
npx tsx scripts/test-qstash.ts  # Test QStash configuration
```

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/     # Protected routes
│   ├── (public)/        # Landing page
│   ├── api/             # API routes
│   ├── auth/            # Auth pages
│   └── booking/         # Public booking pages
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── layout/          # Layout components
│   ├── dashboard/       # Dashboard components
│   └── booking/         # Booking components
├── lib/
│   ├── auth.ts          # NextAuth config
│   ├── prisma.ts        # Prisma client
│   ├── whatsapp.ts      # WhatsApp API
│   ├── qstash.ts        # QStash client
│   └── qstash-verify.ts # QStash webhook verification
├── scripts/
│   └── test-qstash.ts   # QStash test script
└── types/               # TypeScript types
```

## License

[MIT](LICENSE)

## Contributing

Pull requests are welcome. For major changes, please open an issue first.
