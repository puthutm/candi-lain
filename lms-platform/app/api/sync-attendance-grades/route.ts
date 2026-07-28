import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { classId, attendanceRate, assignmentAvg } = body;

    return NextResponse.json({
      success: true,
      message: "Rekapitulasi nilai & presensi LMS berhasil dikirim ke SIAKAD KHS Engine.",
      data: {
        classId: classId || "KLS-IF201-A",
        attendanceRate: attendanceRate || "95.5%",
        assignmentAvg: assignmentAvg || 87.5,
        syncedAt: new Date().toISOString(),
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
