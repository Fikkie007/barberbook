"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  isActive: boolean;
  sortOrder: number;
}

interface ServicesClientProps {
  shopId: string;
  initialServices: Service[];
}

export default function ServicesClient({
  shopId,
  initialServices,
}: ServicesClientProps) {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration: "30",
  });

  useEffect(() => {
    setServices(initialServices);
  }, [initialServices]);

  const resetForm = () => {
    setFormData({ name: "", description: "", price: "", duration: "30" });
    setEditingService(null);
  };

  const handleOpenDialog = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        description: service.description || "",
        price: service.price.toString(),
        duration: service.duration.toString(),
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = "/api/services";
      const method = editingService ? "PUT" : "POST";
      const body = editingService
        ? { id: editingService.id, ...formData }
        : { shopId, ...formData };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        if (editingService) {
          setServices(
            services.map((s) =>
              s.id === editingService.id ? data.service : s,
            ),
          );
        } else {
          setServices([...services, data.service]);
        }
        setDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Failed to save service:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus layanan ini?")) return;

    try {
      await fetch(`/api/services?id=${id}`, { method: "DELETE" });
      setServices(services.filter((s) => s.id !== id));
    } catch (error) {
      console.error("Failed to delete service:", error);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await fetch("/api/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive }),
      });
      setServices(services.map((s) => (s.id === id ? { ...s, isActive } : s)));
    } catch (error) {
      console.error("Failed to update service:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Kelola Layanan</h1>
        <Button
          className="bg-amber-500 text-slate-900 hover:bg-amber-400"
          onClick={() => handleOpenDialog()}
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Layanan
        </Button>
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-slate-700 bg-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingService ? "Edit Layanan" : "Tambah Layanan Baru"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Nama Layanan</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Potong Rambut"
                className="border-slate-600 bg-slate-700 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Deskripsi</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Deskripsi layanan..."
                className="border-slate-600 bg-slate-700 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Harga (Rp)</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  placeholder="50000"
                  className="border-slate-600 bg-slate-700 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Durasi (menit)</Label>
                <Input
                  type="number"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: e.target.value })
                  }
                  placeholder="30"
                  className="border-slate-600 bg-slate-700 text-white"
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 text-slate-900 hover:bg-amber-400"
            >
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Services Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Card key={service.id} className="border-slate-700 bg-slate-800/50">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <CardTitle className="text-white">{service.name}</CardTitle>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-400 hover:text-white"
                  onClick={() => handleOpenDialog(service)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-400 hover:text-red-300"
                  onClick={() => handleDelete(service.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {service.description && (
                <p className="mb-2 text-sm text-slate-400">
                  {service.description}
                </p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-amber-400">
                  Rp {service.price.toLocaleString("id-ID")}
                </span>
                <span className="text-sm text-slate-400">
                  {service.duration} menit
                </span>
              </div>
              <button
                onClick={() =>
                  handleToggleActive(service.id, !service.isActive)
                }
                className={`mt-3 w-full rounded-lg py-2 text-sm font-medium transition-colors ${
                  service.isActive
                    ? "bg-green-500/10 text-green-400"
                    : "bg-slate-700/50 text-slate-400"
                }`}
              >
                {service.isActive ? "Aktif" : "Nonaktif"}
              </button>
            </CardContent>
          </Card>
        ))}
      </div>

      {services.length === 0 && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-8 text-center text-slate-400">
          Belum ada layanan. Klik tombol &quot;Tambah Layanan&quot; untuk
          memulai.
        </div>
      )}
    </div>
  );
}
