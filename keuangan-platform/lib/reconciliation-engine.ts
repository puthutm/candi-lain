import { db } from "@/db";
import {
  bankMutations,
  bankAccounts,
  studentPayments,
  journalEntries,
  journalEntryLines,
  chartOfAccounts,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";

export interface ReconciliationResult {
  success: boolean;
  matchedCount: number;
  unmatchedCount: number;
  totalReconciledAmount: number;
  details: Array<{
    mutationId: string;
    amount: number;
    description: string;
    matchedPaymentId?: string;
    status: "matched" | "unmatched";
  }>;
}

export async function runBankReconciliation(
  bankAccountId: string
): Promise<ReconciliationResult> {
  const mutations = await db
    .select()
    .from(bankMutations)
    .where(
      and(
        eq(bankMutations.bankAccountId, bankAccountId),
        eq(bankMutations.reconciled, false)
      )
    );

  const payments = await db
    .select()
    .from(studentPayments)
    .where(eq(studentPayments.status, "lunas"));

  let matchedCount = 0;
  let totalReconciledAmount = 0;
  const details: ReconciliationResult["details"] = [];

  for (const mutation of mutations) {
    const mutAmount = parseFloat(mutation.amount);
    
    // Find matching payment with same amount
    const matchedPayment = payments.find(
      (p) => Math.abs(parseFloat(p.amount) - mutAmount) < 0.01
    );

    if (matchedPayment) {
      matchedCount++;
      totalReconciledAmount += mutAmount;

      // Update mutation as reconciled
      await db
        .update(bankMutations)
        .set({ reconciled: true })
        .where(eq(bankMutations.id, mutation.id));

      details.push({
        mutationId: mutation.id,
        amount: mutAmount,
        description: mutation.description || "Setoran Pembayaran Mahasiswa",
        matchedPaymentId: matchedPayment.id,
        status: "matched",
      });
    } else {
      details.push({
        mutationId: mutation.id,
        amount: mutAmount,
        description: mutation.description || "Mutasi Belum Teridentifikasi",
        status: "unmatched",
      });
    }
  }

  return {
    success: true,
    matchedCount,
    unmatchedCount: mutations.length - matchedCount,
    totalReconciledAmount,
    details,
  };
}
