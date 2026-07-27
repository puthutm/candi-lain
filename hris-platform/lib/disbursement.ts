/**
 * Utility pengirim webhook disbursement payroll ke Keuangan Platform
 */
export interface PayrollDisbursementPayload {
  payrollRunId: string;
  period: string;
  eligibleEmployeeCount: number;
  totalGross: number;
  totalNet: number;
  disburseDate: string;
  source: "hris_platform";
}

export async function sendPayrollDisbursementWebhook(payload: PayrollDisbursementPayload): Promise<{ success: boolean; message?: string }> {
  try {
    const targetUrl = process.env.KEUANGAN_WEBHOOK_URL || "http://localhost:3005/api/webhooks/payroll";
    
    console.log(`[Disbursement Webhook] Dispatching payroll.disbursement_ready event to ${targetUrl}...`);

    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Source": "hris_platform",
        "X-Webhook-Event": "payroll.disbursement_ready",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[Disbursement Webhook Warning] Keuangan service response status ${res.status}: ${errText}`);
      return { success: false, message: `Keuangan endpoint returned status ${res.status}` };
    }

    const data = await res.json();
    console.log(`[Disbursement Webhook Success] Logged in Keuangan Platform:`, data);
    return { success: true, message: "Webhook disbursement berhasil dikirim ke Keuangan Platform" };
  } catch (error: any) {
    console.error(`[Disbursement Webhook Error] Failed to connect to Keuangan Platform:`, error.message);
    return { success: false, message: error.message };
  }
}
