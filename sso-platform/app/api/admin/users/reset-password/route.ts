import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { getSessionUser, isSuperAdmin } from "@/lib/auth-helper";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || !isSuperAdmin(user)) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const { targetUserId } = await req.json();
    if (!targetUserId) {
      return NextResponse.json({ success: false, error: "User ID wajib diisi." }, { status: 400 });
    }

    // Default password
    const defaultPassword = "password123";
    const hashed = await bcrypt.hash(defaultPassword, 12);

    await db
      .update(users)
      .set({ passwordHash: hashed, updatedAt: new Date() })
      .where(eq(users.id, targetUserId));

    return NextResponse.json({
      success: true,
      message: `Berhasil mereset kata sandi user tersebut kembali ke default: "${defaultPassword}"`
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
