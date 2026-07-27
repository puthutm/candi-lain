import { NextResponse } from "next/server";
import { db } from "@/db";
import { payslips, payrollRuns, employeePayrollItems, payrollComponents } from "@/db/schema/payroll";
import { employees } from "@/db/schema/civitas";
import { organizationUnits, positions } from "@/db/schema/organization";
import { eq, and } from "drizzle-orm";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: runId } = await params;
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");

    if (!runId || !employeeId) {
      return NextResponse.json({ success: false, error: "Run ID dan Employee ID wajib diberikan" }, { status: 400 });
    }

    const [payslipRecord] = await db
      .select({
        payslip: payslips,
        run: payrollRuns,
        employee: employees,
        unit: organizationUnits.name,
        position: positions.name,
      })
      .from(payslips)
      .leftJoin(payrollRuns, eq(payslips.payrollRunId, payrollRuns.id))
      .leftJoin(employees, eq(payslips.employeeId, employees.id))
      .leftJoin(organizationUnits, eq(employees.organizationUnitId, organizationUnits.id))
      .leftJoin(positions, eq(employees.positionId, positions.id))
      .where(and(eq(payslips.payrollRunId, runId), eq(payslips.employeeId, employeeId)))
      .limit(1);

    if (!payslipRecord) {
      return NextResponse.json({ success: false, error: "Slip gaji tidak ditemukan" }, { status: 404 });
    }

    const items = await db
      .select({
        componentName: payrollComponents.name,
        category: payrollComponents.category,
        amount: employeePayrollItems.amount,
      })
      .from(employeePayrollItems)
      .leftJoin(payrollComponents, eq(employeePayrollItems.payrollComponentId, payrollComponents.id))
      .where(and(eq(employeePayrollItems.payrollRunId, runId), eq(employeePayrollItems.employeeId, employeeId)));

    return NextResponse.json({
      success: true,
      data: {
        id: payslipRecord.payslip.id,
        period: payslipRecord.run?.period,
        cutoffDate: payslipRecord.run?.cutoffDate,
        employeeNumber: payslipRecord.employee?.employeeNumber,
        fullName: payslipRecord.employee?.fullName,
        employeeType: payslipRecord.employee?.employeeType,
        ptkpStatus: payslipRecord.employee?.ptkpStatus,
        npwp: payslipRecord.employee?.npwp || "-",
        unitName: payslipRecord.unit || "Biro Umum",
        positionName: payslipRecord.position || "Staff",
        bankName: payslipRecord.employee?.bankName,
        bankAccountNumber: payslipRecord.employee?.bankAccountNumber,
        grossSalary: payslipRecord.payslip.grossSalary,
        pph21Amount: payslipRecord.payslip.pph21Amount,
        bpjsKesehatanAmount: payslipRecord.payslip.bpjsKesehatanAmount,
        bpjsKetenagakerjaanAmount: payslipRecord.payslip.bpjsKetenagakerjaanAmount,
        totalDeductions: payslipRecord.payslip.totalDeductions,
        netSalary: payslipRecord.payslip.netSalary,
        status: payslipRecord.payslip.status,
        generatedAt: payslipRecord.payslip.generatedAt,
        items,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
