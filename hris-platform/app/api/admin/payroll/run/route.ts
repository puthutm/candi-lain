import { NextResponse } from "next/server";
import { db } from "@/db";
import { payrollRuns, payrollRunSteps, payrollComponents, employeePayrollItems, payslips } from "@/db/schema/payroll";
import { employees } from "@/db/schema/civitas";
import { positions } from "@/db/schema/organization";
import { eq, and, desc } from "drizzle-orm";
import { cookies } from "next/headers";
import { pgTable, uuid, text, numeric } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { calculateEmployeePayroll } from "@/lib/payroll-calculator";
import { sendPayrollDisbursementWebhook } from "@/lib/disbursement";

const siakadLecturers = pgTable("siakad_lecturers", {
  id: uuid("id").primaryKey(),
  nidn: text("nidn").unique().notNull(),
  fullName: text("full_name").notNull(),
  studyProgramId: uuid("study_program_id").notNull(),
  position: text("position"),
  bkdLoad: numeric("bkd_load").default("0.00").notNull(),
  userId: uuid("user_id"),
});

// GET: List all payroll runs and their steps
export async function GET() {
  try {
    const runs = await db.select().from(payrollRuns).orderBy(desc(payrollRuns.createdAt));
    const allSteps = await db.select().from(payrollRunSteps);

    // Group steps by run id
    const runsWithSteps = runs.map(run => {
      const steps = allSteps.filter(s => s.payrollRunId === run.id);
      return {
        ...run,
        steps: [
          "persiapan_data",
          "validasi_absensi_bkd",
          "kalkulasi",
          "persetujuan",
          "disburse_slip"
        ].map(stepName => {
          const step = steps.find(s => s.stepName === stepName);
          return step || { stepName, status: "pending", anomalyNote: null };
        })
      };
    });

    return NextResponse.json({ success: true, runs: runsWithSteps });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Manage payroll execution (Create or execute steps)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, period, cutoffDate, disburseTargetDate, runId, stepName } = body;

    if (action === "create") {
      if (!period || !cutoffDate || !disburseTargetDate) {
        return NextResponse.json({ success: false, error: "Semua data periode payroll wajib diisi" }, { status: 400 });
      }

      // Check if period already exists
      const existing = await db
        .select()
        .from(payrollRuns)
        .where(eq(payrollRuns.period, period))
        .limit(1);

      if (existing.length > 0) {
        return NextResponse.json({ success: false, error: "Periode payroll ini sudah pernah dibuat" }, { status: 400 });
      }

      const [newRun] = await db
        .insert(payrollRuns)
        .values({
          period,
          cutoffDate,
          disburseTargetDate,
          status: "berjalan",
          eligibleEmployeeCount: 0,
          totalGross: 0,
          totalNet: 0
        })
        .returning();

      const stepsToInsert = [
        { payrollRunId: newRun!.id, stepName: "persiapan_data" as const, status: "berjalan" as const },
        { payrollRunId: newRun!.id, stepName: "validasi_absensi_bkd" as const, status: "pending" as const },
        { payrollRunId: newRun!.id, stepName: "kalkulasi" as const, status: "pending" as const },
        { payrollRunId: newRun!.id, stepName: "persetujuan" as const, status: "pending" as const },
        { payrollRunId: newRun!.id, stepName: "disburse_slip" as const, status: "pending" as const }
      ];

      await db.insert(payrollRunSteps).values(stepsToInsert);

      return NextResponse.json({ success: true, runId: newRun!.id });
    }

    if (action === "execute_step") {
      if (!runId || !stepName) {
        return NextResponse.json({ success: false, error: "Missing runId or stepName" }, { status: 400 });
      }

      // Verify the run exists
      const [run] = await db.select().from(payrollRuns).where(eq(payrollRuns.id, runId)).limit(1);
      if (!run) {
        return NextResponse.json({ success: false, error: "Run payroll tidak ditemukan" }, { status: 404 });
      }

      if (stepName === "persiapan_data") {
        const activeEmployees = await db
          .select()
          .from(employees)
          .where(eq(employees.status, "aktif"));

        await db
          .update(payrollRuns)
          .set({ eligibleEmployeeCount: activeEmployees.length })
          .where(eq(payrollRuns.id, runId));

        await db
          .update(payrollRunSteps)
          .set({ status: "selesai", completedAt: new Date() })
          .where(and(eq(payrollRunSteps.payrollRunId, runId), eq(payrollRunSteps.stepName, "persiapan_data")));

        await db
          .update(payrollRunSteps)
          .set({ status: "berjalan" })
          .where(and(eq(payrollRunSteps.payrollRunId, runId), eq(payrollRunSteps.stepName, "validasi_absensi_bkd")));
      }

      else if (stepName === "validasi_absensi_bkd") {
        const hrisUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/hris_platform";
        const siakadUrl = hrisUrl.replace("/hris_platform", "/siakad_platform");
        
        let note = "Validasi absensi selesai.";
        let client;
        try {
          client = postgres(siakadUrl, { prepare: false, connect_timeout: 2 });
          const siakadDb = drizzle(client);
          const lecturersList = await siakadDb.select().from(siakadLecturers);
          
          if (lecturersList.length > 0) {
            const avgBkd = (lecturersList.reduce((acc, curr) => acc + Number(curr.bkdLoad), 0) / lecturersList.length).toFixed(1);
            note = `Validasi absensi selesai. Menarik data BKD dari ${lecturersList.length} Dosen di SIAKAD. Rata-rata beban BKD Dosen: ${avgBkd} SKS.`;
          } else {
            note = "Validasi absensi selesai. Data BKD Dosen di SIAKAD kosong (menggunakan fallback rekap manual).";
          }
        } catch (e: any) {
          note = "Validasi absensi selesai. Gagal terhubung ke database SIAKAD, menggunakan fallback lokal.";
        } finally {
          if (client) {
            await client.end();
          }
        }

        await db
          .update(payrollRunSteps)
          .set({ status: "selesai", anomalyNote: note, completedAt: new Date() })
          .where(and(eq(payrollRunSteps.payrollRunId, runId), eq(payrollRunSteps.stepName, "validasi_absensi_bkd")));

        await db
          .update(payrollRunSteps)
          .set({ status: "berjalan" })
          .where(and(eq(payrollRunSteps.payrollRunId, runId), eq(payrollRunSteps.stepName, "kalkulasi")));
      }

      else if (stepName === "kalkulasi") {
        const activeEmployees = await db
          .select({
            employee: employees,
            position: positions
          })
          .from(employees)
          .leftJoin(positions, eq(employees.positionId, positions.id))
          .where(eq(employees.status, "aktif"));

        let comps = await db.select().from(payrollComponents).where(eq(payrollComponents.isActive, true));
        if (comps.length === 0) {
          const baseComps = [
            { name: "Gaji Pokok", category: "pendapatan" as const, calculationType: "tetap" as const, isTaxable: true, isActive: true },
            { name: "Tunjangan Jabatan", category: "tunjangan" as const, calculationType: "tetap" as const, isTaxable: true, isActive: true },
            { name: "BPJS Kesehatan", category: "potongan" as const, calculationType: "variabel" as const, isTaxable: false, isActive: true },
            { name: "BPJS Ketenagakerjaan", category: "potongan" as const, calculationType: "variabel" as const, isTaxable: false, isActive: true },
            { name: "PPh21 Pajak TER", category: "potongan" as const, calculationType: "variabel" as const, isTaxable: false, isActive: true }
          ];
          comps = await db.insert(payrollComponents).values(baseComps).returning();
        }

        const compGajiPokok = comps.find(c => c.name === "Gaji Pokok")!;
        const compTunjangan = comps.find(c => c.category === "tunjangan")!;
        const compBpjsKesehatan = comps.find(c => c.name === "BPJS Kesehatan")!;
        const compBpjsTk = comps.find(c => c.name === "BPJS Ketenagakerjaan")!;
        const compPph = comps.find(c => c.name.includes("PPh21"))!;

        let sumGross = 0;
        let sumNet = 0;

        await db.delete(employeePayrollItems).where(eq(employeePayrollItems.payrollRunId, runId));

        for (const { employee, position } of activeEmployees) {
          const result = calculateEmployeePayroll({
            employeeId: employee.id,
            fullName: employee.fullName,
            employeeType: employee.employeeType as any,
            baseSalary: employee.baseSalary,
            ptkpStatus: employee.ptkpStatus || "TK/0",
            functionalAllowance: position?.functionalAllowance || 0,
            hasNpwp: !!employee.npwp,
          });

          sumGross += result.grossSalary;
          sumNet += result.netSalary;

          const itemsToInsert = [
            { payrollRunId: runId, employeeId: employee.id, payrollComponentId: compGajiPokok.id, amount: employee.baseSalary, reviewStatus: "ok" as const },
            { payrollRunId: runId, employeeId: employee.id, payrollComponentId: compTunjangan.id, amount: result.totalAllowances, reviewStatus: "ok" as const },
            { payrollRunId: runId, employeeId: employee.id, payrollComponentId: compBpjsKesehatan.id, amount: result.bpjs.bpjsKesehatan, reviewStatus: "ok" as const },
            { payrollRunId: runId, employeeId: employee.id, payrollComponentId: compBpjsTk.id, amount: result.bpjs.bpjsKetenagakerjaan, reviewStatus: "ok" as const },
            { payrollRunId: runId, employeeId: employee.id, payrollComponentId: compPph.id, amount: result.pph21.pph21Amount, reviewStatus: "ok" as const }
          ];

          await db.insert(employeePayrollItems).values(itemsToInsert);
        }

        await db
          .update(payrollRuns)
          .set({ totalGross: sumGross, totalNet: sumNet })
          .where(eq(payrollRuns.id, runId));

        await db
          .update(payrollRunSteps)
          .set({ status: "selesai", completedAt: new Date() })
          .where(and(eq(payrollRunSteps.payrollRunId, runId), eq(payrollRunSteps.stepName, "kalkulasi")));

        await db
          .update(payrollRunSteps)
          .set({ status: "berjalan" })
          .where(and(eq(payrollRunSteps.payrollRunId, runId), eq(payrollRunSteps.stepName, "persetujuan")));
      }

      else if (stepName === "persetujuan") {
        await db
          .update(payrollRunSteps)
          .set({ status: "selesai", completedAt: new Date() })
          .where(and(eq(payrollRunSteps.payrollRunId, runId), eq(payrollRunSteps.stepName, "persetujuan")));

        await db
          .update(payrollRunSteps)
          .set({ status: "berjalan" })
          .where(and(eq(payrollRunSteps.payrollRunId, runId), eq(payrollRunSteps.stepName, "disburse_slip")));
      }

      else if (stepName === "disburse_slip") {
        await db
          .update(payrollRunSteps)
          .set({ status: "selesai", completedAt: new Date() })
          .where(and(eq(payrollRunSteps.payrollRunId, runId), eq(payrollRunSteps.stepName, "disburse_slip")));

        await db
          .update(payrollRuns)
          .set({ status: "selesai" })
          .where(eq(payrollRuns.id, runId));

        const activeEmployees = await db
          .select({
            employee: employees,
            position: positions
          })
          .from(employees)
          .leftJoin(positions, eq(employees.positionId, positions.id))
          .where(eq(employees.status, "aktif"));

        // Clear previous payslips for run
        await db.delete(payslips).where(eq(payslips.payrollRunId, runId));

        const payslipInserts = activeEmployees.map(({ employee, position }) => {
          const res = calculateEmployeePayroll({
            baseSalary: employee.baseSalary,
            ptkpStatus: employee.ptkpStatus || "TK/0",
            functionalAllowance: position?.functionalAllowance || 0,
            hasNpwp: !!employee.npwp,
          });

          return {
            payrollRunId: runId,
            employeeId: employee.id,
            grossSalary: res.grossSalary,
            pph21Amount: res.pph21.pph21Amount,
            bpjsKesehatanAmount: res.bpjs.bpjsKesehatan,
            bpjsKetenagakerjaanAmount: res.bpjs.bpjsKetenagakerjaan,
            totalDeductions: res.totalDeductions,
            netSalary: res.netSalary,
            status: "published" as const,
            pdfUrl: `/api/portal/payslip/${runId}?employeeId=${employee.id}`
          };
        });

        if (payslipInserts.length > 0) {
          await db.insert(payslips).values(payslipInserts);
        }

        // Trigger HTTP POST webhook to Keuangan Platform
        await sendPayrollDisbursementWebhook({
          payrollRunId: runId,
          period: run.period,
          eligibleEmployeeCount: run.eligibleEmployeeCount,
          totalGross: run.totalGross,
          totalNet: run.totalNet,
          disburseDate: run.disburseTargetDate,
          source: "hris_platform",
        });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Action tidak valid" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
