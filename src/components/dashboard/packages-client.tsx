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
import { Plus, Pencil, Trash2, Package } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  isActive: boolean;
}

interface PackageService {
  id: string;
  serviceId: string;
  sortOrder: number;
  service: Service;
}

interface ServicePackage {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  isActive: boolean;
  services: PackageService[];
}

interface PackagesClientProps {
  shopId: string;
  initialPackages: ServicePackage[];
  services: Service[];
}

export default function PackagesClient({
  shopId,
  initialPackages,
  services,
}: PackagesClientProps) {
  const [packages, setPackages] = useState<ServicePackage[]>(initialPackages);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration: "60",
    serviceIds: [] as string[],
  });

  useEffect(() => {
    setPackages(initialPackages);
  }, [initialPackages]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      duration: "60",
      serviceIds: [],
    });
    setEditingPackage(null);
  };

  const handleOpenDialog = (pkg?: ServicePackage) => {
    if (pkg) {
      setEditingPackage(pkg);
      setFormData({
        name: pkg.name,
        description: pkg.description || "",
        price: pkg.price.toString(),
        duration: pkg.duration.toString(),
        serviceIds: pkg.services.map((ps) => ps.serviceId),
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleServiceToggle = (serviceId: string) => {
    setFormData((prev) => {
      const isSelected = prev.serviceIds.includes(serviceId);
      if (isSelected) {
        return {
          ...prev,
          serviceIds: prev.serviceIds.filter((id) => id !== serviceId),
        };
      } else {
        return { ...prev, serviceIds: [...prev.serviceIds, serviceId] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.serviceIds.length === 0) {
      alert("Pilih minimal satu layanan untuk paket");
      return;
    }

    setLoading(true);

    try {
      const url = "/api/packages";
      const method = editingPackage ? "PUT" : "POST";
      const body = editingPackage
        ? { id: editingPackage.id, ...formData }
        : { shopId, ...formData };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        if (editingPackage) {
          setPackages(
            packages.map((p) =>
              p.id === editingPackage.id ? data.package : p,
            ),
          );
        } else {
          setPackages([...packages, data.package]);
        }
        setDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Failed to save package:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus paket ini?")) return;

    try {
      await fetch(`/api/packages?id=${id}`, { method: "DELETE" });
      setPackages(packages.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Failed to delete package:", error);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await fetch("/api/packages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive }),
      });
      setPackages(packages.map((p) => (p.id === id ? { ...p, isActive } : p)));
    } catch (error) {
      console.error("Failed to update package:", error);
    }
  };

  const calculateServicesTotal = () => {
    return formData.serviceIds.reduce((total, serviceId) => {
      const service = services.find((s) => s.id === serviceId);
      return total + (service?.price || 0);
    }, 0);
  };

  const activeServices = services.filter((s) => s.isActive);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Kelola Paket</h1>
        <Button
          className="bg-amber-500 text-slate-900 hover:bg-amber-400"
          onClick={() => handleOpenDialog()}
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Paket
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-slate-700 bg-slate-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingPackage ? "Edit Paket" : "Tambah Paket Baru"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Nama Paket</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Paket Grooming Lengkap"
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
                placeholder="Deskripsi paket..."
                className="border-slate-600 bg-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Pilih Layanan</Label>
              <div className="rounded-lg border border-slate-600 bg-slate-700/50 p-3 space-y-2 max-h-40 overflow-y-auto">
                {activeServices.map((service) => (
                  <label
                    key={service.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-slate-700 p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={formData.serviceIds.includes(service.id)}
                      onChange={() => handleServiceToggle(service.id)}
                      className="rounded border-slate-500"
                    />
                    <span className="text-slate-300 text-sm flex-1">
                      {service.name}
                    </span>
                    <span className="text-amber-400 text-xs">
                      Rp {service.price.toLocaleString("id-ID")}
                    </span>
                  </label>
                ))}
                {activeServices.length === 0 && (
                  <p className="text-slate-400 text-sm text-center">
                    Tidak ada layanan aktif
                  </p>
                )}
              </div>
              {formData.serviceIds.length > 0 && (
                <p className="text-xs text-slate-400">
                  Total layanan: Rp{" "}
                  {calculateServicesTotal().toLocaleString("id-ID")}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Harga Paket (Rp)</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  placeholder="100000"
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
                  placeholder="60"
                  className="border-slate-600 bg-slate-700 text-white"
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading || formData.serviceIds.length === 0}
              className="w-full bg-amber-500 text-slate-900 hover:bg-amber-400"
            >
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Packages Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg) => (
          <Card key={pkg.id} className="border-slate-700 bg-slate-800/50">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-amber-400" />
                <CardTitle className="text-white">{pkg.name}</CardTitle>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-400 hover:text-white"
                  onClick={() => handleOpenDialog(pkg)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-400 hover:text-red-300"
                  onClick={() => handleDelete(pkg.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {pkg.description && (
                <p className="mb-2 text-sm text-slate-400">{pkg.description}</p>
              )}
              <div className="mb-3">
                <p className="text-xs text-slate-500 mb-1">Layanan termasuk:</p>
                <ul className="text-sm text-slate-300 space-y-1">
                  {pkg.services.map((ps) => (
                    <li key={ps.id} className="flex items-center gap-1">
                      <span className="text-amber-400">•</span>
                      {ps.service.name}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-amber-400">
                  Rp {pkg.price.toLocaleString("id-ID")}
                </span>
                <span className="text-sm text-slate-400">
                  {pkg.duration} menit
                </span>
              </div>
              <button
                onClick={() => handleToggleActive(pkg.id, !pkg.isActive)}
                className={`mt-3 w-full rounded-lg py-2 text-sm font-medium transition-colors ${
                  pkg.isActive
                    ? "bg-green-500/10 text-green-400"
                    : "bg-slate-700/50 text-slate-400"
                }`}
              >
                {pkg.isActive ? "Aktif" : "Nonaktif"}
              </button>
            </CardContent>
          </Card>
        ))}
      </div>

      {packages.length === 0 && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-8 text-center text-slate-400">
          Belum ada paket. Klik tombol &quot;Tambah Paket&quot; untuk memulai.
        </div>
      )}
    </div>
  );
}
