import { db } from "@/db";
import {
  employees,
  payrollRuns,
  payrollRunSteps,
  payslips,
  payrollApprovals,
} from "@/db/schema";
import { calculateEmployeePayroll } from "./payroll-calculator";
import { eq } from "drizzle-orm";

export interface PayrollRunExecutionResult {
  payrollRunId: string;
  period: string;
  eligibleCount: number;
  totalGross: number;
  totalNet: number;
  stepsCompleted: string[];
}

export async function processPayrollRun(
  period: string,
  cutoffDate: string,
  disburseTargetDate: string
): Promise<PayrollRunExecutionResult> {
  // 1. Fetch active employees
  const activeEmployees = await db
    .select()
    .from(employees)
    .where(eq(employees.status, "aktif"));

  const eligibleCount = activeEmployees.length;

  // 2. Create Payroll Run Record
  const [run] = await db
    .insert(payrollRuns)
    .values({
      period,
      cutoffDate,
      disburseTargetDate,
      status: "berjalan",
      eligibleEmployeeCount: eligibleCount,
      totalGross: 0,
      totalNet: 0,
    })
    .returning();

  let totalGross = 0;
  let totalNet = 0;

  // 3. Process Steps 1 - 3 (Persiapan, Absensi, Kalkulasi)
  const steps = [
    "persiapan_data",
    "validasi_absensi_bkd",
    "kalkulasi",
    "persetujuan",
    "disburse_slip",
  ] as const;

  for (const stepName of steps) {
    const stepStatus = stepName === "persetujuan" ? "berjalan" : "selesai";
    await db.insert(payrollRunSteps).values({
      payrollRunId: run!.id,
      stepName,
      status: stepStatus,
      completedAt: stepName === "persetujuan" ? null : new Date(),
    });
  }

  // 4. Calculate individual payslips
  for (const emp of activeEmployees) {
    const baseSal = Number(emp.baseSalary || 0);
    const summary = calculateEmployeePayroll({
      baseSalary: baseSal,
      functionalAllowance: emp.employeeType === "dosen" ? 2000000 : 1000000,
      ptkpStatus: emp.ptkpStatus || "TK/0",
      hasNpwp: !!emp.npwp,
    });

    totalGross += summary.grossSalary;
    totalNet += summary.netSalary;

    await db.insert(payslips).values({
      payrollRunId: run!.id,
      employeeId: emp.id,
      grossSalary: summary.grossSalary,
      pph21Amount: summary.pph21.pph21Amount,
      bpjsKesehatanAmount: summary.bpjs.bpjsKesehatan,
      bpjsKetenagakerjaanAmount: summary.bpjs.bpjsKetenagakerjaan,
      totalDeductions: summary.totalDeductions,
      netSalary: summary.netSalary,
      status: "draft",
    });
  }

  // 5. Update Run Totals
  await db
    .update(payrollRuns)
    .set({
      totalGross,
      totalNet,
    })
    .where(eq(payrollRuns.id, run!.id));

  // 6. Init Approvals
  const roles = ["admin_payroll", "kabag_sdm", "warek_2"] as const;
  for (const r of roles) {
    await db.insert(payrollApprovals).values({
      payrollRunId: run!.id,
      approverRole: r,
      approverName: r === "admin_payroll" ? "Admin Payroll SDM" : r === "kabag_sdm" ? "Kabag SDM" : "Wakil Rektor II",
      status: r === "admin_payroll" ? "approved" : "pending",
    });
  }

  return {
    payrollRunId: run!.id,
    period,
    eligibleCount,
    totalGross,
    totalNet,
    stepsCompleted: ["persiapan_data", "validasi_absensi_bkd", "kalkulasi"],
  };
}
