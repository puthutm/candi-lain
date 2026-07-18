import { NextResponse } from "next/server";

export async function POST(req: Request) {
  return NextResponse.json({
    success: false,
    error: "Login kredensial lokal dinonaktifkan. Silakan gunakan Single Sign-On (SSO) untuk masuk."
  }, { status: 400 });
}
export const dynamic = "force-dynamic";
