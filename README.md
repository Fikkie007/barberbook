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

### Option A: Docker (Recommended untuk Production)
- Docker & Docker Compose
- Fonnte account (untuk WhatsApp notifications)

### Option B: Manual Development
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

### Docker

#### Quick Start

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Edit .env dengan konfigurasi Anda
# Penting: Ganti NEXTAUTH_SECRET dan password database

# 3. Build dan jalankan
docker compose up -d

# 4. Seed database (opsional, untuk demo data)
docker compose exec app npx prisma db seed
```

Aplikasi akan berjalan di `http://localhost:3000`

#### Docker Commands

```bash
# Start services
docker compose up -d

# View logs
docker compose logs -f app

# Stop services
docker compose down

# Stop dan hapus volumes (reset database)
docker compose down -v

# Rebuild setelah code changes
docker compose up -d --build
```

#### Development dengan QStash Local

```bash
# Jalankan dengan QStash local
docker compose --profile dev up -d
```

#### Environment Variables untuk Docker

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | barberbook | Database username |
| `POSTGRES_PASSWORD` | barberbook_secret | Database password |
| `POSTGRES_DB` | barberbook | Database name |
| `POSTGRES_PORT` | 5432 | Database port |
| `APP_PORT` | 3000 | Application port |
| `QSTASH_PORT` | 4000 | QStash local port (dev only) |

#### Production Deployment

Untuk production, gunakan `docker-compose.prod.yml` yang menggunakan image dari GHCR:

```bash
# Set image tag (opsional, default: ghcr.io/azkadev/barberbook:latest)
export DOCKER_IMAGE=ghcr.io/yourusername/barberbook:latest

# Jalankan dengan production compose
docker compose -f docker-compose.prod.yml up -d
```

**Catatan:** File `docker-compose.yml` digunakan untuk local development dengan build lokal, sedangkan `docker-compose.prod.yml` menggunakan image dari registry untuk deployment.

### CI/CD (GitHub Actions)

Project ini menggunakan GitHub Actions untuk CI/CD otomatis.

#### Workflows

| Workflow | Trigger | Deskripsi |
|----------|---------|-----------|
| `ci.yml` | Push/PR ke main/master | Lint & build validation |
| `deploy.yml` | Push ke main/master | Build Docker image & deploy |

#### Setup Deploy ke Server

1. **Generate SSH Key** untuk deploy:
   ```bash
   ssh-keygen -t ed25519 -C "github-actions" -f deploy_key
   ```

2. **Tambahkan Secrets** di GitHub repository settings:
   - `DEPLOY_HOST` - IP atau hostname server
   - `DEPLOY_USER` - SSH user (e.g., `root` atau `ubuntu`)
   - `DEPLOY_KEY` - Private key yang di-generate
   - `DEPLOY_PATH` - Path ke project directory di server
   - `GHCR_TOKEN` - GitHub Personal Access Token dengan `read:packages` scope (untuk pull image di server)

3. **Setup server**:
   ```bash
   # Di server, clone repository
   git clone https://github.com/yourusername/barberbook.git /opt/barberbook
   cd /opt/barberbook

   # Copy .env dan edit
   cp .env.example .env
   nano .env

   # Add public key ke authorized_keys
   cat deploy_key.pub >> ~/.ssh/authorized_keys
   ```

4. **Deploy otomatis** akan berjalan setiap push ke `main` atau `master` branch.

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
