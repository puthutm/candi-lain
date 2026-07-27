import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbApplicants } from "@/db/schema/pmb";
import { desc, sql } from "drizzle-orm";
import { cookies } from "next/headers";

/**
 * FR-3.3: Daftar Pendaftar PMB
 * GET /api/skeu/pmb/applicants
 */
export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("keuangan_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const wave = searchParams.get("wave");
    const regStatus = searchParams.get("status");

    const conditions = [];
    if (wave) conditions.push(sql`${pmbApplicants.waveLabel} = ${wave}`);
    if (regStatus) conditions.push(sql`${pmbApplicants.registrationStatus} = ${regStatus}`);

    const filter = conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;
    const applicants = await db
      .select()
      .from(pmbApplicants)
      .where(filter)
      .orderBy(desc(pmbApplicants.createdAt));

    return NextResponse.json({ success: true, applicants, total: applicants.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/skeu/pmb/applicants — Sinkron data dari SI-PMB
 */
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("keuangan_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { applicants } = body;

    if (!Array.isArray(applicants) || applicants.length === 0) {
      return NextResponse.json({ success: false, error: "Missing or empty applicants array" }, { status: 400 });
    }

    let synced = 0;
    for (const app of applicants) {
      await db.insert(pmbApplicants).values({
        userId: app.userId || null,
        fullName: app.fullName,
        waveLabel: app.waveLabel,
        studyProgramChoice: app.studyProgramChoice || null,
        registrationStatus: app.registrationStatus || "pendaftar",
        paymentStatus: app.paymentStatus || "belum_bayar",
        lastSyncedAt: new Date(),
      }).onConflictDoNothing();
      synced++;
    }

    return NextResponse.json({ success: true, message: `Synced ${synced} applicants`, synced });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


