import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema/users";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json({ success: false, error: "Token dan password baru wajib diisi." }, { status: 400 });
    }

    // Find valid token
    const tokenList = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, false)
        )
      )
      .limit(1);

    const resetToken = tokenList[0];
    if (!resetToken) {
      return NextResponse.json({ success: false, error: "Token reset tidak valid atau sudah digunakan." }, { status: 400 });
    }

    // Check expiration
    if (new Date() > new Date(resetToken.expiresAt)) {
      return NextResponse.json({ success: false, error: "Token reset password sudah kadaluarsa." }, { status: 400 });
    }

    // Hash password
    const hashed = await bcrypt.hash(newPassword, 12);

    // Update user password
    await db
      .update(users)
      .set({ passwordHash: hashed, updatedAt: new Date() })
      .where(eq(users.id, resetToken.userId));

    // Mark token as used
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, resetToken.id));

    return NextResponse.json({ success: true, message: "Kata sandi berhasil diperbarui!" });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
