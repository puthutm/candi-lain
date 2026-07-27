import { PaymentProvider, PaymentChannel } from "./gateway-types";
import { MidtransProvider } from "./midtrans-provider";

class GatewayRegistry {
  private providers: Map<string, PaymentProvider> = new Map();
  private defaultProvider: string = "simulated";

  constructor() {
    this.registerDefault();
  }

  private registerDefault() {
    // Register simulated provider for development/testing
    this.register("simulated", {
      async createTransaction(req) {
        return {
          token: `sim_${Date.now()}`,
          redirectUrl: `https://simulator.example.com/pay/${req.orderId}`,
          transactionId: `sim_trx_${Date.now()}`,
        };
      },
      verifyNotification(body: any) {
        return {
          transactionId: body.transaction_id || `sim_trx_${Date.now()}`,
          orderId: body.order_id,
          transactionStatus: "settlement",
          fraudStatus: "accept",
          grossAmount: body.gross_amount || "0",
          paymentType: body.payment_type || "virtual_account",
          transactionTime: new Date().toISOString(),
          signatureKey: "simulated",
        };
      },
      async getAvailableChannels() {
        return [
          { code: "bca_va", name: "BCA Virtual Account", type: "virtual_account" },
          { code: "bni_va", name: "BNI Virtual Account", type: "virtual_account" },
          { code: "bri_va", name: "BRI Virtual Account", type: "virtual_account" },
          { code: "mandiri_va", name: "Mandiri Bill Payment", type: "virtual_account" },
          { code: "qris", name: "QRIS", type: "qris" },
        ];
      },
    });
  }

  register(name: string, provider: PaymentProvider) {
    this.providers.set(name, provider);
  }

  getProvider(name?: string): PaymentProvider {
    const providerName = name || this.defaultProvider;
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Payment provider "${providerName}" not registered`);
    }
    return provider;
  }

  setDefaultProvider(name: string) {
    if (!this.providers.has(name)) {
      throw new Error(`Cannot set default: provider "${name}" not registered`);
    }
    this.defaultProvider = name;
  }

  async getAvailableChannels(providerName?: string): Promise<PaymentChannel[]> {
    const provider = this.getProvider(providerName);
    return provider.getAvailableChannels();
  }
}

export const gatewayRegistry = new GatewayRegistry();

// Try to register Midtrans if server key is available
export function initializePaymentGateway() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const clientKey = process.env.MIDTRANS_CLIENT_KEY;
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

  if (serverKey && clientKey) {
    const midtrans = new MidtransProvider({
      serverKey,
      clientKey,
      isProduction,
    });
    gatewayRegistry.register("midtrans", midtrans);
    gatewayRegistry.setDefaultProvider("midtrans");
    console.log("[Payment Gateway] Midtrans registered as default provider");
  } else {
    console.log("[Payment Gateway] Using simulated provider (MIDTRANS keys not configured)");
  }
}
