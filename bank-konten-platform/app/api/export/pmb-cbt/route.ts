import { NextRequest, NextResponse } from "next/server";
import { generateRandomQuizPackage } from "@/lib/quiz-generator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { courseCode, totalQuestions, examRef } = body;

    const quizPackage = await generateRandomQuizPackage(
      courseCode || "TPA-101",
      totalQuestions || 10,
      "pmb",
      examRef || "PMB-CBT-EXAM"
    );

    return NextResponse.json({
      success: true,
      message: "Paket soal CBT terverifikasi berhasil dikirim ke PMB!",
      quizPackage,
    });
  } catch (error: any) {
    console.error("[Export PMB CBT Error]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menyuplai paket soal CBT" },
      { status: 500 }
    );
  }
}
