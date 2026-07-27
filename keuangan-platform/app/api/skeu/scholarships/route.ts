import { NextResponse } from "next/server";
import { db } from "@/db";
import { scholarshipPrograms } from "@/db/schema/scholarship";
import { desc } from "drizzle-orm";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("keuangan_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const programs = await db.select().from(scholarshipPrograms).orderBy(desc(scholarshipPrograms.createdAt));
    return NextResponse.json({ success: true, programs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("keuangan_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { code, name, fundingSource, quota, nominalPerSemester, description } = body;

    if (!code || !name || !fundingSource || !nominalPerSemester) {
      return NextResponse.json({ success: false, error: "Missing required fields: code, name, fundingSource, nominalPerSemester" }, { status: 400 });
    }

    const [program] = await db
      .insert(scholarshipPrograms)
      .values({
        code,
        name,
        fundingSource,
        quota: quota || 0,
        nominalPerSemester,
        description,
      })
      .returning();

    return NextResponse.json({ success: true, program }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
