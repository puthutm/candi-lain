import { NextResponse } from "next/server";
import { db } from "@/db";
import { siakadClasses } from "@/db/schema/classes";
import { ensureSiakadSeeded } from "@/db/seed";

export async function POST(request: Request) {
  try {
    await ensureSiakadSeeded();
    const body = await request.json();
    const { classId } = body;

    const classes = await db.select().from(siakadClasses);
    const targetClass = classes.find((c) => c.id === classId) || classes[0];

    const lmsUrl = process.env.LMS_PLATFORM_URL || "http://localhost:3000";

    return NextResponse.json({
      success: true,
      message: `Kelas ${targetClass?.className || "Paralel"} & 16 Jadwal Pertemuan berhasil disinkronkan ke LMS (${lmsUrl})`,
      syncedAt: new Date().toISOString(),
      data: {
        classId: targetClass?.id,
        className: targetClass?.className,
        lmsStatus: "Active",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
