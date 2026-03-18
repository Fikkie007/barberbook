"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Barber {
  id: string;
  name: string;
  phone: string | null;
  isActive: boolean;
}

interface BarbersClientProps {
  shopId: string;
  initialBarbers: Barber[];
}

export default function BarbersClient({ shopId, initialBarbers }: BarbersClientProps) {
  const [barbers, setBarbers] = useState<Barber[]>(initialBarbers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  });

  const resetForm = () => {
    setFormData({ name: "", phone: "" });
    setEditingBarber(null);
  };

  const handleOpenDialog = (barber?: Barber) => {
    if (barber) {
      setEditingBarber(barber);
      setFormData({
        name: barber.name,
        phone: barber.phone || "",
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
      const url = "/api/barbers";
      const method = editingBarber ? "PUT" : "POST";
      const body = editingBarber
        ? { id: editingBarber.id, ...formData }
        : { shopId, ...formData };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        if (editingBarber) {
          setBarbers(barbers.map((b) => (b.id === editingBarber.id ? data.barber : b)));
        } else {
          setBarbers([...barbers, data.barber]);
        }
        setDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error("Failed to save barber:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus barber ini?")) return;

    try {
      await fetch(`/api/barbers?id=${id}`, { method: "DELETE" });
      setBarbers(barbers.filter((b) => b.id !== id));
    } catch (error) {
      console.error("Failed to delete barber:", error);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await fetch("/api/barbers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive }),
      });
      setBarbers(barbers.map((b) => (b.id === id ? { ...b, isActive } : b)));
    } catch (error) {
      console.error("Failed to update barber:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Kelola Barber</h1>
        <Button
          className="bg-amber-500 text-slate-900 hover:bg-amber-400"
          onClick={() => handleOpenDialog()}
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Barber
        </Button>
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-slate-700 bg-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingBarber ? "Edit Barber" : "Tambah Barber Baru"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Nama Barber</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ahmad"
                className="border-slate-600 bg-slate-700 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Nomor HP (Opsional)</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="08123456789"
                className="border-slate-600 bg-slate-700 text-white"
              />
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

      {/* Barbers Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {barbers.map((barber) => (
          <Card key={barber.id} className="border-slate-700 bg-slate-800/50">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 bg-amber-500">
                  <AvatarFallback className="bg-amber-500 text-slate-900 font-bold">
                    {barber.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-white">{barber.name}</CardTitle>
                  {barber.phone && (
                    <p className="text-sm text-slate-400">{barber.phone}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-400 hover:text-white"
                  onClick={() => handleOpenDialog(barber)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-400 hover:text-red-300"
                  onClick={() => handleDelete(barber.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <button
                onClick={() => handleToggleActive(barber.id, !barber.isActive)}
                className={`w-full rounded-lg py-2 text-sm font-medium transition-colors ${
                  barber.isActive
                    ? "bg-green-500/10 text-green-400"
                    : "bg-slate-700/50 text-slate-400"
                }`}
              >
                {barber.isActive ? "Aktif" : "Nonaktif"}
              </button>
            </CardContent>
          </Card>
        ))}
      </div>

      {barbers.length === 0 && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-8 text-center text-slate-400">
          Belum ada barber. Klik tombol &quot;Tambah Barber&quot; untuk memulai.
        </div>
      )}
    </div>
  );
}