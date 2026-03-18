"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Store, Link as LinkIcon } from "lucide-react";

interface Shop {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string;
  whatsappNumber: string;
  address: string;
  openingTime: string;
  closingTime: string;
  isActive: boolean;
}

interface SettingsClientProps {
  userId: string;
  initialShops: Shop[];
  isNew?: boolean;
}

export default function SettingsClient({
  userId,
  initialShops,
  isNew,
}: SettingsClientProps) {
  const [shops, setShops] = useState<Shop[]>(initialShops);
  const [activeShop, setActiveShop] = useState<Shop | null>(
    isNew ? null : initialShops[0] || null,
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    phone: "",
    whatsappNumber: "",
    address: "",
    openingTime: "09:00",
    closingTime: "21:00",
  });

  useEffect(() => {
    if (activeShop) {
      setFormData({
        name: activeShop.name,
        slug: activeShop.slug,
        description: activeShop.description || "",
        phone: activeShop.phone,
        whatsappNumber: activeShop.whatsappNumber,
        address: activeShop.address,
        openingTime: activeShop.openingTime,
        closingTime: activeShop.closingTime,
      });
    }
  }, [activeShop]);

  const handleCreateNew = () => {
    setActiveShop(null);
    setFormData({
      name: "",
      slug: "",
      description: "",
      phone: "",
      whatsappNumber: "",
      address: "",
      openingTime: "09:00",
      closingTime: "21:00",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const isCreating = !activeShop;
      const url = "/api/shops";
      const method = isCreating ? "POST" : "PUT";
      const body = isCreating
        ? { ...formData, ownerId: userId }
        : { id: activeShop.id, ...formData };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        if (isCreating) {
          setShops([...shops, data.shop]);
          setActiveShop(data.shop);
        } else {
          setShops(shops.map((s) => (s.id === data.shop.id ? data.shop : s)));
        }
        setMessage({ type: "success", text: "Toko berhasil disimpan!" });
      } else {
        setMessage({
          type: "error",
          text: data.error || "Gagal menyimpan toko",
        });
      }
    } catch (error) {
      console.error("Failed to save shop:", error);
      setMessage({ type: "error", text: "Terjadi kesalahan" });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const bookingUrl = activeShop
    ? `${process.env.NEXT_PUBLIC_APP_URL?.replace("://", `://${activeShop.slug}.`) || `https://${activeShop.slug}.barberbook.com`}`
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Pengaturan Toko</h1>
        {shops.length > 0 && (
          <Button
            onClick={handleCreateNew}
            variant="outline"
            className="bg-amber-500 text-slate-900 hover:bg-amber-400"
          >
            <Store className="mr-2 h-4 w-4" />
            Tambah Toko
          </Button>
        )}
      </div>

      {/* Shop Selector */}
      {shops.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {shops.map((shop) => (
            <button
              key={shop.id}
              onClick={() => setActiveShop(shop)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeShop?.id === shop.id
                  ? "bg-amber-500 text-slate-900"
                  : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {shop.name}
            </button>
          ))}
        </div>
      )}

      {message && (
        <div
          className={`rounded-lg p-3 ${
            message.type === "success"
              ? "bg-green-500/10 text-green-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Shop Form */}
      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader>
          <CardTitle className="text-white">
            {activeShop ? "Edit Toko" : "Buat Toko Baru"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-slate-300">Nama Toko</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData({
                      ...formData,
                      name,
                      slug: generateSlug(name),
                    });
                  }}
                  placeholder="Barbershop Jaya"
                  className="border-slate-600 bg-slate-700 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Slug (URL)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">...</span>
                  <Input
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        slug: e.target.value.replace(/[^a-z0-9-]/g, ""),
                      })
                    }
                    placeholder="barbershop-jaya"
                    className="border-slate-600 bg-slate-700 text-white"
                    required
                  />
                  <span className="text-slate-400">.barberbook.com</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Deskripsi</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Deskripsi singkat toko Anda..."
                className="border-slate-600 bg-slate-700 text-white"
                rows={2}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-slate-300">Nomor Telepon</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="08123456789"
                  className="border-slate-600 bg-slate-700 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Nomor WhatsApp</Label>
                <Input
                  value={formData.whatsappNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, whatsappNumber: e.target.value })
                  }
                  placeholder="628123456789"
                  className="border-slate-600 bg-slate-700 text-white"
                  required
                />
                <p className="text-xs text-slate-400">
                  Format: 628xxx (tanpa +)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Alamat</Label>
              <Textarea
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Jl. Contoh No. 123, Kota"
                className="border-slate-600 bg-slate-700 text-white"
                rows={2}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-slate-300">Jam Buka</Label>
                <Input
                  type="time"
                  value={formData.openingTime}
                  onChange={(e) =>
                    setFormData({ ...formData, openingTime: e.target.value })
                  }
                  className="border-slate-600 bg-slate-700 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Jam Tutup</Label>
                <Input
                  type="time"
                  value={formData.closingTime}
                  onChange={(e) =>
                    setFormData({ ...formData, closingTime: e.target.value })
                  }
                  className="border-slate-600 bg-slate-700 text-white"
                  required
                />
              </div>
            </div>

            {bookingUrl && (
              <div className="rounded-lg bg-slate-700/50 p-4">
                <div className="flex items-center gap-2 text-slate-300">
                  <LinkIcon className="h-4 w-4" />
                  <span className="font-medium">Link Booking:</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <code className="flex-1 rounded bg-slate-800 px-3 py-2 text-sm text-amber-400">
                    {bookingUrl}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="bg-amber-500 text-slate-900 hover:bg-amber-400"
                    onClick={() => navigator.clipboard.writeText(bookingUrl)}
                  >
                    Salin
                  </Button>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 text-slate-900 hover:bg-amber-400"
            >
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Menyimpan..." : "Simpan Toko"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
