import { PaymentProvider, CreateTransactionRequest, CreateTransactionResponse, PaymentChannel, PaymentNotification } from "./gateway-types";

export class MidtransProvider implements PaymentProvider {
  private serverKey: string;
  private isProduction: boolean;

  constructor(config: { serverKey: string; clientKey: string; isProduction: boolean }) {
    this.serverKey = config.serverKey;
    this.isProduction = config.isProduction;
  }

  private get baseUrl(): string {
    return this.isProduction
      ? "https://api.midtrans.com/v2"
      : "https://api.sandbox.midtrans.com/v2";
  }

  private get headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Basic ${Buffer.from(this.serverKey + ":").toString("base64")}`,
    };
  }

  async createTransaction(req: CreateTransactionRequest): Promise<CreateTransactionResponse> {
    const payload = {
      transaction_details: {
        order_id: req.orderId,
        gross_amount: req.grossAmount,
      },
      customer_details: {
        first_name: req.customerDetails.firstName,
        last_name: req.customerDetails.lastName || "",
        email: req.customerDetails.email,
        phone: req.customerDetails.phone || "",
      },
      item_details: req.itemDetails.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    };

    const response = await fetch(`${this.baseUrl}/charge`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Midtrans API error: ${response.status} - ${errorBody}`);
    }

    const data = await response.json();
    return {
      token: data.token,
      redirectUrl: data.redirect_url,
      transactionId: data.transaction_id,
    };
  }

  verifyNotification(body: any): PaymentNotification {
    const { transaction_id, order_id, transaction_status, fraud_status, gross_amount, payment_type, transaction_time, signature_key } = body;

    // Verify signature key
    const expectedSignature = require("crypto")
      .createHash("sha512")
      .update(`${order_id}${transaction_status}${gross_amount}${this.serverKey}`)
      .digest("hex");

    if (signature_key !== expectedSignature) {
      throw new Error("Invalid signature key from Midtrans notification");
    }

    return {
      transactionId: transaction_id,
      orderId: order_id,
      transactionStatus: transaction_status,
      fraudStatus: fraud_status,
      grossAmount: gross_amount,
      paymentType: payment_type,
      transactionTime: transaction_time,
      vaNumbers: body.va_numbers,
      signatureKey: signature_key,
    };
  }

  async getAvailableChannels(): Promise<PaymentChannel[]> {
    // Midtrans doesn't have a dedicated channel list API, returning standard channels
    return [
      { code: "bca_va", name: "BCA Virtual Account", type: "virtual_account" },
      { code: "bni_va", name: "BNI Virtual Account", type: "virtual_account" },
      { code: "bri_va", name: "BRI Virtual Account", type: "virtual_account" },
      { code: "mandiri_va", name: "Mandiri Bill Payment", type: "virtual_account" },
      { code: "qris", name: "QRIS", type: "qris" },
      { code: "credit_card", name: "Kartu Kredit", type: "credit_card" },
    ];
  }
}

