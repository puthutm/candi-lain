import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbApplicants, pmbApplicantDocuments, pmbApplicantStatusHistory } from "@/db/schema/applicants";
import { pmbWaves, pmbEntryPaths, pmbStudyPrograms, pmbQuotas } from "@/db/schema/master";
import { eq, desc, sql, and } from "drizzle-orm";
import { ensurePmbSeeded } from "@/db/seed";

import { cookies } from "next/headers";

// List all applicants
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("pmb_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const sessionUser = JSON.parse(sessionCookie.value);
    if (sessionUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await ensurePmbSeeded();
    const list = await db
      .select({
        id: pmbApplicants.id,
        registrationNumber: pmbApplicants.registrationNumber,
        fullName: pmbApplicants.fullName,
        email: pmbApplicants.email,
        phone: pmbApplicants.phone,
        currentStage: pmbApplicants.currentStage,
        paymentStatus: pmbApplicants.paymentStatus,
        createdAt: pmbApplicants.createdAt,
        wave: pmbWaves.name,
        entryPath: pmbEntryPaths.name,
        entryPathFee: pmbEntryPaths.formFee,
        studyProgram: pmbStudyPrograms.name,
        docsCount: sql<number>`count(${pmbApplicantDocuments.id})::int`,
      })
      .from(pmbApplicants)
      .leftJoin(pmbWaves, eq(pmbApplicants.waveId, pmbWaves.id))
      .leftJoin(pmbEntryPaths, eq(pmbApplicants.entryPathId, pmbEntryPaths.id))
      .leftJoin(pmbStudyPrograms, eq(pmbApplicants.studyProgramId, pmbStudyPrograms.id))
      .leftJoin(pmbApplicantDocuments, eq(pmbApplicants.id, pmbApplicantDocuments.applicantId))
      .groupBy(
        pmbApplicants.id,
        pmbWaves.name,
        pmbEntryPaths.name,
        pmbEntryPaths.formFee,
        pmbStudyPrograms.name
      )
      .orderBy(desc(pmbApplicants.createdAt));

    return NextResponse.json({ success: true, applicants: list });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Register a new applicant
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, email, phone, waveId, entryPathId, studyProgramId, password } = body;

    if (!fullName || !email || !phone || !waveId || !entryPathId || !studyProgramId) {
      return NextResponse.json({ success: false, error: "Semua kolom wajib diisi" }, { status: 400 });
    }

    const result = await db.transaction(async (tx) => {
      // 1. Lock and get Wave & Entry Path info
      const wave = await tx
        .select()
        .from(pmbWaves)
        .where(eq(pmbWaves.id, waveId))
        .limit(1);

      const entryPath = await tx
        .select()
        .from(pmbEntryPaths)
        .where(eq(pmbEntryPaths.id, entryPathId))
        .limit(1);

      const activeWave = wave[0];
      const activePath = entryPath[0];

      if (!activeWave || !activePath) {
        throw new Error("Gelombang atau Jalur Masuk tidak valid");
      }

      // 2. Lock & Check Quota (SELECT ... FOR UPDATE equivalent)
      const quotas = await tx
        .select()
        .from(pmbQuotas)
        .where(and(eq(pmbQuotas.waveId, waveId), eq(pmbQuotas.studyProgramId, studyProgramId)))
        .for("update");

      if (quotas.length > 0) {
        const q = quotas[0];
        if (q) {
          if (q.quotaFilled >= q.quotaTotal) {
            throw new Error("Kuota prodi ini di gelombang ini sudah penuh");
          }

          // Atomic increment of quota filled count
          await tx
            .update(pmbQuotas)
            .set({ quotaFilled: q.quotaFilled + 1 })
            .where(eq(pmbQuotas.id, q.id));
        }
      }

      // 3. Generate Unique registrationNumber with concurrency safe checking
      const tahun = new Date(activeWave.startDate).getFullYear();
      const waveCode = activeWave.code;
      const pathCode = activePath.code;

      const countResult = await tx
        .select({ count: sql<number>`count(${pmbApplicants.id})::int` })
        .from(pmbApplicants)
        .where(eq(pmbApplicants.waveId, waveId));

      let urutan = (countResult[0]?.count || 0) + 1;
      let regNum = "";
      let isDuplicate = true;
      let retryCount = 0;

      while (isDuplicate && retryCount < 3) {
        regNum = `${tahun}-${waveCode}-${pathCode}-${String(urutan).padStart(4, "0")}`;
        const existing = await tx
          .select()
          .from(pmbApplicants)
          .where(eq(pmbApplicants.registrationNumber, regNum))
          .limit(1);

        if (existing.length === 0) {
          isDuplicate = false;
        } else {
          urutan++;
          retryCount++;
        }
      }

      if (isDuplicate) {
        throw new Error("Gagal generate nomor pendaftaran yang unik. Silakan coba lagi.");
      }

      // 4. Create new applicant
      const [newApplicant] = await tx
        .insert(pmbApplicants)
        .values({
          registrationNumber: regNum,
          fullName,
          email,
          phone,
          passwordHash: password || "placeholder_hash",
          waveId,
          entryPathId,
          studyProgramId,
          currentStage: "pendaftar",
          paymentStatus: "belum_bayar",
        })
        .returning();

      if (!newApplicant) {
        throw new Error("Gagal membuat applicant");
      }

      // 5. Log Initial transition to history
      await tx
        .insert(pmbApplicantStatusHistory)
        .values({
          applicantId: newApplicant.id,
          fromStage: "peminat",
          toStage: "pendaftar",
          note: "Registrasi awal kandidat berhasil",
        });

      return newApplicant;
    });

    return NextResponse.json({
      success: true,
      message: "Registrasi berhasil!",
      applicant: result,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
