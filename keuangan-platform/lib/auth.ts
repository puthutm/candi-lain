import type { Session } from "next-auth";

/**
 * Role spesifik Modul Keuangan UNSIA
 * Berdasarkan BRD-Keuangan-UNSIA.md §5 Stakeholder/Aktor
 */
export type AppRole =
  | "super_admin"
  | "kepala_biro_keuangan"
  | "staf_penerimaan"
  | "staf_pengeluaran"
  | "staf_akuntansi"
  | "mahasiswa"
  | "user";

export type AppPermission =
  // Treasury & Dashboard
  | "dashboard.view"
  | "treasury.view"
  | "treasury.transfer"
  | "bank.reconcile"
  // Master Tarif
  | "tariff.view"
  | "tariff.create"
  | "tariff.edit"
  | "tariff.approve_yayasan"
  // Penerimaan Mahasiswa
  | "invoice.view"
  | "invoice.create"
  | "invoice.resync_pg"
  | "payment.verify_manual"
  // Beasiswa & Keringanan
  | "scholarship.view"
  | "scholarship.create"
  | "installment.approve"
  // Pengeluaran
  | "expenditure.po.view"
  | "expenditure.po.create"
  | "expenditure.po.approve_kepala_biro"
  | "expenditure.po.approve_wr2"
  | "expenditure.po.approve_rektor"
  | "expenditure.payroll.disburse"
  | "expenditure.honor.create"
  | "expenditure.referral.disburse"
  // Pajak
  | "tax.view"
  | "tax.generate_bupot"
  | "tax.report"
  // Akuntansi
  | "accounting.coa.view"
  | "accounting.coa.edit"
  | "accounting.jurnal.view"
  | "accounting.jurnal.create"
  | "accounting.jurnal.approve"
  | "accounting.budget.view"
  | "accounting.budget.edit"
  // Laporan
  | "report.view"
  | "report.generate"
  // Clearance
  | "clearance.view"
  | "clearance.force_resync"
  // SKEUM (Mahasiswa)
  | "skeum.view"
  | "skeum.pay"
  | "skeum.installment_request"
  // Admin Sistem
  | "settings.view"
  | "settings.edit"
  | "audit_log.view"
  | "*";

/**
 * Mapping Role → Permissions untuk Modul Keuangan
 */
const ROLE_PERMISSIONS: Record<AppRole, AppPermission[]> = {
  super_admin: ["*"],

  kepala_biro_keuangan: [
    "dashboard.view",
    "treasury.view",
    "treasury.transfer",
    "bank.reconcile",
    "tariff.view",
    "tariff.approve_yayasan",
    "invoice.view",
    "payment.verify_manual",
    "scholarship.view",
    "scholarship.create",
    "installment.approve",
    "expenditure.po.view",
    "expenditure.po.create",
    "expenditure.po.approve_kepala_biro",
    "expenditure.payroll.disburse",
    "expenditure.honor.create",
    "expenditure.referral.disburse",
    "tax.view",
    "tax.report",
    "accounting.coa.view",
    "accounting.jurnal.view",
    "accounting.jurnal.approve",
    "accounting.budget.view",
    "report.view",
    "report.generate",
    "clearance.view",
    "clearance.force_resync",
    "settings.view",
    "settings.edit",
    "audit_log.view",
  ],

  staf_penerimaan: [
    "dashboard.view",
    "tariff.view",
    "invoice.view",
    "invoice.create",
    "invoice.resync_pg",
    "payment.verify_manual",
    "scholarship.view",
    "installment.approve",
    "clearance.view",
    "clearance.force_resync",
  ],

  staf_pengeluaran: [
    "dashboard.view",
    "expenditure.po.view",
    "expenditure.po.create",
    "expenditure.payroll.disburse",
    "expenditure.honor.create",
    "expenditure.referral.disburse",
    "tax.view",
    "tax.generate_bupot",
  ],

  staf_akuntansi: [
    "dashboard.view",
    "accounting.coa.view",
    "accounting.coa.edit",
    "accounting.jurnal.view",
    "accounting.jurnal.create",
    "accounting.budget.view",
    "accounting.budget.edit",
    "report.view",
    "report.generate",
    "tax.view",
    "tax.report",
    "bank.reconcile",
  ],

  mahasiswa: [
    "dashboard.view",
    "skeum.view",
    "skeum.pay",
    "skeum.installment_request",
  ],

  user: [
    "dashboard.view",
  ],
};

/**
 * Fallback mapping dari string role dari SSO ke AppRole
 */
function fallbackRole(role: string | undefined): AppRole {
  switch (role) {
    case "super_admin":
    case "admin":
      return "super_admin";
    case "kepala_biro_keuangan":
    case "kepala_biro":
      return "kepala_biro_keuangan";
    case "staf_penerimaan":
      return "staf_penerimaan";
    case "staf_pengeluaran":
      return "staf_pengeluaran";
    case "staf_akuntansi":
      return "staf_akuntansi";
    case "mahasiswa":
      return "mahasiswa";
    default:
      return "user";
  }
}

/**
 * Mendapatkan role dari session
 */
export function getRole(session: Session | null): AppRole {
  const role = (session?.user as any)?.role;
  return fallbackRole(role);
}

/**
 * Mendapatkan permissions berdasarkan role
 */
export function getPermissions(session: Session | null): AppPermission[] {
  const role = getRole(session);
  const perms = ROLE_PERMISSIONS[role] || [];
  if (perms.includes("*")) return ["*"];
  return perms;
}

/**
 * Cek apakah user memiliki role tertentu
 */
export function hasRole(session: Session | null, role: AppRole): boolean {
  if (!session?.user) return false;
  const currentRole = getRole(session);
  if (currentRole === "super_admin") return true;
  return (
    currentRole === role ||
    (session.user as any)?.roles?.includes?.(role) ||
    false
  );
}

/**
 * Cek apakah user memiliki permission tertentu
 */
export function hasPermission(
  session: Session | null,
  permission: AppPermission
): boolean {
  const perms = getPermissions(session);
  if (perms.includes("*")) return true;
  return perms.includes(permission);
}

/**
 * Throw error jika user tidak memiliki role yang dibutuhkan
 */
export function requireRole(session: Session | null, role: AppRole) {
  if (!hasRole(session, role)) {
    throw new Error(`Akses ditolak: dibutuhkan role ${role}`);
  }
}

/**
 * Throw error jika user tidak memiliki permission yang dibutuhkan
 */
export function requirePermission(session: Session | null, permission: AppPermission) {
  if (!hasPermission(session, permission)) {
    throw new Error(`Akses ditolak: dibutuhkan permission ${permission}`);
  }
}

/**
 * Mendapatkan daftar permission untuk role tertentu (utility)
 */
export function getPermissionsForRole(role: AppRole): AppPermission[] {
  return ROLE_PERMISSIONS[role] || [];
}
