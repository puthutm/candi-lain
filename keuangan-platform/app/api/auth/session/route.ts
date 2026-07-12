import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("keuangan_user");

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
