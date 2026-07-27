import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * SSO Role definitions for HRIS / SDM application.
 * These roles are assigned via SSO Platform's dynamic role system.
 */
export const HRIS_ROLES = {
  SUPER_ADMIN: "super_admin_sdm",
  ADMIN_DATA: "admin_data_sdm",
  ADMIN_PAYROLL: "admin_payroll",
  APPROVER: "approver",
} as const;

export type HrisRole = (typeof HRIS_ROLES)[keyof typeof HRIS_ROLES];

/**
 * All available admin roles for HRIS.
 */
export const ALL_HRIS_ROLES: HrisRole[] = Object.values(HRIS_ROLES);

/**
 * Roles that have access to all panels.
 */
export const FULL_ACCESS_ROLES: HrisRole[] = [HRIS_ROLES.SUPER_ADMIN];

/**
 * Roles that can access employee directory & onboarding.
 */
export const DATA_ROLES: HrisRole[] = [
  HRIS_ROLES.SUPER_ADMIN,
  HRIS_ROLES.ADMIN_DATA,
];

/**
 * Roles that can access payroll execution.
 */
export const PAYROLL_ROLES: HrisRole[] = [
  HRIS_ROLES.SUPER_ADMIN,
  HRIS_ROLES.ADMIN_PAYROLL,
  HRIS_ROLES.APPROVER,
];

/**
 * Roles that can approve leave & payroll steps.
 */
export const APPROVER_ROLES: HrisRole[] = [
  HRIS_ROLES.SUPER_ADMIN,
  HRIS_ROLES.APPROVER,
];

/**
 * Roles that can access settings panel.
 */
export const SETTINGS_ROLES: HrisRole[] = [HRIS_ROLES.SUPER_ADMIN];

/**
 * Get the current admin session with role validation.
 * Returns null if not authenticated or not an admin.
 */
export async function getAdminSession() {
  try {
    const session = await auth();
    if (!session?.user) return null;

    const user = session.user as any;
    const role = user.role as string;

    // Check if user has a valid HRIS role
    if (!role || !ALL_HRIS_ROLES.includes(role as HrisRole)) {
      return null;
    }

    return {
      id: user.id as string,
      name: user.name as string,
      email: user.email as string,
      role: role as HrisRole,
      username: user.username as string | undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Require specific roles for an API route.
 * Returns a NextResponse with 401/403 if unauthorized, or null if authorized.
 */
export async function requireRole(
  allowedRoles: HrisRole[]
): Promise<{ admin: NonNullable<Awaited<ReturnType<typeof getAdminSession>>> } | NextResponse> {
  const admin = await getAdminSession();

  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized — Silakan login melalui SSO terlebih dahulu" },
      { status: 401 }
    );
  }

  if (!allowedRoles.includes(admin.role)) {
    return NextResponse.json(
      {
        success: false,
        error: `Forbidden — Role "${admin.role}" tidak memiliki akses ke fitur ini`,
      },
      { status: 403 }
    );
  }

  return { admin };
}

/**
 * Check if a role has access to a specific panel.
 */
export function canAccessPanel(
  role: HrisRole,
  panel: "dashboard" | "karyawan" | "presensi" | "cuti" | "struktur" | "payroll" | "pengaturan"
): boolean {
  switch (panel) {
    case "dashboard":
      return true;
    case "karyawan":
    case "struktur":
      return DATA_ROLES.includes(role);
    case "presensi":
    case "cuti":
      return APPROVER_ROLES.includes(role) || DATA_ROLES.includes(role);
    case "payroll":
      return PAYROLL_ROLES.includes(role);
    case "pengaturan":
      return SETTINGS_ROLES.includes(role);
    default:
      return false;
  }
}

/**
 * Get the display name for a role.
 */
export function getRoleDisplayName(role: HrisRole): string {
  const displayNames: Record<HrisRole, string> = {
    [HRIS_ROLES.SUPER_ADMIN]: "Super Admin SDM",
    [HRIS_ROLES.ADMIN_DATA]: "Admin Data SDM",
    [HRIS_ROLES.ADMIN_PAYROLL]: "Admin Payroll SDM",
    [HRIS_ROLES.APPROVER]: "Approver SDM",
  };
  return displayNames[role] || role;
}
