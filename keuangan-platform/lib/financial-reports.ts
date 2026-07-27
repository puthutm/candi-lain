import { db } from "@/db";
import { chartOfAccounts, journalEntries, journalEntryLines, bankAccounts } from "@/db/schema";
import { eq, gte, lte, and } from "drizzle-orm";

export interface AccountReportItem {
  accountCode: string;
  accountName: string;
  accountType: string;
  totalDebit: number;
  totalCredit: number;
  netBalance: number;
}

export interface IncomeStatementReport {
  periodLabel: string;
  revenueItems: AccountReportItem[];
  expenseItems: AccountReportItem[];
  totalRevenue: number;
  totalExpense: number;
  netIncome: number;
  generatedAt: string;
}

export interface BalanceSheetReport {
  asOfDate: string;
  assetItems: AccountReportItem[];
  liabilityItems: AccountReportItem[];
  equityItems: AccountReportItem[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  isBalanced: boolean;
  generatedAt: string;
}

export async function generateIncomeStatement(
  startDate?: string,
  endDate?: string
): Promise<IncomeStatementReport> {
  const accounts = await db.select().from(chartOfAccounts);
  const lines = await db
    .select({
      accountId: journalEntryLines.accountId,
      debit: journalEntryLines.debit,
      credit: journalEntryLines.credit,
    })
    .from(journalEntryLines);

  const accountBalances: Record<string, { debit: number; credit: number }> = {};

  lines.forEach((line) => {
    if (!accountBalances[line.accountId]) {
      accountBalances[line.accountId] = { debit: 0, credit: 0 };
    }
    accountBalances[line.accountId].debit += parseFloat(line.debit || "0");
    accountBalances[line.accountId].credit += parseFloat(line.credit || "0");
  });

  const revenueItems: AccountReportItem[] = [];
  const expenseItems: AccountReportItem[] = [];

  let totalRevenue = 0;
  let totalExpense = 0;

  accounts.forEach((acc) => {
    const bal = accountBalances[acc.id] || { debit: 0, credit: 0 };
    const net = bal.credit - bal.debit; // Revenue is Credit normal balance

    if (acc.accountType === "pendapatan" || acc.accountCode.startsWith("4")) {
      const amount = Math.abs(net > 0 ? net : bal.credit);
      totalRevenue += amount;
      revenueItems.push({
        accountCode: acc.accountCode,
        accountName: acc.accountName,
        accountType: acc.accountType,
        totalDebit: bal.debit,
        totalCredit: bal.credit,
        netBalance: amount,
      });
    } else if (acc.accountType === "beban" || acc.accountCode.startsWith("5")) {
      const amount = Math.abs(bal.debit - bal.credit);
      totalExpense += amount;
      expenseItems.push({
        accountCode: acc.accountCode,
        accountName: acc.accountName,
        accountType: acc.accountType,
        totalDebit: bal.debit,
        totalCredit: bal.credit,
        netBalance: amount,
      });
    }
  });

  const netIncome = totalRevenue - totalExpense;

  return {
    periodLabel: startDate && endDate ? `${startDate} s/d ${endDate}` : "Tahun Berjalan (YTD)",
    revenueItems,
    expenseItems,
    totalRevenue,
    totalExpense,
    netIncome,
    generatedAt: new Date().toISOString(),
  };
}

export async function generateBalanceSheet(
  asOfDate?: string
): Promise<BalanceSheetReport> {
  const accounts = await db.select().from(chartOfAccounts);
  const lines = await db
    .select({
      accountId: journalEntryLines.accountId,
      debit: journalEntryLines.debit,
      credit: journalEntryLines.credit,
    })
    .from(journalEntryLines);

  const accountBalances: Record<string, { debit: number; credit: number }> = {};

  lines.forEach((line) => {
    if (!accountBalances[line.accountId]) {
      accountBalances[line.accountId] = { debit: 0, credit: 0 };
    }
    accountBalances[line.accountId].debit += parseFloat(line.debit || "0");
    accountBalances[line.accountId].credit += parseFloat(line.credit || "0");
  });

  const assetItems: AccountReportItem[] = [];
  const liabilityItems: AccountReportItem[] = [];
  const equityItems: AccountReportItem[] = [];

  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalEquity = 0;

  accounts.forEach((acc) => {
    const bal = accountBalances[acc.id] || { debit: 0, credit: 0 };

    if (acc.accountType === "aset" || acc.accountCode.startsWith("1")) {
      const amount = bal.debit - bal.credit;
      totalAssets += amount;
      assetItems.push({
        accountCode: acc.accountCode,
        accountName: acc.accountName,
        accountType: acc.accountType,
        totalDebit: bal.debit,
        totalCredit: bal.credit,
        netBalance: amount,
      });
    } else if (acc.accountType === "liabilitas" || acc.accountCode.startsWith("2")) {
      const amount = bal.credit - bal.debit;
      totalLiabilities += amount;
      liabilityItems.push({
        accountCode: acc.accountCode,
        accountName: acc.accountName,
        accountType: acc.accountType,
        totalDebit: bal.debit,
        totalCredit: bal.credit,
        netBalance: amount,
      });
    } else if (acc.accountType === "ekuitas" || acc.accountCode.startsWith("3")) {
      const amount = bal.credit - bal.debit;
      totalEquity += amount;
      equityItems.push({
        accountCode: acc.accountCode,
        accountName: acc.accountName,
        accountType: acc.accountType,
        totalDebit: bal.debit,
        totalCredit: bal.credit,
        netBalance: amount,
      });
    }
  });

  const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1.0;

  return {
    asOfDate: asOfDate || new Date().toISOString().split("T")[0],
    assetItems,
    liabilityItems,
    equityItems,
    totalAssets,
    totalLiabilities,
    totalEquity,
    isBalanced,
    generatedAt: new Date().toISOString(),
  };
}
