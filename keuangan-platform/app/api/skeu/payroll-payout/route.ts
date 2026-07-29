import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { journalEntries, journalEntryLines } from "@/db/schema/accounting";
import { chartOfAccounts } from "@/db/schema/master";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { payoutRef, period, totalAmount, disbursedAt } = body;

    if (!payoutRef || !totalAmount) {
      return NextResponse.json({ error: "Payload webhook payout gaji tidak lengkap" }, { status: 400 });
    }

    // 1. Fetch CoA for Beban Gaji & Kas Bank
    const coaBebanGaji = await db.select().from(chartOfAccounts).where(eq(chartOfAccounts.accountCode, "5-10100"));
    const coaBank = await db.select().from(chartOfAccounts).where(eq(chartOfAccounts.accountCode, "1-10102"));

    const bebanGajiId = coaBebanGaji[0]?.id;
    const bankId = coaBank[0]?.id;

    const dateStr = new Date(disbursedAt || Date.now()).toISOString().split("T")[0]!;

    // 2. Create Journal Entry
    const [entry] = await db
      .insert(journalEntries)
      .values({
        journalNumber: `JRN-PAYROLL-${payoutRef}`,
        entryDate: dateStr,
        description: `Pencatatan Transfer Penggajian Pegawai Periode ${period || ""}`,
        source: "auto_payroll",
        status: "posted",
      })
      .returning();

    if (entry && bebanGajiId && bankId) {
      // Debit: Beban Gaji
      await db.insert(journalEntryLines).values({
        journalEntryId: entry.id,
        accountId: bebanGajiId,
        debit: totalAmount.toString(),
        credit: "0.00",
        description: `Beban Gaji Massal ${payoutRef}`,
      });

      // Credit: Kas/Bank
      await db.insert(journalEntryLines).values({
        journalEntryId: entry.id,
        accountId: bankId,
        debit: "0.00",
        credit: totalAmount.toString(),
        description: `Pencairan Kas Bank Payout Gaji ${payoutRef}`,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Jurnal akuntansi pencairan penggajian berhasil dicatat di SKEU",
      journalEntryId: entry?.id || null,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";

