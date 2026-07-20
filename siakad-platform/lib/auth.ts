import type { Session } from "next-auth";

export type AppRole = "admin" | "mahasiswa" | "dosen" | "kaprodi" | "baak" | "user";
export type AppPermission =
  | "dashboard.view"
  | "academic.view"
  | "academic.grade"
  | "academic.manage"
  | "hr.view"
  | "hr.manage_payroll"
  | "*";

const ROLE_PERMISSIONS: Record<AppRole, AppPermission[]> = {
  admin: ["*"],
  mahasiswa: ["dashboard.view", "academic.view"],
  dosen: ["dashboard.view", "academic.view", "academic.grade"],
  kaprodi: ["dashboard.view", "academic.view", "academic.manage"],
  baak: ["dashboard.view", "academic.manage", "hr.view"],
  user: ["dashboard.view"],
};

function fallbackRole(role: string | undefined): AppRole {
  switch (role) {
    case "admin":
      return "admin";
    case "mahasiswa":
      return "mahasiswa";
    case "dosen":
      return "dosen";
    case "kaprodi":
      return "kaprodi";
    case "baak":
      return "baak";
    default:
      return "user";
  }
}

export function getRole(session: Session | null): AppRole {
  const role = (session?.user as any)?.role;
  return fallbackRole(role);
}

export function getPermissions(session: Session | null): AppPermission[] {
  const role = getRole(session);
  const perms = ROLE_PERMISSIONS[role] || [];
  if (perms.includes("*")) return ["*"];
  return perms;
}

export function hasRole(session: Session | null, role: AppRole): boolean {
  if (!session?.user) return false;
  const currentRole = getRole(session);
  if (currentRole === "admin") return true;
  return (
    currentRole === role ||
    (session.user as any)?.roles?.includes?.(role) ||
    false
  );
}

export function hasPermission(
  session: Session | null,
  permission: AppPermission
): boolean {
  const perms = getPermissions(session);
  if (perms.includes("*")) return true;
  return perms.includes(permission);
}

export function requireRole(session: Session | null, role: AppRole) {
  if (!hasRole(session, role)) {
    throw new Error(`Akses ditolak: dibutuhkan role ${role}`);
  }
}

export function requirePermission(session: Session | null, permission: AppPermission) {
  if (!hasPermission(session, permission)) {
    throw new Error(`Akses ditolak: dibutuhkan permission ${permission}`);
  }
}
