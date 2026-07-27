import { NextResponse } from "next/server";
import { db } from "@/db";
import { chartOfAccounts } from "@/db/schema/master";
import { eq, asc, sql } from "drizzle-orm";
import { cookies } from "next/headers";

type ValidAccountType = "aset" | "liabilitas" | "ekuitas" | "pendapatan" | "beban";
const VALID_ACCOUNT_TYPES: readonly ValidAccountType[] = ["aset", "liabilitas", "ekuitas", "pendapatan", "beban"] as const;

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("keuangan_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const accountTypeParam = searchParams.get("accountType") as ValidAccountType | null;
    const parentId = searchParams.get("parentId");

    const conditions: ReturnType<typeof sql>[] = [];
    if (accountTypeParam && VALID_ACCOUNT_TYPES.includes(accountTypeParam)) {
      conditions.push(sql`${chartOfAccounts.accountType} = ${accountTypeParam}`);
    }
    if (parentId) {
      conditions.push(sql`${chartOfAccounts.parentAccountId} = ${parentId}`);
    }

    const whereClause = conditions.length > 0 ? sql`${conditions.join(" AND ")}` : undefined;

    const accounts = await db
      .select()
      .from(chartOfAccounts)
      .where(whereClause)
      .orderBy(asc(chartOfAccounts.accountCode));

    return NextResponse.json({ success: true, accounts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

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

    const body = await req.json();
    const { accountCode, accountName, accountType, parentAccountId } = body;

    if (!accountCode || !accountName || !accountType) {
      return NextResponse.json({ success: false, error: "Missing required fields: accountCode, accountName, accountType" }, { status: 400 });
    }

    // Validasi tipe akun
    if (!VALID_ACCOUNT_TYPES.includes(accountType)) {
      return NextResponse.json({ success: false, error: `Invalid accountType. Must be one of: ${VALID_ACCOUNT_TYPES.join(", ")}` }, { status: 400 });
    }

    // Cek duplicate account code
    const [existing] = await db
      .select()
      .from(chartOfAccounts)
      .where(eq(chartOfAccounts.accountCode, accountCode))
      .limit(1);

    if (existing) {
      return NextResponse.json({ success: false, error: "Account code already exists" }, { status: 409 });
    }

    const [account] = await db
      .insert(chartOfAccounts)
      .values({
        accountCode,
        accountName,
        accountType: accountType as ValidAccountType,
        parentAccountId: parentAccountId || null,
      })
      .returning();

    return NextResponse.json({ success: true, account }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
