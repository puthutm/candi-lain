import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbApplicants } from "@/db/schema/applicants";
import { pmbWaves } from "@/db/schema/master";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { env } from "@/lib/env";
import { requireRole, FULL_ACCESS_ROLES } from "@/lib/sso-middleware";

export async function POST(req: Request) {
  try {
    const auth = await requireRole(FULL_ACCESS_ROLES);
    if (auth instanceof NextResponse) return auth;

    const { applicantId } = await req.json();

    if (!applicantId) {
      return NextResponse.json({ success: false, error: "applicantId wajib diisi" }, { status: 400 });
    }

    const applicantList = await db
      .select({
        id: pmbApplicants.id,
        fullName: pmbApplicants.fullName,
        waveId: pmbApplicants.waveId,
        defaultPassword: pmbWaves.defaultPassword,
      })
      .from(pmbApplicants)
      .leftJoin(pmbWaves, eq(pmbApplicants.waveId, pmbWaves.id))
      .where(eq(pmbApplicants.id, applicantId))
      .limit(1);

    if (applicantList.length === 0) {
      return NextResponse.json({ success: false, error: "Pendaftar tidak ditemukan" }, { status: 404 });
    }

    const applicant = applicantList[0]!;
    const defaultPassword = applicant.defaultPassword || env.DEFAULT_APPLICANT_PASSWORD || "Pmb2026!";

    const rounds = env.BCRYPT_ROUNDS || 10;
    const newHashedPassword = await bcrypt.hash(defaultPassword, rounds);

    await db
      .update(pmbApplicants)
      .set({
        passwordHash: newHashedPassword,
        mustChangePassword: true,
        updatedAt: new Date(),
      })
      .where(eq(pmbApplicants.id, applicantId));

    return NextResponse.json({
      success: true,
      message: `Password akun ${applicant.fullName} berhasil di-reset ke default gelombang: "${defaultPassword}"`,
      defaultPassword,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
