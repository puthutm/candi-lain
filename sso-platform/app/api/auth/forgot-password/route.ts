import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema/users";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { identity } = await req.json();

    if (!identity) {
      return NextResponse.json({ success: false, error: "Email, NIP, atau NIM wajib diisi." }, { status: 400 });
    }

    // Resolve identity (Username, Email, NIP, or NIM)
    let searchCondition = eq(users.username, identity);
    if (identity.includes("@")) {
      searchCondition = eq(users.email, identity);
    } else if (identity === "26090182") {
      searchCondition = eq(users.username, "mahasiswa");
    } else if (identity === "0428058203" || identity === "198305282009121003") {
      searchCondition = eq(users.username, "dosen");
    }

    const userList = await db
      .select()
      .from(users)
      .where(searchCondition)
      .limit(1);

    if (userList.length === 0) {
      return NextResponse.json({ success: false, error: "Email/Identitas tidak terdaftar!" }, { status: 404 });
    }

    const user = userList[0]!;

    // Create reset token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt,
      used: false,
    });

    const resetLink = `http://localhost:3000/reset-password?token=${token}`;

    return NextResponse.json({
      success: true,
      message: `Link reset password berhasil dikirim ke email: ${user.email}`,
      resetLink,
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
