import { db } from "@/db";
import { bankMutations, studentInvoices } from "@/db/schema";
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

  const invoices = await db
    .select()
    .from(studentInvoices)
    .where(eq(studentInvoices.status, "lunas"));

  let matchedCount = 0;
  let totalReconciledAmount = 0;
  const details: ReconciliationResult["details"] = [];

  for (const mutation of mutations) {
    const mutAmount = parseFloat(mutation.amount);
    
    // Find matching invoice with same amount
    const matchedInvoice = invoices.find(
      (p) => Math.abs(parseFloat(p.totalAmount) - mutAmount) < 0.01
    );

    if (matchedInvoice) {
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
        matchedPaymentId: matchedInvoice.id,
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
