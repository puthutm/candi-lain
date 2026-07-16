import { NextResponse } from "next/server";
import { db } from "@/db";
import { payslips, payrollRuns, employeePayrollItems, payrollComponents } from "@/db/schema/payroll";
import { employees } from "@/db/schema/civitas";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

// GET: Retrieve payslips
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const runId = searchParams.get("runId");

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("hris_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let query = db
      .select({
        id: payslips.id,
        pdfUrl: payslips.pdfUrl,
        status: payslips.status,
        generatedAt: payslips.generatedAt,
        payrollRunId: payslips.payrollRunId,
        period: payrollRuns.period,
        employeeName: employees.fullName,
        employeeNumber: employees.employeeNumber,
        employeeId: employees.id,
        baseSalary: employees.baseSalary,
        bankName: employees.bankName,
        bankAccountNumber: employees.bankAccountNumber
      })
      .from(payslips)
      .leftJoin(payrollRuns, eq(payslips.payrollRunId, payrollRuns.id))
      .leftJoin(employees, eq(payslips.employeeId, employees.id));

    let results = [];
    if (employeeId) {
      results = await query.where(eq(payslips.employeeId, employeeId));
    } else if (runId) {
      results = await query.where(eq(payslips.payrollRunId, runId));
    } else {
      results = await query;
    }

    // Attach items details to payslips
    const allItems = await db
      .select({
        payrollRunId: employeePayrollItems.payrollRunId,
        employeeId: employeePayrollItems.employeeId,
        amount: employeePayrollItems.amount,
        reviewStatus: employeePayrollItems.reviewStatus,
        componentName: payrollComponents.name,
        category: payrollComponents.category
      })
      .from(employeePayrollItems)
      .leftJoin(payrollComponents, eq(employeePayrollItems.payrollComponentId, payrollComponents.id));

    const enriched = results.map(slip => {
      const slipItems = allItems.filter(item => 
        item.payrollRunId === slip.payrollRunId && item.employeeId === slip.employeeId
      );
      return {
        ...slip,
        items: slipItems
      };
    });

    return NextResponse.json({ success: true, payslips: enriched });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
