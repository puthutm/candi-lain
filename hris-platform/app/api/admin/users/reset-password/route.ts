import { NextResponse } from "next/server";
import { db } from "@/db";
import { ssoUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { env } from "@/lib/env";

export async function POST(req: Request) {
  try {
    const { username } = await req.json();

    if (!username) {
      return NextResponse.json({ success: false, error: "Username wajib diisi." }, { status: 400 });
    }

    // Resolve username from NIP if applicable
    let targetUsername = username;
    if (username === "0428058203" || username === "198305282009121003") {
      targetUsername = "dosen";
    }

    // Default password
    const defaultPassword = env.DEFAULT_RESET_PASSWORD;
    const hashed = await bcrypt.hash(defaultPassword, env.BCRYPT_ROUNDS);

    await db
      .update(ssoUsers)
      .set({ passwordHash: hashed })
      .where(eq(ssoUsers.username, targetUsername));

    return NextResponse.json({
      success: true,
      message: `Berhasil mereset kata sandi user ${username} ke default: "${defaultPassword}"`
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
