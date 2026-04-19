import { Role } from "@prisma/client";

export type Permission =
  | "users:read"
  | "users:create"
  | "users:update"
  | "users:delete"
  | "shops:read:all"
  | "shops:create"
  | "shops:update:all"
  | "analytics:read"
  | "bookings:manage"
  | "services:manage"
  | "barbers:manage";

const rolePermissions: Record<Role, Permission[]> = {
  ADMIN: [
    "users:read",
    "users:create",
    "users:update",
    "users:delete",
    "shops:read:all",
    "shops:create",
    "shops:update:all",
    "analytics:read",
    "bookings:manage",
    "services:manage",
    "barbers:manage",
  ],
  OWNER: [
    "users:read",
    "users:create",
    "users:update",
    "users:delete",
    "shops:read:all",
    "shops:create",
    "shops:update:all",
    "analytics:read",
    "bookings:manage",
    "services:manage",
    "barbers:manage",
  ],
  CASHIER: [
    "bookings:manage",
    "services:manage",
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function isAdminOrOwner(role: Role): boolean {
  return role === "ADMIN" || role === "OWNER";
}

export function isCashier(role: Role): boolean {
  return role === "CASHIER";
}