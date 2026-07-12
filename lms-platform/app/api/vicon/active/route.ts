import { NextResponse } from "next/server";
import { db } from "@/db";
import { videoConferences } from "@/db/schema/vicon";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Missing sessionId" }, { status: 400 });
    }

    const list = await db
      .select()
      .from(videoConferences)
      .where(eq(videoConferences.sessionId, sessionId))
      .limit(1);

    return NextResponse.json({ success: true, vicon: list[0] || null });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
