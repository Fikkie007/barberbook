"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  CalendarDays,
  Scissors,
  Users,
  Settings,
  Menu,
  LogOut,
  Store,
  Plus,
} from "lucide-react";
import { signOut } from "next-auth/react";

interface SidebarProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
  shops: Array<{
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  }>;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/bookings", label: "Booking", icon: CalendarDays },
  { href: "/dashboard/services", label: "Layanan", icon: Scissors },
  { href: "/dashboard/barbers", label: "Barber", icon: Users },
  { href: "/dashboard/settings", label: "Pengaturan", icon: Settings },
];

function NavContent({ user, shops }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-4">
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

      <Separator className="bg-slate-700" />

      {/* User Info */}
      <div className="p-4">
        <div className="rounded-lg bg-slate-800/50 p-3">
          <p className="font-medium text-white">{user.name}</p>
          <p className="text-sm text-slate-400">{user.email}</p>
        </div>
      </div>

      {/* Shops */}
      {shops.length > 0 && (
        <div className="px-4 py-2">
          <p className="mb-2 text-xs font-semibold uppercase text-slate-400">
            Toko Anda
          </p>
          <div className="space-y-1">
            {shops.map((shop) => (
              <Link
                key={shop.id}
                href={`/dashboard?shop=${shop.id}`}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white"
              >
                <Store className="h-4 w-4" />
                {shop.name}
              </Link>
            ))}
          </div>
          <Link href="/dashboard/settings?new=true">
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full justify-start text-slate-400 hover:text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Toko
            </Button>
          </Link>
        </div>
      )}

      <Separator className="bg-slate-700" />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-amber-500/10 text-amber-400"
                  : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Separator className="bg-slate-700" />

      {/* Logout */}
      <div className="p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-400 hover:bg-red-500/10 hover:text-red-400"
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
        >
          <LogOut className="mr-2 h-5 w-5" />
          Keluar
        </Button>
      </div>
    </div>
  );
}

export default function Sidebar({ user, shops }: SidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <div className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-slate-700 bg-slate-900/95 px-4 backdrop-blur lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={<Button variant="ghost" size="icon" className="text-white" />}
          >
            <Menu className="h-6 w-6" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 border-slate-700 bg-slate-900 p-0">
            <NavContent user={user} shops={shops} />
          </SheetContent>
        </Sheet>
        <span className="text-lg font-bold text-white">BarberBook</span>
      </div>

      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-700 bg-slate-900 lg:block">
        <NavContent user={user} shops={shops} />
      </aside>
    </>
  );
}