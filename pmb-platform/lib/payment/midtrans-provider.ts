/**
 * Midtrans Payment Gateway Provider
 *
 * Implementasi PaymentGatewayProvider untuk Midtrans (Veritrans).
 * Konfigurasi via environment variable:
 * - MIDTRANS_SERVER_KEY
 * - MIDTRANS_CLIENT_KEY
 * - MIDTRANS_IS_PRODUCTION (true/false)
 * - MIDTRANS_MERCHANT_ID (optional)
 */

import type {
  PaymentGatewayProvider,
  PaymentChannel,
  CreateTransactionRequest,
  CreateTransactionResponse,
  GatewayWebhookPayload,
  GatewayTransactionStatus,
} from "./gateway-types";

interface MidtransConfig {
  serverKey: string;
  clientKey: string;
  isProduction: boolean;
  merchantId?: string;
}

function getConfig(): MidtransConfig | null {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const clientKey = process.env.MIDTRANS_CLIENT_KEY;
  if (!serverKey || !clientKey) return null;
  return {
    serverKey,
    clientKey,
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
    merchantId: process.env.MIDTRANS_MERCHANT_ID,
  };
}

function getBaseUrl(isProduction: boolean): string {
  return isProduction
    ? "https://api.midtrans.com/v2"
    : "https://api.sandbox.midtrans.com/v2";
}

function getSnapBaseUrl(isProduction: boolean): string {
  return isProduction
    ? "https://app.midtrans.com/snap/v1"
    : "https://app.sandbox.midtrans.com/snap/v1";
}

function mapMidtransStatus(status: string): GatewayTransactionStatus {
  switch (status) {
    case "settlement":
    case "capture":
      return "success";
    case "pending":
    case "authorize":
      return "pending";
    case "deny":
    case "cancel":
    case "failure":
      return "failed";
    case "expire":
      return "expired";
    case "refund":
    case "partial_refund":
      return "refund";
    default:
      return "pending";
  }
}

export class MidtransProvider implements PaymentGatewayProvider {
  name = "midtrans";
  displayName = "Midtrans";

  private config: MidtransConfig;

  constructor(config?: MidtransConfig) {
    const cfg = config ?? getConfig();
    if (!cfg) {
      throw new Error(
        "Midtrans tidak dikonfigurasi. Set MIDTRANS_SERVER_KEY dan MIDTRANS_CLIENT_KEY di environment."
      );
    }
    this.config = cfg;
  }

  async getPaymentChannels(): Promise<PaymentChannel[]> {
    // Midtrans tidak punya endpoint khusus untuk list channel,
    // jadi kita return channel standar yang didukung
    return [
      { method: "virtual_account", channelName: "Bank BNI", code: "bni_va", description: "BNI Virtual Account" },
      { method: "virtual_account", channelName: "Bank Mandiri", code: "mandiri_va", description: "Mandiri Bill Payment" },
      { method: "virtual_account", channelName: "Bank BRI", code: "bri_va", description: "BRI Virtual Account" },
      { method: "virtual_account", channelName: "Bank Permata", code: "permata_va", description: "Permata Virtual Account" },
      { method: "virtual_account", channelName: "Bank BCA", code: "bca_va", description: "BCA Virtual Account" },
      { method: "virtual_account", channelName: "Maybank", code: "maybank_va", description: "Maybank Virtual Account" },
      { method: "e_wallet", channelName: "GoPay", code: "gopay", description: "GoPay" },
      { method: "e_wallet", channelName: "ShopeePay", code: "shopeepay", description: "ShopeePay" },
      { method: "qris", channelName: "QRIS", code: "qris", description: "QRIS (semua e-wallet)" },
      { method: "transfer_bank", channelName: "Transfer Bank BCA", code: "bca_transfer", description: "Transfer BCA" },
      { method: "transfer_bank", channelName: "Transfer Bank Mandiri", code: "mandiri_transfer", description: "Transfer Mandiri" },
      { method: "retail", channelName: "Indomaret", code: "indomaret", description: "Pembayaran di Indomaret" },
      { method: "retail", channelName: "Alfamart", code: "alfamart", description: "Pembayaran di Alfamart" },
    ];
  }

  async createTransaction(request: CreateTransactionRequest): Promise<CreateTransactionResponse> {
    const baseUrl = getSnapBaseUrl(this.config.isProduction);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3002";

    const payload: Record<string, unknown> = {
      transaction_details: {
        order_id: request.invoiceNumber,
        gross_amount: request.amount,
      },
      customer_details: {
        first_name: request.customerName,
        email: request.customerEmail,
        phone: request.customerPhone || "",
      },
      callbacks: {
        finish: request.callbackUrl || `${appUrl}/dashboard?tab=tagihan`,
        error: `${appUrl}/dashboard?tab=tagihan&error=payment`,
        pending: `${appUrl}/dashboard?tab=tagihan&status=pending`,
      },
      expiry: {
        duration: request.expiryMinutes || 60 * 24, // 24 jam default
        unit: "minute",
      },
    };

    // Jika ada metode spesifik yang dipilih
    if (request.selectedMethod) {
      payload["enabled_payments"] = [request.selectedMethod];
    }

    const response = await fetch(`${baseUrl}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Basic ${Buffer.from(this.config.serverKey + ":").toString("base64")}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Midtrans API error (${response.status}): ${errorBody}`);
    }

    const result = await response.json() as Record<string, unknown>;

    // Extract VA info safely
    const vaNumbers = result.va_numbers as Array<{ va_number: string; bank: string }> | undefined;
    const virtualAccountNumber = vaNumbers?.[0]?.va_number;
    const vaBank = vaNumbers?.[0]?.bank;

    return {
      success: true,
      transactionId: (result.transaction_id as string) || request.invoiceNumber,
      paymentUrl: result.redirect_url as string,
      qrCodeUrl: result.qr_code_url as string,
      virtualAccountNumber,
      vaBank,
      deeplinkUrl: result.deeplink_url as string,
      expiryTime: result.expiry_time as string,
      status: "pending",
      rawResponse: result,
    };
  }

  async verifyWebhookSignature(payload: unknown, signature: string): Promise<boolean> {
    // Midtrans signature: SHA512(order_id + status_code + gross_amount + server_key)
    const p = payload as Record<string, unknown>;
    const orderId = p.order_id as string;
    const statusCode = p.status_code as string;
    const grossAmount = p.gross_amount as string;

    const hash = require("crypto")
      .createHash("sha512")
      .update(orderId + statusCode + grossAmount + this.config.serverKey)
      .digest("hex");

    return hash === signature;
  }

  async parseWebhookPayload(
    payload: unknown,
    headers: Record<string, string>
  ): Promise<GatewayWebhookPayload> {
    const p = payload as Record<string, unknown>;
    const signature = headers["x-midtrans-signature"] || headers["signature"] || "";

    return {
      provider: "midtrans",
      raw: payload,
      signature,
      orderId: p.order_id as string,
      transactionId: p.transaction_id as string,
      transactionStatus: mapMidtransStatus(p.transaction_status as string),
      paymentMethod: p.payment_type as string,
      grossAmount: p.gross_amount ? Number(p.gross_amount) : undefined,
      paidAt: p.settlement_time ? new Date(p.settlement_time as string) : undefined,
    };
  }

  async checkTransactionStatus(transactionId: string): Promise<GatewayTransactionStatus> {
    const baseUrl = getBaseUrl(this.config.isProduction);

    const response = await fetch(`${baseUrl}/${transactionId}/status`, {
      headers: {
        "Accept": "application/json",
        "Authorization": `Basic ${Buffer.from(this.config.serverKey + ":").toString("base64")}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Midtrans status check error (${response.status})`);
    }

    const result = await response.json() as Record<string, unknown>;
    return mapMidtransStatus(result.transaction_status as string);
  }
}

/** Factory untuk membuat instance MidtransProvider jika dikonfigurasi */
export function createMidtransProvider(): MidtransProvider | null {
  try {
    return new MidtransProvider();
  } catch {
    return null;
  }
}
