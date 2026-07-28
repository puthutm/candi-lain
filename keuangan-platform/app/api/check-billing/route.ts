import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nim = searchParams.get("nim") || "26090182";

    return NextResponse.json({
      success: true,
      nim,
      isPaid: true,
      amountPaid: 4500000,
      billingStatus: "Lunas",
      academicYear: "2026/2027 Ganjil",
      message: "Mahasiswa berhak mengisi KRS dan mengikuti perkuliahan SIAKAD.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
