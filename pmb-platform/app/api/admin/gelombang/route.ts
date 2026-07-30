import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbWaves } from "@/db/schema/master";
import { desc } from "drizzle-orm";
import { requireRole, FULL_ACCESS_ROLES } from "@/lib/sso-middleware";

export async function GET() {
  try {
    const auth = await requireRole(FULL_ACCESS_ROLES);
    if (auth instanceof NextResponse) return auth;

    const waves = await db
      .select()
      .from(pmbWaves)
      .orderBy(desc(pmbWaves.createdAt));

    return NextResponse.json({ success: true, waves });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireRole(FULL_ACCESS_ROLES);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json();
    const { name, code, academicPeriodLabel, defaultPassword, startDate, endDate, status, openedProdis } = body;

    if (!name || !code || !startDate || !endDate) {
      return NextResponse.json({ success: false, error: "Nama, kode, tanggal buka, dan tanggal tutup wajib diisi" }, { status: 400 });
    }

    const [insertedWave] = await db
      .insert(pmbWaves)
      .values({
        name,
        code,
        academicPeriodLabel: academicPeriodLabel || "2026/2027 Ganjil",
        defaultPassword: defaultPassword || "Pmb2026!",
        startDate,
        endDate,
        status: status || "belum_dibuka",
      })
      .returning();

    // Process opened prodis and create quotas for this wave
    if (Array.isArray(openedProdis) && openedProdis.length > 0 && insertedWave) {
      const { pmbQuotas, pmbStudyPrograms } = await import("@/db/schema/master");
      const { eq } = await import("drizzle-orm");

      for (const item of openedProdis) {
        const prodiName = item.prodiName || item.name || "Program Studi";
        const prodiCode = item.prodiCode || item.code || prodiName.substring(0, 4).toUpperCase();
        let targetStudyProgramId = item.studyProgramId || item.id;

        // Ensure study program exists in pmbStudyPrograms
        const existingProdis = await db.select().from(pmbStudyPrograms);
        let found = existingProdis.find((p) => p.id === targetStudyProgramId || p.name === prodiName);

        if (!found) {
          const [newProdi] = await db
            .insert(pmbStudyPrograms)
            .values({
              name: prodiName,
              code: prodiCode,
              faculty: item.faculty || "Fakultas",
              degreeLevel: item.degreeLevel || "S1",
            })
            .returning();
          if (newProdi) targetStudyProgramId = newProdi.id;
        } else {
          targetStudyProgramId = found.id;
        }

        if (targetStudyProgramId) {
          await db.insert(pmbQuotas).values({
            waveId: insertedWave.id,
            studyProgramId: targetStudyProgramId,
            quotaTotal: Number(item.quotaTotal || 50),
            quotaFilled: 0,
          });
        }
      }
    }

    return NextResponse.json({ success: true, wave: insertedWave });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireRole(FULL_ACCESS_ROLES);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json();
    const { id, name, code, academicPeriodLabel, defaultPassword, startDate, endDate, status, openedProdis } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID wajib diisi" }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (academicPeriodLabel !== undefined) updateData.academicPeriodLabel = academicPeriodLabel;
    if (defaultPassword !== undefined) updateData.defaultPassword = defaultPassword;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (endDate !== undefined) updateData.endDate = endDate;
    if (status !== undefined) updateData.status = status;

    const { eq } = await import("drizzle-orm");
    const [updated] = await db
      .update(pmbWaves)
      .set(updateData)
      .where(eq(pmbWaves.id, id))
      .returning();

    // If openedProdis supplied, sync quotas
    if (Array.isArray(openedProdis) && updated) {
      const { pmbQuotas, pmbStudyPrograms } = await import("@/db/schema/master");

      for (const item of openedProdis) {
        const prodiName = item.prodiName || item.name || "Program Studi";
        const prodiCode = item.prodiCode || item.code || prodiName.substring(0, 4).toUpperCase();
        let targetStudyProgramId = item.studyProgramId || item.id;

        const existingProdis = await db.select().from(pmbStudyPrograms);
        let found = existingProdis.find((p) => p.id === targetStudyProgramId || p.name === prodiName);

        if (!found) {
          const [newProdi] = await db
            .insert(pmbStudyPrograms)
            .values({
              name: prodiName,
              code: prodiCode,
              faculty: item.faculty || "Fakultas",
              degreeLevel: item.degreeLevel || "S1",
            })
            .returning();
          if (newProdi) targetStudyProgramId = newProdi.id;
        } else {
          targetStudyProgramId = found.id;
        }

        if (targetStudyProgramId) {
          const existingQuotas = await db
            .select()
            .from(pmbQuotas)
            .where(eq(pmbQuotas.waveId, updated.id));
          const existingQ = existingQuotas.find((q) => q.studyProgramId === targetStudyProgramId);

          if (existingQ) {
            await db
              .update(pmbQuotas)
              .set({ quotaTotal: Number(item.quotaTotal || 50) })
              .where(eq(pmbQuotas.id, existingQ.id));
          } else {
            await db.insert(pmbQuotas).values({
              waveId: updated.id,
              studyProgramId: targetStudyProgramId,
              quotaTotal: Number(item.quotaTotal || 50),
              quotaFilled: 0,
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true, wave: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
