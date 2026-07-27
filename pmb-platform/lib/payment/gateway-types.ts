/**
 * Payment Gateway Types & Interfaces
 *
 * Arsitektur provider pattern untuk mendukung multiple payment gateway
 * yang bisa dikonfigurasi secara dinamis.
 * Gateway default diatur di environment variable PAYMENT_GATEWAY_PROVIDER
 * atau bisa dari modul keuangan via API nantinya.
 */

/** Metode pembayaran yang didukung */
export type PaymentMethodType = "virtual_account" | "qris" | "e_wallet" | "transfer_bank" | "retail";

/** Status transaksi dari gateway */
export type GatewayTransactionStatus = "pending" | "success" | "failed" | "expired" | "refund";

/** Channel/metode spesifik dari gateway */
export interface PaymentChannel {
  method: PaymentMethodType;
  channelName: string;
  code: string;
  icon?: string;
  description?: string;
  minAmount?: number;
  maxAmount?: number;
}

/** Request untuk membuat transaksi pembayaran */
export interface CreateTransactionRequest {
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  description?: string;
  expiryMinutes?: number;
  idempotencyKey?: string;
  /** Metode spesifik yang dipilih (optional, jika tidak ada akan generate semua metode) */
  selectedMethod?: string;
  /** Callback URL setelah pembayaran */
  callbackUrl?: string;
  /** Webhook URL untuk notifikasi pembayaran */
  webhookUrl?: string;
}

/** Response dari pembuatan transaksi */
export interface CreateTransactionResponse {
  success: boolean;
  transactionId: string;
  paymentUrl?: string;
  qrCodeUrl?: string;
  virtualAccountNumber?: string;
  vaBank?: string;
  eWalletActionUrl?: string;
  deeplinkUrl?: string;
  expiryTime?: string;
  status: GatewayTransactionStatus;
  rawResponse?: unknown;
}

/** Request payload dari webhook gateway */
export interface GatewayWebhookPayload {
  provider: string;
  raw: unknown;
  signature?: string;
  orderId?: string;
  transactionId?: string;
  transactionStatus: GatewayTransactionStatus;
  paymentMethod?: string;
  grossAmount?: number;
  paidAt?: Date;
}

/** Interface yang harus diimplementasikan semua provider gateway */
export interface PaymentGatewayProvider {
  name: string;
  displayName: string;

  /** Mendapatkan daftar metode pembayaran yang tersedia */
  getPaymentChannels(): Promise<PaymentChannel[]>;

  /** Membuat transaksi pembayaran */
  createTransaction(request: CreateTransactionRequest): Promise<CreateTransactionResponse>;

  /** Memverifikasi signature webhook */
  verifyWebhookSignature(payload: unknown, signature: string): Promise<boolean>;

  /** Parse webhook payload ke format standar */
  parseWebhookPayload(payload: unknown, headers: Record<string, string>): Promise<GatewayWebhookPayload>;

  /** Cek status transaksi */
  checkTransactionStatus(transactionId: string): Promise<GatewayTransactionStatus>;
}
