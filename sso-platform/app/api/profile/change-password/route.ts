import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { AuthenticationService } from "@/lib/services/auth";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { env } from "@/lib/env";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("sso_session")?.value;
    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const sessionCheck = await AuthenticationService.validateSession(sessionId);
    if (!sessionCheck.valid || !sessionCheck.session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, error: "Password lama dan password baru wajib diisi" }, { status: 400 });
    }

    // Fetch user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, sessionCheck.session.userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ success: false, error: "User tidak ditemukan" }, { status: 404 });
    }

    // Verify current password
    const match = await AuthenticationService.verifyPassword(currentPassword, user.passwordHash);
    if (!match) {
      return NextResponse.json({ success: false, error: "Password saat ini salah" }, { status: 400 });
    }

    // Validate new password rules
    if (newPassword.length < 8) {
      return NextResponse.json({ success: false, error: "Password baru minimal 8 karakter" }, { status: 400 });
    }

    // Hash and update
    const saltRounds = env.BCRYPT_ROUNDS || 12;
    const hashed = await bcrypt.hash(newPassword, saltRounds);

    await db
      .update(users)
      .set({ passwordHash: hashed, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    return NextResponse.json({ success: true, message: "Password berhasil diubah!" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
