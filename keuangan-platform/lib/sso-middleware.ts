import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * SSO Role definitions for Keuangan Platform (SKEU & SKEUM).
 */
export const KEUANGAN_ROLES = {
  KEPALA_BIRO: "kepala_biro",
  STAF_PENERIMAAN: "staf_penerimaan",
  STAF_PENGELUARAN: "staf_pengeluaran",
  STAF_AKUNTANSI: "staf_akuntansi",
  MAHASISWA: "mahasiswa",
} as const;

export type KeuanganRole = (typeof KEUANGAN_ROLES)[keyof typeof KEUANGAN_ROLES];

export const ALL_KEUANGAN_ADMIN_ROLES: KeuanganRole[] = [
  KEUANGAN_ROLES.KEPALA_BIRO,
  KEUANGAN_ROLES.STAF_PENERIMAAN,
  KEUANGAN_ROLES.STAF_PENGELUARAN,
  KEUANGAN_ROLES.STAF_AKUNTANSI,
];

export async function getAdminSession() {
  try {
    const session = await auth();
    if (!session?.user) return null;

    const user = session.user as any;
    const role = user.role as string;

    if (!role || !ALL_KEUANGAN_ADMIN_ROLES.includes(role as KeuanganRole)) {
      return null;
    }

    return {
      id: user.id as string,
      name: user.name as string,
      email: user.email as string,
      role: role as KeuanganRole,
      username: user.username as string | undefined,
    };
  } catch {
    return null;
  }
}

export async function requireRole(
  allowedRoles: KeuanganRole[]
): Promise<{ admin: NonNullable<Awaited<ReturnType<typeof getAdminSession>>> } | NextResponse> {
  const admin = await getAdminSession();

  if (!admin) {
    return NextResponse.json(
      { success: false, error: "Unauthorized — Silakan login melalui SSO Keuangan" },
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

export function getRoleDisplayName(role: KeuanganRole): string {
  const displayNames: Record<KeuanganRole, string> = {
    [KEUANGAN_ROLES.KEPALA_BIRO]: "Kepala Biro Keuangan",
    [KEUANGAN_ROLES.STAF_PENERIMAAN]: "Staf Penerimaan UKT/SPP",
    [KEUANGAN_ROLES.STAF_PENGELUARAN]: "Staf Pengeluaran & Payroll",
    [KEUANGAN_ROLES.STAF_AKUNTANSI]: "Staf Akuntansi & Jurnal",
    [KEUANGAN_ROLES.MAHASISWA]: "Mahasiswa",
  };
  return displayNames[role] || role;
}
