import { NextResponse } from "next/server";
import { db } from "@/db";
import { pmbApplicants } from "@/db/schema/applicants";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import bcrypt from "bcrypt";
import { env } from "@/lib/env";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const pmbUserCookie = cookieStore.get("pmb_user")?.value;

    if (!pmbUserCookie) {
      return NextResponse.json({ success: false, error: "Sesi tidak ditemukan" }, { status: 401 });
    }

    const sessionUser = JSON.parse(pmbUserCookie);
    const applicantId = sessionUser.userId;

    if (!applicantId) {
      return NextResponse.json({ success: false, error: "ID pendaftar tidak valid" }, { status: 400 });
    }

    const { newPassword, confirmPassword } = await req.json();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ success: false, error: "Kata sandi baru minimal 6 karakter" }, { status: 400 });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return NextResponse.json({ success: false, error: "Konfirmasi kata sandi tidak cocok" }, { status: 400 });
    }

    const newHashedPassword = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS || 10);

    await db
      .update(pmbApplicants)
      .set({
        passwordHash: newHashedPassword,
        mustChangePassword: false,
        updatedAt: new Date(),
      })
      .where(eq(pmbApplicants.id, applicantId));

    // Update cookie with mustChangePassword = false
    const isSecure = process.env.NODE_ENV === "production";
    cookieStore.set("pmb_user", JSON.stringify({
      ...sessionUser,
      mustChangePassword: false,
    }), {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      maxAge: 86400,
    });

    return NextResponse.json({
      success: true,
      message: "Kata sandi berhasil diperbarui! Silakan melanjutkan.",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
