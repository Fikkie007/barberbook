"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, UserX } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface Shop {
  id: string;
  name: string;
  slug: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "ADMIN" | "OWNER" | "CASHIER";
  isActive: boolean;
  createdAt: string;
  shopId: string | null;
  assignedShop: Shop | null;
  shops: Shop[];
}

interface UsersClientProps {
  initialUsers: User[];
  shops: Shop[];
  activeShopId: string;
}

export default function UsersClient({
  initialUsers,
  activeShopId,
}: UsersClientProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "CASHIER",
    shopId: activeShopId,
  });

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  const roleColors = {
    ADMIN: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    OWNER: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    CASHIER: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  };

  const roleLabels = {
    ADMIN: "Admin",
    OWNER: "Owner",
    CASHIER: "Cashier",
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "",
      role: "CASHIER",
      shopId: activeShopId,
    });
    setEditingUser(null);
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        password: "",
        role: user.role,
        shopId: user.shopId || activeShopId,
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
      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
      const method = editingUser ? "PATCH" : "POST";

      const body = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password || undefined,
        role: editingUser ? formData.role : "CASHIER", // New users are always CASHIER for this shop
        shopId: activeShopId,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        if (editingUser) {
          setUsers(
            users.map((u) =>
              u.id === editingUser.id ? { ...u, ...data.user } : u,
            ),
          );
        } else {
          setUsers([data.user, ...users]);
        }
        setDialogOpen(false);
        resetForm();
      } else {
        alert(data.error || "Gagal menyimpan pengguna");
      }
    } catch (error) {
      console.error("Failed to save user:", error);
      alert("Gagal menyimpan pengguna");
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (userId: string, userName: string) => {
    if (!confirm(`Nonaktifkan pengguna "${userName}"?`)) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setUsers(users.filter((u) => u.id !== userId));
      } else {
        const data = await response.json();
        alert(data.error || "Gagal menonaktifkan pengguna");
      }
    } catch (error) {
      console.error("Failed to deactivate user:", error);
      alert("Gagal menonaktifkan pengguna");
    }
  };

  const getShopName = (user: User) => {
    if (user.role === "CASHIER" && user.assignedShop) {
      return user.assignedShop.name;
    }
    if (user.shops.length > 0) {
      return user.shops.map((s) => s.name).join(", ");
    }
    return "-";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Kelola Pengguna</h1>
        <Button
          className="bg-amber-500 text-slate-900 hover:bg-amber-400"
          onClick={() => handleOpenDialog()}
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Pengguna
        </Button>
      </div>

      {/* User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-slate-700 bg-slate-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">
              {editingUser ? "Edit Pengguna" : "Tambah Cashier Baru"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Nama</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Nama lengkap"
                  className="border-slate-600 bg-slate-700 text-white placeholder:text-slate-500"
                  required
                />
              </div>
              {/* Only show role dropdown when editing */}
              {editingUser && (
                <div className="space-y-2">
                  <Label className="text-slate-300">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => {
                      if (value) {
                        setFormData({
                          ...formData,
                          role: value,
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="border-slate-600 bg-slate-700 text-white">
                      <SelectValue placeholder="Pilih role" />
                    </SelectTrigger>
                    <SelectContent className="border-slate-700 bg-slate-800 text-white">
                      <SelectItem
                        value="OWNER"
                        className="text-white hover:bg-slate-700 focus:bg-slate-700"
                      >
                        Owner
                      </SelectItem>
                      <SelectItem
                        value="CASHIER"
                        className="text-white hover:bg-slate-700 focus:bg-slate-700"
                      >
                        Cashier
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {/* When creating new user, show role info */}
              {!editingUser && (
                <div className="space-y-2">
                  <Label className="text-slate-300">Role</Label>
                  <div className="rounded-lg bg-slate-700 px-3 py-2 text-sm text-slate-300">
                    Cashier (untuk toko ini)
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="email@example.com"
                className="border-slate-600 bg-slate-700 text-white placeholder:text-slate-500 disabled:text-slate-400 disabled:bg-slate-600 disabled:cursor-not-allowed"
                disabled={!!editingUser}
                required={!editingUser}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">No. Telepon</Label>
              <Input
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="08123456789"
                className="border-slate-600 bg-slate-700 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">
                {editingUser ? "Password Baru" : "Password"}
                {editingUser && (
                  <span className="text-slate-500 text-sm ml-1">
                    (kosongkan jika tidak diubah)
                  </span>
                )}
              </Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder={
                  editingUser ? "Password baru" : "Minimal 6 karakter"
                }
                className="border-slate-600 bg-slate-700 text-white placeholder:text-slate-500"
                required={!editingUser}
              />
            </div>

            <DialogFooter className="gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="border-slate-600 bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-amber-500 text-slate-900 hover:bg-amber-400 flex-1"
              >
                {loading ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Users Table */}
      <Card className="border-slate-700 bg-slate-800/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-400">Nama</TableHead>
                <TableHead className="text-slate-400">Email</TableHead>
                <TableHead className="text-slate-400">No. Telepon</TableHead>
                <TableHead className="text-slate-400">Role</TableHead>
                <TableHead className="text-slate-400">Toko</TableHead>
                <TableHead className="text-slate-400">Dibuat</TableHead>
                <TableHead className="text-slate-400">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="border-slate-700">
                  <TableCell className="text-white font-medium">
                    {user.name}
                  </TableCell>
                  <TableCell className="text-slate-300">{user.email}</TableCell>
                  <TableCell className="text-slate-400">
                    {user.phone || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge className={roleColors[user.role]}>
                      {roleLabels[user.role]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-400">
                    {getShopName(user)}
                  </TableCell>
                  <TableCell className="text-slate-400">
                    {format(new Date(user.createdAt), "d MMM yyyy", {
                      locale: id,
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-white"
                        onClick={() => handleOpenDialog(user)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => handleDeactivate(user.id, user.name)}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {users.length === 0 && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-8 text-center text-slate-400">
          Belum ada pengguna. Klik tombol &quot;Tambah Pengguna&quot; untuk
          memulai.
        </div>
      )}
    </div>
  );
}
