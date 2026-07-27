/**
 * PPh21 TER & BPJS Calculation Engine for HRIS / SDM Platform UNSIA
 * Standard: PP 58/2023 & PMK 168/2023
 */

export interface TaxCalculationResult {
  category: "TER_A" | "TER_B" | "TER_C";
  ratePercent: number;
  pph21Amount: number;
  hasNpwpPenalty: boolean;
}

export interface BpjsCalculationResult {
  bpjsKesehatan: number;
  bpjsKetenagakerjaan: number;
  totalBpjsEmployee: number;
}

export interface PayrollCalculationSummary {
  grossSalary: number;
  baseSalary: number;
  totalAllowances: number;
  pph21: TaxCalculationResult;
  bpjs: BpjsCalculationResult;
  totalDeductions: number;
  netSalary: number;
}

export function calculatePph21Ter(
  grossSalary: number,
  ptkpStatus: string = "TK/0",
  hasNpwp: boolean = true
): TaxCalculationResult {
  const ptkpUpper = ptkpStatus.toUpperCase().trim();

  // 1. Determine TER Category
  let category: "TER_A" | "TER_B" | "TER_C" = "TER_A";
  if (["TK/0", "TK/1", "K/0"].includes(ptkpUpper)) {
    category = "TER_A";
  } else if (["TK/2", "TK/3", "K/1", "K/2"].includes(ptkpUpper)) {
    category = "TER_B";
  } else if (ptkpUpper === "K/3") {
    category = "TER_C";
  }

  // 2. Lookup TER Rate Bracket
  let ratePercent = 0;
  if (category === "TER_A") {
    if (grossSalary <= 5400000) ratePercent = 0;
    else if (grossSalary <= 5650000) ratePercent = 0.25;
    else if (grossSalary <= 5950000) ratePercent = 0.5;
    else if (grossSalary <= 6300000) ratePercent = 0.75;
    else if (grossSalary <= 6750000) ratePercent = 1.0;
    else if (grossSalary <= 7500000) ratePercent = 1.25;
    else if (grossSalary <= 8550000) ratePercent = 1.5;
    else if (grossSalary <= 9650000) ratePercent = 1.75;
    else if (grossSalary <= 10050000) ratePercent = 2.0;
    else if (grossSalary <= 15000000) ratePercent = 5.0;
    else ratePercent = 9.0;
  } else if (category === "TER_B") {
    if (grossSalary <= 6200000) ratePercent = 0;
    else if (grossSalary <= 6500000) ratePercent = 0.25;
    else if (grossSalary <= 6850000) ratePercent = 0.5;
    else if (grossSalary <= 7300000) ratePercent = 0.75;
    else if (grossSalary <= 9200000) ratePercent = 1.5;
    else if (grossSalary <= 15000000) ratePercent = 4.0;
    else ratePercent = 8.0;
  } else {
    // TER_C
    if (grossSalary <= 6600000) ratePercent = 0;
    else if (grossSalary <= 6950000) ratePercent = 0.25;
    else if (grossSalary <= 7350000) ratePercent = 0.5;
    else if (grossSalary <= 15000000) ratePercent = 3.5;
    else ratePercent = 7.0;
  }

  let finalRate = ratePercent;
  let hasNpwpPenalty = false;

  if (!hasNpwp && finalRate > 0) {
    finalRate = finalRate * 1.2; // 20% Penalty
    hasNpwpPenalty = true;
  }

  const pph21Amount = Math.round((grossSalary * finalRate) / 100);

  return {
    category,
    ratePercent: Math.round(finalRate * 100) / 100,
    pph21Amount,
    hasNpwpPenalty,
  };
}

export function calculateBpjsDeductions(
  baseSalary: number,
  functionalAllowance: number = 0
): BpjsCalculationResult {
  const baseForBpjs = baseSalary + functionalAllowance;

  // BPJS Kesehatan 1% (Cap Rp 12.000.000)
  const capKesehatan = Math.min(baseForBpjs, 12000000);
  const bpjsKesehatan = Math.round(capKesehatan * 0.01);

  // BPJS Ketenagakerjaan: JHT 2% + JP 1% (JP Cap Rp 10.547.400)
  const jht = Math.round(baseForBpjs * 0.02);
  const capJp = Math.min(baseForBpjs, 10547400);
  const jp = Math.round(capJp * 0.01);
  const bpjsKetenagakerjaan = jht + jp;

  return {
    bpjsKesehatan,
    bpjsKetenagakerjaan,
    totalBpjsEmployee: bpjsKesehatan + bpjsKetenagakerjaan,
  };
}

export function calculateEmployeePayroll(params: {
  baseSalary: number;
  functionalAllowance?: number;
  otherAllowances?: number;
  ptkpStatus?: string;
  hasNpwp?: boolean;
}): PayrollCalculationSummary {
  const baseSalary = params.baseSalary || 0;
  const functionalAllowance = params.functionalAllowance || 0;
  const otherAllowances = params.otherAllowances || 0;

  const grossSalary = baseSalary + functionalAllowance + otherAllowances;
  const totalAllowances = functionalAllowance + otherAllowances;

  const pph21 = calculatePph21Ter(
    grossSalary,
    params.ptkpStatus || "TK/0",
    params.hasNpwp !== false
  );

  const bpjs = calculateBpjsDeductions(baseSalary, functionalAllowance);

  const totalDeductions = pph21.pph21Amount + bpjs.totalBpjsEmployee;
  const netSalary = Math.max(0, grossSalary - totalDeductions);

  return {
    grossSalary,
    baseSalary,
    totalAllowances,
    pph21,
    bpjs,
    totalDeductions,
    netSalary,
  };
}
