import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * SSO Role definitions for Admin PMB application.
 * These roles are assigned via SSO Platform's dynamic role system.
 */
export const PMB_ROLES = {
  SUPER_ADMIN: "super_admin_pmb",
  VERIFIKATOR: "verifikator_berkas",
  STAFF_KEUANGAN: "staff_keuangan",
  STAFF_MARKETING: "staff_marketing",
  ADMIN: "admin",
  SUPERADMIN: "superadmin",
  SUPER_ADMIN_GENERIC: "super_admin",
  ADMIN_PMB: "admin_pmb",
} as const;

export type PmbRole = (typeof PMB_ROLES)[keyof typeof PMB_ROLES];

/**
 * All available admin roles for PMB.
 */
export const ALL_PMB_ROLES: PmbRole[] = Object.values(PMB_ROLES);

const ALL_SUPER_ROLES: PmbRole[] = [
  PMB_ROLES.SUPER_ADMIN,
  PMB_ROLES.ADMIN,
  PMB_ROLES.SUPERADMIN,
  PMB_ROLES.SUPER_ADMIN_GENERIC,
  PMB_ROLES.ADMIN_PMB,
];

/**
 * Roles that have access to all panels.
 */
export const FULL_ACCESS_ROLES: PmbRole[] = ALL_SUPER_ROLES;

/**
 * Roles that can access verification panel.
 */
export const VERIFICATION_ROLES: PmbRole[] = [
  ...ALL_SUPER_ROLES,
  PMB_ROLES.VERIFIKATOR,
];

/**
 * Roles that can access payment panel.
 */
export const PAYMENT_ROLES: PmbRole[] = [
  ...ALL_SUPER_ROLES,
  PMB_ROLES.STAFF_KEUANGAN,
];

/**
 * Roles that can access communication panel.
 */
export const COMMUNICATION_ROLES: PmbRole[] = [
  ...ALL_SUPER_ROLES,
  PMB_ROLES.STAFF_MARKETING,
];

/**
 * Roles that can access settings panel.
 */
export const SETTINGS_ROLES: PmbRole[] = ALL_SUPER_ROLES;

/**
 * Roles that can seed mock data.
 */
export const SEED_ROLES: PmbRole[] = ALL_SUPER_ROLES;

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

    // Check if user has a valid PMB admin role
    if (!role || !ALL_PMB_ROLES.includes(role as PmbRole)) {
      return null;
    }

    return {
      id: user.id as string,
      name: user.name as string,
      email: user.email as string,
      role: role as PmbRole,
      username: user.username as string | undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Get the staff ID from the current session.
 * Returns null if not authenticated.
 */
export async function getStaffId(): Promise<string | null> {
  const admin = await getAdminSession();
  return admin?.id || null;
}

/**
 * Require specific roles for an API route.
 * Returns a NextResponse with 401/403 if unauthorized, or null if authorized.
 */
export async function requireRole(
  allowedRoles: PmbRole[]
): Promise<{ admin: NonNullable<Awaited<ReturnType<typeof getAdminSession>>> } | NextResponse> {
  const admin = await getAdminSession();

  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized - Silakan login terlebih dahulu" },
      { status: 401 }
    );
  }

  if (!allowedRoles.includes(admin.role)) {
    return NextResponse.json(
      {
        success: false,
        error: `Forbidden - Role "${admin.role}" tidak memiliki akses ke resource ini`,
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
  role: PmbRole,
  panel: "dashboard" | "monitoring" | "pendaftar" | "verifikasi" | "pembayaran" | "komunikasi" | "gelombang" | "pengaturan"
): boolean {
  switch (panel) {
    case "dashboard":
    case "monitoring":
    case "pendaftar":
    case "gelombang":
      return FULL_ACCESS_ROLES.includes(role);
    case "verifikasi":
      return VERIFICATION_ROLES.includes(role);
    case "pembayaran":
      return PAYMENT_ROLES.includes(role);
    case "komunikasi":
      return COMMUNICATION_ROLES.includes(role);
    case "pengaturan":
      return SETTINGS_ROLES.includes(role);
    default:
      return false;
  }
}

/**
 * Get the list of panels accessible by a role.
 */
export function getAccessiblePanels(role: PmbRole): string[] {
  const allPanels = [
    "dashboard",
    "monitoring",
    "pendaftar",
    "verifikasi",
    "pembayaran",
    "komunikasi",
    "gelombang",
    "pengaturan",
  ] as const;

  return allPanels.filter((panel) => canAccessPanel(role, panel));
}

/**
 * Get the display name for a role.
 */
export function getRoleDisplayName(role: PmbRole): string {
  const displayNames: Partial<Record<PmbRole, string>> = {
    [PMB_ROLES.SUPER_ADMIN]: "Super Admin PMB",
    [PMB_ROLES.VERIFIKATOR]: "Verifikator Berkas",
    [PMB_ROLES.STAFF_KEUANGAN]: "Staff Keuangan",
    [PMB_ROLES.STAFF_MARKETING]: "Staff Marketing",
    [PMB_ROLES.ADMIN]: "Admin",
    [PMB_ROLES.SUPERADMIN]: "Superadmin",
    [PMB_ROLES.SUPER_ADMIN_GENERIC]: "Super Admin",
    [PMB_ROLES.ADMIN_PMB]: "Admin PMB",
  };
  return displayNames[role] || role;
}
