import { NextResponse } from "next/server";
import { db } from "@/db";
import { chartOfAccounts } from "@/db/schema/schema";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("keuangan_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const sessionUser = JSON.parse(sessionCookie.value);
    if (sessionUser.role === "mahasiswa") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { accountCode, accountName, accountType } = await req.json();
    if (!accountCode || !accountName || !accountType) {
      return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
    }

    const [inserted] = await db.insert(chartOfAccounts).values({
      accountCode,
      accountName,
      accountType,
    }).returning();

    return NextResponse.json({ success: true, coa: inserted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
