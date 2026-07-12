import { NextResponse } from "next/server";
import { db } from "@/db";
import { interactiveVideos, videoMarkers, videoMarkerAnswers } from "@/db/schema/sessions";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Missing sessionId" }, { status: 400 });
    }

    // 1. Get video of session
    let videos = await db
      .select()
      .from(interactiveVideos)
      .where(eq(interactiveVideos.sessionId, sessionId))
      .limit(1);

    if (videos.length === 0) {
      // Auto-create a mock interactive video if none exists to keep it dynamic and testable!
      const [newVideo] = await db
        .insert(interactiveVideos)
        .values({
          sessionId,
          title: "Video Kuliah Pengantar Rekayasa Perangkat Lunak",
          sourceType: "youtube_url",
          videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          durationSeconds: 300,
        })
        .returning();

      // Seed 2 markers for this video at 15s and 45s
      const markersToInsert = [
        {
          interactiveVideoId: newVideo!.id,
          timestampSeconds: 15,
          questionText: "Apakah tujuan utama dari rekayasa perangkat lunak?",
          questionType: "pilihan_ganda" as const,
          options: ["Menghasilkan perangkat lunak berkualitas tinggi", "Menulis kode secepat mungkin", "Membuat situs web pribadi"],
        },
        {
          interactiveVideoId: newVideo!.id,
          timestampSeconds: 45,
          questionText: "Sebutkan satu tahapan dalam siklus SDLC!",
          questionType: "esai" as const,
          options: [],
        }
      ];
      await db.insert(videoMarkers).values(markersToInsert);

      videos = [newVideo!];
    }

    const video = videos[0]!;

    // 2. Get markers
    const markers = await db
      .select()
      .from(videoMarkers)
      .where(eq(videoMarkers.interactiveVideoId, video.id));

    return NextResponse.json({
      success: true,
      video,
      markers,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, interactiveVideoId, timestampSeconds, questionText, options, markerId, studentUserId, answerText } = body;

    if (action === "create_marker") {
      if (!interactiveVideoId || !timestampSeconds || !questionText) {
        return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
      }

      const [newMarker] = await db
        .insert(videoMarkers)
        .values({
          interactiveVideoId,
          timestampSeconds: Number(timestampSeconds),
          questionText,
          questionType: options && options.length > 0 ? "pilihan_ganda" : "esai",
          options: options || null,
        })
        .returning();

      return NextResponse.json({ success: true, marker: newMarker });
    }

    if (action === "answer_marker") {
      if (!markerId || !studentUserId || !answerText) {
        return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
      }

      const [answer] = await db
        .insert(videoMarkerAnswers)
        .values({
          markerId,
          studentUserId,
          answerText,
        })
        .returning();

      return NextResponse.json({ success: true, answer });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
