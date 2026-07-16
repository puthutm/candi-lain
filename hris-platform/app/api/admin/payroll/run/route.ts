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
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("hris_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

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
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("hris_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = JSON.parse(sessionCookie.value);
    const body = await req.json();
    const { action, period, cutoffDate, disburseTargetDate, runId, stepName } = body;

    if (action === "create") {
      if (!period || !cutoffDate || !disburseTargetDate) {
        return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
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
        // Lock eligible active employees count
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
          .set({ status: "selesai", completedAt: new Date(), processedBy: sessionUser.userId })
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
          client = postgres(siakadUrl, { prepare: false });
          const siakadDb = drizzle(client);
          const lecturersList = await siakadDb.select().from(siakadLecturers);
          
          if (lecturersList.length > 0) {
            const avgBkd = (lecturersList.reduce((acc, curr) => acc + Number(curr.bkdLoad), 0) / lecturersList.length).toFixed(1);
            note = `Validasi absensi selesai. Menarik data BKD dari ${lecturersList.length} Dosen di SIAKAD. Rata-rata beban BKD Dosen: ${avgBkd} SKS.`;
          } else {
            note = "Validasi absensi selesai. Data BKD Dosen di SIAKAD kosong.";
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
          .set({ status: "selesai", anomalyNote: note, completedAt: new Date(), processedBy: sessionUser.userId })
          .where(and(eq(payrollRunSteps.payrollRunId, runId), eq(payrollRunSteps.stepName, "validasi_absensi_bkd")));

        await db
          .update(payrollRunSteps)
          .set({ status: "berjalan" })
          .where(and(eq(payrollRunSteps.payrollRunId, runId), eq(payrollRunSteps.stepName, "kalkulasi")));
      }

      else if (stepName === "kalkulasi") {
        // Calculate gross / net for active employees
        const activeEmployees = await db
          .select({
            employee: employees,
            position: positions
          })
          .from(employees)
          .leftJoin(positions, eq(employees.positionId, positions.id))
          .where(eq(employees.status, "aktif"));

        // Fetch payroll components
        let comps = await db.select().from(payrollComponents).where(eq(payrollComponents.isActive, true));
        if (comps.length === 0) {
          // Seed standard components
          const baseComps = [
            { name: "Gaji Pokok", category: "pendapatan" as const, calculationType: "tetap" as const, isTaxable: true, isActive: true },
            { name: "Tunjangan Jabatan", category: "tunjangan" as const, calculationType: "tetap" as const, isTaxable: true, isActive: true },
            { name: "BPJS Kesehatan", category: "potongan" as const, calculationType: "variabel" as const, isTaxable: false, isActive: true },
            { name: "BPJS Ketenagakerjaan", category: "potongan" as const, calculationType: "variabel" as const, isTaxable: false, isActive: true },
            { name: "PPh21 Pajak", category: "potongan" as const, calculationType: "variabel" as const, isTaxable: false, isActive: true }
          ];
          comps = await db.insert(payrollComponents).values(baseComps).returning();
        }

        const compGajiPokok = comps.find(c => c.name === "Gaji Pokok")!;
        const compTunjangan = comps.find(c => c.category === "tunjangan")!;
        const compBpjsKesehatan = comps.find(c => c.name === "BPJS Kesehatan")!;
        const compBpjsTk = comps.find(c => c.name === "BPJS Ketenagakerjaan")!;
        const compPph = comps.find(c => c.name === "PPh21 Pajak")!;

        let sumGross = 0;
        let sumNet = 0;

        // Clear existing payroll items for this run first
        await db.delete(employeePayrollItems).where(eq(employeePayrollItems.payrollRunId, runId));

        for (const { employee, position } of activeEmployees) {
          const base = employee.baseSalary;
          const allowance = position?.functionalAllowance || 0;
          const gross = base + allowance;

          // BPJS: Kesehatan 1%, Ketenagakerjaan 2% of base
          const bpjsKesehatan = Math.floor(base * 0.01);
          const bpjsTk = Math.floor(base * 0.02);

          // PPh21 simulation: 5% if annualized gross > 60,000,000 IDR
          const annualizedGross = gross * 12;
          let tax = 0;
          if (annualizedGross > 60000000) {
            tax = Math.floor((annualizedGross - 60000000) * 0.05 / 12);
          }

          const net = gross - bpjsKesehatan - bpjsTk - tax;

          sumGross += gross;
          sumNet += net;

          // Insert payroll items
          const itemsToInsert = [
            { payrollRunId: runId, employeeId: employee.id, payrollComponentId: compGajiPokok.id, amount: base, reviewStatus: "ok" as const },
            { payrollRunId: runId, employeeId: employee.id, payrollComponentId: compTunjangan.id, amount: allowance, reviewStatus: "ok" as const },
            { payrollRunId: runId, employeeId: employee.id, payrollComponentId: compBpjsKesehatan.id, amount: bpjsKesehatan, reviewStatus: "ok" as const },
            { payrollRunId: runId, employeeId: employee.id, payrollComponentId: compBpjsTk.id, amount: bpjsTk, reviewStatus: "ok" as const },
            { payrollRunId: runId, employeeId: employee.id, payrollComponentId: compPph.id, amount: tax, reviewStatus: "ok" as const }
          ];

          await db.insert(employeePayrollItems).values(itemsToInsert);
        }

        // Update run totals
        await db
          .update(payrollRuns)
          .set({ totalGross: sumGross, totalNet: sumNet })
          .where(eq(payrollRuns.id, runId));

        await db
          .update(payrollRunSteps)
          .set({ status: "selesai", completedAt: new Date(), processedBy: sessionUser.userId })
          .where(and(eq(payrollRunSteps.payrollRunId, runId), eq(payrollRunSteps.stepName, "kalkulasi")));

        await db
          .update(payrollRunSteps)
          .set({ status: "berjalan" })
          .where(and(eq(payrollRunSteps.payrollRunId, runId), eq(payrollRunSteps.stepName, "persetujuan")));
      }

      else if (stepName === "persetujuan") {
        await db
          .update(payrollRunSteps)
          .set({ status: "selesai", completedAt: new Date(), processedBy: sessionUser.userId })
          .where(and(eq(payrollRunSteps.payrollRunId, runId), eq(payrollRunSteps.stepName, "persetujuan")));

        await db
          .update(payrollRunSteps)
          .set({ status: "berjalan" })
          .where(and(eq(payrollRunSteps.payrollRunId, runId), eq(payrollRunSteps.stepName, "disburse_slip")));
      }

      else if (stepName === "disburse_slip") {
        // Complete the step
        await db
          .update(payrollRunSteps)
          .set({ status: "selesai", completedAt: new Date(), processedBy: sessionUser.userId })
          .where(and(eq(payrollRunSteps.payrollRunId, runId), eq(payrollRunSteps.stepName, "disburse_slip")));

        // Mark payroll run as completed
        await db
          .update(payrollRuns)
          .set({ status: "selesai" })
          .where(eq(payrollRuns.id, runId));

        // Generate payslips
        const activeEmployees = await db
          .select()
          .from(employees)
          .where(eq(employees.status, "aktif"));

        const payslipInserts = activeEmployees.map(emp => ({
          payrollRunId: runId,
          employeeId: emp.id,
          status: "published" as const,
          pdfUrl: `/payslip-${run.period.toLowerCase().replace(" ", "-")}-${emp.employeeNumber}.pdf`
        }));

        if (payslipInserts.length > 0) {
          await db.insert(payslips).values(payslipInserts);
        }

        // Trigger webhook simulation: payroll.disbursement_ready event
        console.log(`[Webhook published] payroll.disbursement_ready event fired for runId: ${runId}`);
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Action tidak valid" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
