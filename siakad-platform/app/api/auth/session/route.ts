import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ensureSiakadSeeded } from "@/db/seed";

export async function GET() {
  try {
    await ensureSiakadSeeded();
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ success: true, authenticated: false, user: null });
    }
    return NextResponse.json({ success: true, authenticated: true, user: session.user });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
