import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, Smartphone, BarChart3, MessageCircle, Globe, CheckCircle } from "lucide-react";

const features = [
  {
    icon: CalendarDays,
    title: "Booking Online 24/7",
    description: "Pelanggan bisa booking kapan saja melalui link unik toko Anda",
  },
  {
    icon: MessageCircle,
    title: "Notifikasi WhatsApp Otomatis",
    description: "Konfirmasi booking langsung terkirim ke WhatsApp pelanggan",
  },
  {
    icon: BarChart3,
    title: "Dashboard Owner",
    description: "Pantau booking dan pendapatan toko dalam satu dashboard",
  },
  {
    icon: Globe,
    title: "Subdomain Unik",
    description: "Setiap toko memiliki link booking sendiri dengan subdomain unik",
  },
  {
    icon: Smartphone,
    title: "Mobile Friendly",
    description: "Tampilan responsif yang nyaman di semua perangkat",
  },
  {
    icon: CheckCircle,
    title: "Konfirmasi Otomatis",
    description: "Sistem konfirmasi jadwal otomatis tanpa perlu follow up manual",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500">
              <svg
                className="h-6 w-6 text-slate-900"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"
                />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">BarberBook</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-slate-300 hover:text-white">
                Masuk
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-amber-500 text-slate-900 hover:bg-amber-400">
                Daftar Gratis
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Platform Booking Online untuk{" "}
            <span className="text-amber-400">Barbershop</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
            Tingkatkan pelayanan toko Anda dengan sistem booking online yang modern.
            Pelanggan bisa booking 24/7 dengan notifikasi WhatsApp otomatis.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/auth/register">
              <Button size="lg" className="bg-amber-500 text-slate-900 hover:bg-amber-400 px-8">
                Mulai Gratis Sekarang
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                Lihat Fitur
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold text-white sm:text-4xl">
            Fitur Lengkap untuk Barbershop
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-slate-400">
            Semua yang Anda butuhkan untuk mengelola booking dan meningkatkan pelayanan toko
          </p>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-slate-700 bg-slate-800/50 backdrop-blur transition-transform hover:scale-105"
              >
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
                    <feature.icon className="h-6 w-6 text-amber-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-slate-400">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="border-t border-slate-800 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold text-white sm:text-4xl">
            Cara Kerja
          </h2>
          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500 text-2xl font-bold text-slate-900">
                1
              </div>
              <h3 className="text-xl font-semibold text-white">Daftar Akun</h3>
              <p className="mt-2 text-slate-400">
                Buat akun gratis dan setup toko barbershop Anda
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500 text-2xl font-bold text-slate-900">
                2
              </div>
              <h3 className="text-xl font-semibold text-white">Tambah Layanan</h3>
              <p className="mt-2 text-slate-400">
                Tambahkan layanan dan barber yang tersedia
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500 text-2xl font-bold text-slate-900">
                3
              </div>
              <h3 className="text-xl font-semibold text-white">Bagikan Link</h3>
              <p className="mt-2 text-slate-400">
                Bagikan link booking ke pelanggan dan terima booking 24/7
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4">
          <Card className="border-slate-700 bg-gradient-to-r from-amber-500/10 to-transparent">
            <CardContent className="p-8 text-center sm:p-12">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                Siap Meningkatkan Pelayanan Toko Anda?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-slate-400">
                Bergabung dengan ratusan barbershop yang sudah menggunakan BarberBook
                untuk meningkatkan pelayanan dan pendapatan mereka.
              </p>
              <Link href="/auth/register">
                <Button size="lg" className="mt-6 bg-amber-500 text-slate-900 hover:bg-amber-400">
                  Daftar Gratis Sekarang
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-slate-400">
          <p>&copy; 2024 BarberBook. Platform Booking Barbershop.</p>
        </div>
      </footer>
    </div>
  );
}