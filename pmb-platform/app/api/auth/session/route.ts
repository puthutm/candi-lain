import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ensurePmbSeeded } from "@/db/seed";

export async function GET() {
  try {
    // If there's a seed check/ensure function we can call it here, similar to SIAKAD.
    // Let's see if ensurePmbSeeded exists in @/db/seed, otherwise skip it or handle it safely.
    try {
      await ensurePmbSeeded();
    } catch {
      // ignore if not present
    }

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("pmb_user");

    if (!sessionCookie) {
      return NextResponse.json({ success: true, authenticated: false, user: null });
    }

    const user = JSON.parse(sessionCookie.value);
    return NextResponse.json({ success: true, authenticated: true, user });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
