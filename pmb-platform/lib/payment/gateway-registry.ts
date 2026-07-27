/**
 * Payment Gateway Registry
 *
 * Central registry untuk mengelola multiple payment gateway providers.
 * Gateway aktif ditentukan oleh environment variable PAYMENT_GATEWAY_PROVIDER.
 * Default: "midtrans" (jika dikonfigurasi) atau fallback ke simulasi.
 */

import type { PaymentGatewayProvider, PaymentChannel, CreateTransactionRequest, CreateTransactionResponse, GatewayWebhookPayload } from "./gateway-types";
import { createMidtransProvider } from "./midtrans-provider";

/** Provider simulasi untuk development tanpa gateway sungguhan */
class SimulatedProvider implements PaymentGatewayProvider {
  name = "simulated";
  displayName = "Simulasi Pembayaran";

  async getPaymentChannels(): Promise<PaymentChannel[]> {
    return [
      { method: "virtual_account", channelName: "Bank BNI (Simulasi)", code: "bni_va", description: "Simulasi BNI VA" },
      { method: "virtual_account", channelName: "Bank Mandiri (Simulasi)", code: "mandiri_va", description: "Simulasi Mandiri VA" },
      { method: "virtual_account", channelName: "Bank Permata (Simulasi)", code: "permata_va", description: "Simulasi Permata VA" },
      { method: "qris", channelName: "QRIS (Simulasi)", code: "qris", description: "Simulasi QRIS" },
      { method: "e_wallet", channelName: "GoPay (Simulasi)", code: "gopay", description: "Simulasi GoPay" },
    ];
  }

  async createTransaction(request: CreateTransactionRequest): Promise<CreateTransactionResponse> {
    // Simulasi: generate VA number palsu
    const vaNumber = `988${String(Math.floor(Math.random() * 10000000000)).padStart(10, "0")}`;
    return {
      success: true,
      transactionId: `SIM-${request.invoiceNumber}-${Date.now()}`,
      virtualAccountNumber: vaNumber,
      vaBank: request.selectedMethod?.includes("mandiri") ? "Bank Mandiri" : 
              request.selectedMethod?.includes("bni") ? "Bank BNI" :
              request.selectedMethod?.includes("permata") ? "Bank Permata" : "Bank BNI",
      paymentUrl: request.callbackUrl || "/dashboard?tab=tagihan",
      status: "pending",
      expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  async verifyWebhookSignature(_payload: unknown, _signature: string): Promise<boolean> {
    return true; // Simulasi: selalu valid
  }

  async parseWebhookPayload(payload: unknown, _headers: Record<string, string>): Promise<GatewayWebhookPayload> {
    const p = payload as Record<string, unknown>;
    return {
      provider: "simulated",
      raw: payload,
      orderId: p.order_id as string || p.invoiceNumber as string,
      transactionId: p.transaction_id as string || `SIM-${Date.now()}`,
      transactionStatus: (p.transaction_status as GatewayWebhookPayload["transactionStatus"]) || "success",
      paymentMethod: p.payment_type as string || "virtual_account",
      grossAmount: p.gross_amount ? Number(p.gross_amount) : undefined,
      paidAt: p.paid_at ? new Date(p.paid_at as string) : new Date(),
    };
  }

  async checkTransactionStatus(_transactionId: string): Promise<"pending" | "success" | "failed" | "expired" | "refund"> {
    return "success";
  }
}

/** Registry yang menyimpan semua provider yang terdaftar */
class GatewayRegistry {
  private providers: Map<string, PaymentGatewayProvider> = new Map();
  private activeProvider: PaymentGatewayProvider;

  constructor() {
    // Daftarkan provider Midtrans jika dikonfigurasi
    const midtrans = createMidtransProvider();
    if (midtrans) {
      this.register(midtrans);
    }

    // Selalu daftarkan provider simulasi sebagai fallback
    this.register(new SimulatedProvider());

    // Tentukan provider aktif
    const configuredProvider = process.env.PAYMENT_GATEWAY_PROVIDER || "simulated";
    const provider = this.providers.get(configuredProvider);
    if (provider) {
      this.activeProvider = provider;
    } else {
      // Fallback ke simulasi jika provider yang dikonfigurasi tidak tersedia
      this.activeProvider = this.providers.get("simulated")!;
      console.warn(
        `Payment gateway "${configuredProvider}" tidak tersedia. Fallback ke simulated. ` +
        `Available: ${Array.from(this.providers.keys()).join(", ")}`
      );
    }
  }

  /** Mendaftarkan provider baru */
  register(provider: PaymentGatewayProvider): void {
    this.providers.set(provider.name, provider);
  }

  /** Mendapatkan provider aktif */
  getActiveProvider(): PaymentGatewayProvider {
    return this.activeProvider;
  }

  /** Mengganti provider aktif */
  setActiveProvider(name: string): boolean {
    const provider = this.providers.get(name);
    if (provider) {
      this.activeProvider = provider;
      return true;
    }
    return false;
  }

  /** Mendapatkan semua provider yang terdaftar */
  getAllProviders(): PaymentGatewayProvider[] {
    return Array.from(this.providers.values());
  }

  /** Mendapatkan daftar metode pembayaran dari provider aktif */
  async getPaymentChannels(): Promise<PaymentChannel[]> {
    return this.activeProvider.getPaymentChannels();
  }

  /** Membuat transaksi via provider aktif */
  async createTransaction(request: CreateTransactionRequest): Promise<CreateTransactionResponse> {
    return this.activeProvider.createTransaction(request);
  }

  /** Parse webhook payload */
  async parseWebhookPayload(payload: unknown, headers: Record<string, string>): Promise<GatewayWebhookPayload> {
    // Coba deteksi provider dari header atau payload
    const providerHeader = headers["x-payment-provider"] || "";
    const providerFromPayload = (payload as Record<string, string>)["provider"] || "";
    const providerName = providerHeader || providerFromPayload;

    if (providerName && this.providers.has(providerName)) {
      return this.providers.get(providerName)!.parseWebhookPayload(payload, headers);
    }

    // Fallback ke provider aktif
    return this.activeProvider.parseWebhookPayload(payload, headers);
  }

  /** Verifikasi signature webhook */
  async verifyWebhookSignature(payload: unknown, signature: string, providerName?: string): Promise<boolean> {
    const provider = providerName ? this.providers.get(providerName) : this.activeProvider;
    if (!provider) return false;
    return provider.verifyWebhookSignature(payload, signature);
  }
}

/** Singleton instance */
let registry: GatewayRegistry | null = null;

export function getGatewayRegistry(): GatewayRegistry {
  if (!registry) {
    registry = new GatewayRegistry();
  }
  return registry;
}

export { GatewayRegistry };
export type { PaymentGatewayProvider, PaymentChannel, CreateTransactionRequest, CreateTransactionResponse, GatewayWebhookPayload };
