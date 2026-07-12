import { NextResponse } from "next/server";
import { db } from "@/db";
import { lmsClasses, classEnrollments } from "@/db/schema/classes";
import { eq } from "drizzle-orm";

const SIAKAD_BASE_URL = process.env.SIAKAD_BASE_URL || "http://localhost:3003";

type SiakadPeriod = {
  id: string;
  name: string;
  status: string;
};

type SiakadClass = {
  id: string;
  className: string;
  dosenUtamaId?: string | null;
  courseCode: string;
  courseName: string;
  sks: number;
};

type SiakadKrsItem = {
  krsItemId: string;
  classId: string;
  studentId: string;
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function POST() {
  try {
    // Fetch data from SIAKAD via API (decoupled microservice integration)
    const periods = await fetchJson<SiakadPeriod[]>(`${SIAKAD_BASE_URL}/api/integration/periods`);
    const activePeriod = periods.find((p) => p.status === "berjalan") || periods[0];

    if (!activePeriod) {
      throw new Error("Active academic period not found in SIAKAD");
    }

    const classesList = await fetchJson<SiakadClass[]>(
      `${SIAKAD_BASE_URL}/api/integration/classes?academicPeriodId=${activePeriod.id}`
    );

    const krsItemsList = await fetchJson<SiakadKrsItem[]>(
      `${SIAKAD_BASE_URL}/api/integration/krs-items?academicPeriodId=${activePeriod.id}&status=disetujui_pa`
    );

    const result = await db.transaction(async (tx) => {
      const syncedClasses: { siakadClassId: string; lmsClassId: string }[] = [];

      // Upsert classes
      for (const cls of classesList) {
        const existingLmsClass = await tx
          .select()
          .from(lmsClasses)
          .where(eq(lmsClasses.siakadClassId, cls.id))
          .limit(1);

        let lmsClassId: string;
        if (existingLmsClass.length > 0) {
          lmsClassId = existingLmsClass[0]!.id;
          await tx
            .update(lmsClasses)
            .set({
              courseCode: cls.courseCode,
              courseName: cls.courseName,
              sks: cls.sks,
              scheduleText: `Sesi ${cls.className}`,
              academicPeriodLabel: activePeriod.name,
              dosenUserId: cls.dosenUtamaId || "00000000-0000-0000-0000-000000000000",
              lastSyncedAt: new Date(),
            })
            .where(eq(lmsClasses.id, lmsClassId));
        } else {
          const [inserted] = await tx
            .insert(lmsClasses)
            .values({
              classType: "akademik",
              siakadClassId: cls.id,
              courseCode: cls.courseCode,
              courseName: cls.courseName,
              sks: cls.sks,
              academicPeriodLabel: activePeriod.name,
              scheduleText: `Sesi ${cls.className}`,
              learningMode: "async",
              dosenUserId: cls.dosenUtamaId || "00000000-0000-0000-0000-000000000000",
              lastSyncedAt: new Date(),
            })
            .returning();
          lmsClassId = inserted!.id;
        }

        syncedClasses.push({ siakadClassId: cls.id, lmsClassId });
      }

      // Upsert enrollments
      let enrollmentCount = 0;
      for (const item of krsItemsList) {
        const targetLmsClass = syncedClasses.find((sc) => sc.siakadClassId === item.classId);
        if (!targetLmsClass) continue;

        const existingEnrollment = await tx
          .select()
          .from(classEnrollments)
          .where(eq(classEnrollments.classId, targetLmsClass.lmsClassId))
          .limit(1000);

        const exists = existingEnrollment.some((e) => e.userId === item.studentId);
        if (!exists) {
          await tx.insert(classEnrollments).values({
            classId: targetLmsClass.lmsClassId,
            userId: item.studentId,
            role: "mahasiswa",
            krsItemRef: item.krsItemId,
          });
          enrollmentCount++;
        }
      }

      return { classesCount: syncedClasses.length, enrollmentCount };
    });

    return NextResponse.json({
      success: true,
      message: "Sinkronisasi SIAKAD berhasil dijalankan!",
      result,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
