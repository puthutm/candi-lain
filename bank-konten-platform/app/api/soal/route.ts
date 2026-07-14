import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { questionBankItems, questionBankOptions, auditLogs } from "@/db/schema/content";
import { getSessionUser } from "@/lib/auth-helper";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseCode = searchParams.get("courseCode");
    const status = searchParams.get("status") || "terbit";
    const contributorId = searchParams.get("contributorId");

    const conditions = [];
    if (courseCode) conditions.push(eq(questionBankItems.courseCode, courseCode));
    if (status && status !== "all") conditions.push(eq(questionBankItems.verificationStatus, status));
    if (contributorId) conditions.push(eq(questionBankItems.contributorUserId, contributorId));

    const list = await db
      .select()
      .from(questionBankItems)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(questionBankItems.createdAt));

    const results = [];
    for (const item of list) {
      const options = await db
        .select()
        .from(questionBankOptions)
        .where(eq(questionBankOptions.questionId, item.id));

      results.push({
        ...item,
        options,
      });
    }

    return NextResponse.json({ success: true, questions: results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { courseCode, topic, questionText, questionType, correctAnswer, difficultyLevel, bloomTaxonomy, tags, options } = body;

    if (!courseCode || !topic || !questionText || !questionType || !correctAnswer) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Insert Question Item
    const [newItem] = await db
      .insert(questionBankItems)
      .values({
        courseCode,
        topic,
        questionText,
        questionType,
        correctAnswer,
        difficultyLevel: difficultyLevel || "sedang",
        bloomTaxonomy: bloomTaxonomy || "C1",
        tags: tags || [],
        contributorUserId: user.userId,
        currentVersionNumber: 1,
        verificationStatus: "menunggu_prodi",
        qualityFlag: "belum_dianalisis",
      })
      .returning();

    // 2. Insert Options if choosing pilihan_ganda
    const insertedOptions = [];
    if (options && Array.isArray(options) && options.length > 0) {
      for (const opt of options) {
        const [newOpt] = await db
          .insert(questionBankOptions)
          .values({
            questionId: newItem!.id,
            optionLabel: opt.optionLabel,
            optionText: opt.optionText,
            isCorrect: opt.isCorrect || false,
          })
          .returning();
        insertedOptions.push(newOpt);
      }
    }

    // 3. Write Audit Log
    await db.insert(auditLogs).values({
      actorRef: user.userId,
      entityType: "soal",
      entityId: newItem!.id,
      action: "create",
      detail: { courseCode, topic, questionType },
    });

    return NextResponse.json({ success: true, question: newItem, options: insertedOptions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
