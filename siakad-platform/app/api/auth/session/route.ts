import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ensureSiakadSeeded } from "@/db/seed";
import { cookies } from "next/headers";

export async function GET() {
  try {
    await ensureSiakadSeeded();
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ success: true, authenticated: false, user: null });
    }

    // Set legacy cookie for APIs
    const cookieStore = await cookies();
    cookieStore.set("siakad_user", JSON.stringify({
      userId: (session.user as any).id,
      name: session.user.name,
      role: (session.user as any).role,
      username: (session.user as any).username,
    }), { path: "/", maxAge: 86400 });

    return NextResponse.json({ success: true, authenticated: true, user: session.user });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
