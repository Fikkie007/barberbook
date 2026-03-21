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

### Deploy ke VPS dengan Docker (Step by Step)

Panduan lengkap untuk deploy BarberBook ke VPS Anda.

---

#### Step 1: Persiapan VPS

SSH ke VPS Anda dan install Docker:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Add user ke docker group (agar bisa jalankan tanpa sudo)
sudo usermod -aG docker $USER

# Logout dan login ulang, lalu verifikasi
docker --version
docker compose version
```

---

#### Step 2: Setup Domain & DNS

1. Point domain Anda ke IP VPS:
   - `yourdomain.com` → A record → IP VPS
   - `*.yourdomain.com` → A record → IP VPS (untuk subdomain multi-tenant)

2. Opsional: Setup subdomain untuk testing:
   - `demo.yourdomain.com` → A record → IP VPS

---

#### Step 3: Clone Repository di VPS

```bash
# Buat directory
mkdir -p /opt/barberbook
cd /opt/barberbook

# Clone repository
git clone https://github.com/YOUR_USERNAME/barberbook.git .

# Atau jika private repo:
git clone https://YOUR_TOKEN@github.com/YOUR_USERNAME/barberbook.git .
```

---

#### Step 4: Setup Environment Variables

```bash
cd /opt/barberbook

# Copy template
cp .env.example .env

# Edit file
nano .env
```

Isi dengan konfigurasi production Anda:

```env
# Database (akan di-override oleh docker-compose)
DATABASE_URL="postgresql://barberbook:YOUR_DB_PASSWORD@postgres:5432/barberbook"

# NextAuth.js - GANTI DENGAN SECRET YANG AMAN!
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="generate-dengan-openssl-rand-base64-32"

# Fonnte WhatsApp API
FONNTE_API_KEY="your-fonnte-api-key"
FONNTE_API_URL="https://api.fonnte.com/send"

# Upstash QStash (untuk scheduled reminders)
QSTASH_URL="https://qstash.upstash.io"
QSTASH_TOKEN="your-qstash-token"
QSTASH_CURRENT_SIGNING_KEY="your-current-signing-key"
QSTASH_NEXT_SIGNING_KEY="your-next-signing-key"

# App Config
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NEXT_PUBLIC_APP_DOMAIN="yourdomain.com"
```

Generate secret yang aman:

```bash
openssl rand -base64 32
```

Juga buat file `.env` untuk docker-compose:

```bash
nano .env.docker
```

```env
# Database credentials
POSTGRES_USER=barberbook
POSTGRES_PASSWORD=YOUR_STRONG_PASSWORD_HERE
POSTGRES_DB=barberbook

# Ports
APP_PORT=3000
POSTGRES_PORT=5432
```

---

#### Step 5: Jalankan dengan Docker Compose

**Option A: Build Local (untuk testing pertama kali)**

```bash
cd /opt/barberbook

# Build dan jalankan
docker compose up -d --build

# Lihat logs
docker compose logs -f

# Run migration
docker compose exec app prisma migrate deploy

# Seed database (opsional)
docker compose exec app prisma db seed
```

**Option B: Gunakan Image dari GHCR (untuk production)**

```bash
# Login ke GHCR
echo YOUR_GHCR_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Set image
export DOCKER_IMAGE=ghcr.io/YOUR_USERNAME/barberbook:latest

# Jalankan dengan production compose
docker compose -f docker-compose.prod.yml up -d

# Jalankan migration
docker compose exec app prisma migrate deploy
```

---

#### Step 6: Setup Reverse Proxy (Nginx)

Install Nginx:

```bash
sudo apt install nginx -y
```

Buat konfigurasi Nginx:

```bash
sudo nano /etc/nginx/sites-available/barberbook
```

```nginx
server {
    listen 80;
    server_name yourdomain.com *.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site dan restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/barberbook /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

#### Step 7: Setup SSL dengan Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Generate SSL certificate
sudo certbot --nginx -d yourdomain.com -d "*.yourdomain.com"

# Certbot akan otomatis modify konfigurasi nginx
# Pilih option 2 untuk redirect HTTP ke HTTPS
```

Auto-renewal test:

```bash
sudo certbot renew --dry-run
```

---

#### Step 8: Verifikasi Deployment

```bash
# Cek status container
docker compose ps

# Cek logs jika ada error
docker compose logs -f app

# Test akses
curl https://yourdomain.com
```

Buka `https://yourdomain.com` di browser.

---

#### Step 9: Setup Auto-Deploy dengan GitHub Actions

Untuk deploy otomatis setiap push ke `main` branch:

**9.1 Generate SSH Key untuk Deploy**

Di komputer lokal:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f deploy_key
```

Ini akan membuat:
- `deploy_key` (private key)
- `deploy_key.pub` (public key)

**9.2 Copy Public Key ke VPS**

```bash
# Di VPS, tambahkan public key ke authorized_keys
echo "CONTENTS_OF_deploy_key.pub" >> ~/.ssh/authorized_keys
```

Atau copy manual:

```bash
# Di komputer lokal
cat deploy_key.pub

# Di VPS
nano ~/.ssh/authorized_keys
# Paste public key di baris baru
```

**9.3 Buat GitHub Personal Access Token (PAT)**

1. Buka https://github.com/settings/tokens
2. Klik "Generate new token (classic)"
3. Centang scopes:
   - `read:packages` - untuk pull dari GHCR
   - `write:packages` - untuk push ke GHCR
4. Copy token yang di-generate

**9.4 Tambahkan Secrets di GitHub Repository**

Buka repository Anda → Settings → Secrets and variables → Actions

Tambahkan secrets berikut:

| Secret Name | Value |
|-------------|-------|
| `DEPLOY_HOST` | IP address atau domain VPS Anda (e.g., `123.45.67.89` atau `yourdomain.com`) |
| `DEPLOY_USER` | SSH user (e.g., `root` atau `ubuntu`) |
| `DEPLOY_KEY` | Isi dari file `deploy_key` (private key) |
| `DEPLOY_PATH` | `/opt/barberbook` |
| `GHCR_TOKEN` | GitHub PAT yang dibuat di step 9.3 |

**9.5 Commit dan Push**

```bash
git add .
git commit -m "chore: setup auto-deploy"
git push origin main
```

GitHub Actions akan otomatis:
1. Run lint dan build (CI)
2. Build Docker image dan push ke GHCR
3. Deploy ke VPS via SSH

**Catatan:** Image Docker akan otomatis menggunakan format `ghcr.io/USERNAME/REPO:latest` berdasarkan nama repository Anda. Tidak perlu edit manual di `docker-compose.prod.yml`.

---

#### Command Berguna untuk Maintenance

```bash
# View logs
docker compose logs -f app

# Restart application
docker compose restart app

# Pull latest image dan restart
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# Run migration manual
docker compose exec app prisma migrate deploy

# Backup database
docker compose exec postgres pg_dump -U barberbook barberbook > backup.sql

# Restore database
cat backup.sql | docker compose exec -T postgres psql -U barberbook barberbook

# Check container status
docker compose ps

# View resource usage
docker stats
```

---

#### Troubleshooting

**Container tidak bisa start:**
```bash
# Check logs
docker compose logs app

# Common issues:
# - Database belum ready: tunggu beberapa detik
# - Migration gagal: jalankan manual
docker compose exec app prisma migrate deploy
```

**Database connection error:**
```bash
# Check database container
docker compose logs postgres

# Verify database is running
docker compose exec postgres pg_isready -U barberbook
```

**SSL Certificate error:**
```bash
# Renew certificate
sudo certbot renew

# Check nginx config
sudo nginx -t
```

**Permission denied pada SSH deploy:**
```bash
# Di VPS, check permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# Pastikan public key sudah ditambahkan
cat ~/.ssh/authorized_keys
```

---

### Vercel (Alternative)

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
