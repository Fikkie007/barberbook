import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "BarberBook - Platform Booking Barbershop",
    template: "%s | BarberBook",
  },
  description:
    "Platform booking online untuk barbershop. Pelanggan bisa booking 24/7 dengan notifikasi WhatsApp otomatis.",
  keywords: [
    "barbershop",
    "booking",
    "online booking",
    "barber",
    " haircut",
    "sistem booking",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
