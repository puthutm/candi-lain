import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { questionBankItems, questionBankOptions } from "@/db/schema/content";
import { desc, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseCode = searchParams.get("courseCode") || undefined;

    let query = db.select().from(questionBankItems);
    if (courseCode) {
      query = query.where(eq(questionBankItems.courseCode, courseCode)) as any;
    }

    const list = await query.orderBy(desc(questionBankItems.createdAt));

    return NextResponse.json({
      success: true,
      questions: list,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      courseCode,
      topic,
      questionText,
      questionType,
      correctAnswer,
      difficultyLevel,
      bloomTaxonomy,
      options,
      contributorUserId,
    } = body;

    if (!courseCode || !topic || !questionText || !correctAnswer) {
      return NextResponse.json(
        { success: false, error: "courseCode, topic, questionText, dan correctAnswer wajib diisi" },
        { status: 400 }
      );
    }

    const [createdQuestion] = await db
      .insert(questionBankItems)
      .values({
        courseCode,
        topic,
        questionText,
        questionType: questionType || "pilihan_ganda",
        correctAnswer,
        difficultyLevel: difficultyLevel || "sedang",
        bloomTaxonomy: bloomTaxonomy || "C1",
        contributorUserId: contributorUserId || "00000000-0000-0000-0000-000000000001",
        verificationStatus: "terbit",
        qualityFlag: "baik",
      })
      .returning();

    if (!createdQuestion) {
      return NextResponse.json(
        { success: false, error: "Gagal membuat soal di database" },
        { status: 500 }
      );
    }

    // Insert options if provided
    if (Array.isArray(options) && options.length > 0) {
      const optionsData = options.map((opt: any) => ({
        questionId: createdQuestion.id,
        optionLabel: opt.optionLabel || "A",
        optionText: opt.optionText || "",
        isCorrect: opt.optionLabel === correctAnswer || opt.isCorrect === true,
      }));

      await db.insert(questionBankOptions).values(optionsData);
    }

    return NextResponse.json({
      success: true,
      message: "Soal baru berhasil ditambahkan ke Bank Soal!",
      question: createdQuestion,
    });
  } catch (error: any) {
    console.error("[Questions API Error]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal membuat soal" },
      { status: 500 }
    );
  }
}
