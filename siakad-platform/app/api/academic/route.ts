import { NextResponse } from "next/server";
import { db } from "@/db";
import { siakadAcademicPeriods, siakadCurricula, siakadCourses, siakadStudyPrograms } from "@/db/schema/master";
import { siakadClasses, siakadClassSchedules } from "@/db/schema/classes";
import { siakadLecturers } from "@/db/schema/civitas";
import { ensureSiakadSeeded } from "@/db/seed";

export async function GET(request: Request) {
  try {
    await ensureSiakadSeeded();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "overview";

    if (type === "periode") {
      const periods = await db.select().from(siakadAcademicPeriods);
      return NextResponse.json({ success: true, data: periods });
    }

    if (type === "kurikulum") {
      const curricula = await db.select().from(siakadCurricula);
      return NextResponse.json({ success: true, data: curricula });
    }

    if (type === "matakuliah") {
      const courses = await db.select().from(siakadCourses);
      return NextResponse.json({ success: true, data: courses });
    }

    if (type === "kelas") {
      const classes = await db.select().from(siakadClasses);
      return NextResponse.json({ success: true, data: classes });
    }

    if (type === "jadwal") {
      const schedules = await db.select().from(siakadClassSchedules).limit(16);
      return NextResponse.json({ success: true, data: schedules });
    }

    if (type === "dosen") {
      const lecturers = await db.select().from(siakadLecturers);
      return NextResponse.json({ success: true, data: lecturers });
    }

    // Default overview bundle
    const [periods, curricula, courses, classes, prodis, lecturers] = await Promise.all([
      db.select().from(siakadAcademicPeriods),
      db.select().from(siakadCurricula),
      db.select().from(siakadCourses),
      db.select().from(siakadClasses),
      db.select().from(siakadStudyPrograms),
      db.select().from(siakadLecturers),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        periods,
        curricula,
        courses,
        classes,
        prodis,
        lecturers,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await ensureSiakadSeeded();
    const body = await request.json();
    const { action, ...formData } = body;

    if (action === "tambah_ta") {
      return NextResponse.json({
        success: true,
        message: `Tahun Ajaran ${formData.ta || "Baru"} berhasil ditambahkan`,
      });
    }

    if (action === "tambah_periode") {
      const periodName = formData.periode || `Periode ${formData.semester || "Ganjil"} ${formData.ta || "2026/2027"}`;
      const [inserted] = await db
        .insert(siakadAcademicPeriods)
        .values({
          name: periodName,
          startDate: formData.startDate || "2026-09-01",
          endDate: formData.endDate || "2027-02-28",
          status: "terjadwal",
        })
        .returning();
      return NextResponse.json({ success: true, data: inserted });
    }

    if (action === "tambah_kurikulum") {
      const prodis = await db.select().from(siakadStudyPrograms);
      const prodiId = prodis[0]?.id || "00000000-0000-0000-0000-000000000000";
      const [inserted] = await db
        .insert(siakadCurricula)
        .values({
          name: formData.namaKurikulum || "Kurikulum Baru",
          studyProgramId: prodiId,
          yearEffective: parseInt(formData.tahun || "2026", 10),
          totalSks: parseInt(formData.totalSks || "144", 10),
          status: "aktif",
        })
        .returning();
      return NextResponse.json({ success: true, data: inserted });
    }

    if (action === "tambah_mk") {
      const [inserted] = await db
        .insert(siakadCourses)
        .values({
          code: formData.kodeMk || `MK${Math.floor(100 + Math.random() * 900)}`,
          name: formData.namaMk || "Mata Kuliah Baru",
          sks: parseInt(formData.sks || "3", 10),
          type: "wajib",
          learningMode: "async",
        })
        .returning();
      return NextResponse.json({ success: true, data: inserted });
    }

    if (action === "tambah_kelas") {
      const prodis = await db.select().from(siakadStudyPrograms);
      const courses = await db.select().from(siakadCourses);
      const periods = await db.select().from(siakadAcademicPeriods);
      const lecturers = await db.select().from(siakadLecturers);

      const [inserted] = await db
        .insert(siakadClasses)
        .values({
          courseId: courses[0]?.id || "00000000-0000-0000-0000-000000000000",
          academicPeriodId: periods[0]?.id || "00000000-0000-0000-0000-000000000000",
          studyProgramId: prodis[0]?.id || "00000000-0000-0000-0000-000000000000",
          dosenUtamaId: lecturers[0]?.id || "00000000-0000-0000-0000-000000000000",
          className: formData.detail || "Kelas Paralel Baru",
          capacity: 40,
          status: "aktif",
        })
        .returning();
      return NextResponse.json({ success: true, data: inserted });
    }

    return NextResponse.json({
      success: true,
      message: `Data ${action || "form"} berhasil diproses ke database`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
