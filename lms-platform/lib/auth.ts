import type { Session } from "next-auth";

export type AppRole =
  | "admin"
  | "mahasiswa"
  | "dosen"
  | "staff"
  | "user";
export type AppPermission =
  | "dashboard.view"
  | "course.view"
  | "course.manage"
  | "assignment.submit"
  | "grade.input"
  | "*";

const ROLE_PERMISSIONS: Record<AppRole, AppPermission[]> = {
  admin: ["*"],
  mahasiswa: ["dashboard.view", "course.view", "assignment.submit"],
  dosen: ["dashboard.view", "course.view", "course.manage", "grade.input"],
  staff: ["dashboard.view", "course.manage"],
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
    case "staff":
      return "staff";
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
