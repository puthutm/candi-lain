import { NextResponse } from "next/server";
import { db } from "@/db";
import { scholarshipDisbursements, scholarshipPrograms } from "@/db/schema/scholarship";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

/**
 * FR-4.3: Manajemen Pencairan Dana Beasiswa
 * GET  - list disbursements (filter by programId)
 * POST - create disbursement
 */
export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("keuangan_user");
    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const programId = searchParams.get("programId");

    let query = db.select().from(scholarshipDisbursements).orderBy(scholarshipDisbursements.disbursementDate);
    if (programId) {
      query = query.where(eq(scholarshipDisbursements.programId, programId)) as any;
    }
    const disbursements = await query;

    return NextResponse.json({ success: true, disbursements });
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

    const body = await req.json();
    const { programId, fundingSource, amount, destinationBankAccount, notes } = body;

    if (!programId || !fundingSource || !amount) {
      return NextResponse.json({ success: false, error: "Missing required fields: programId, fundingSource, amount" }, { status: 400 });
    }

    const [program] = await db.select().from(scholarshipPrograms).where(eq(scholarshipPrograms.id, programId));
    if (!program) {
      return NextResponse.json({ success: false, error: "Program not found" }, { status: 404 });
    }

    const [disbursement] = await db
      .insert(scholarshipDisbursements)
      .values({
        programId,
        fundingSource,
        amount: amount.toString(),
        destinationBankAccount: destinationBankAccount || null,
        notes: notes || null,
      })
      .returning();

    return NextResponse.json({ success: true, disbursement }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
