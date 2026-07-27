export interface PaymentGatewayConfig {
  provider: "midtrans" | "simulated";
  isProduction: boolean;
  clientKey: string;
  serverKey: string;
}

export interface CreateTransactionRequest {
  orderId: string;
  grossAmount: number;
  customerDetails: {
    firstName: string;
    lastName?: string;
    email: string;
    phone?: string;
  };
  itemDetails: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}

export interface CreateTransactionResponse {
  token: string;
  redirectUrl: string;
  transactionId: string;
}

export interface PaymentChannel {
  code: string;
  name: string;
  type: "virtual_account" | "qris" | "credit_card" | "bank_transfer";
  icon?: string;
}

export interface PaymentNotification {
  transactionId: string;
  orderId: string;
  transactionStatus: "capture" | "settlement" | "pending" | "deny" | "cancel" | "expire" | "failure";
  fraudStatus: "accept" | "deny" | "challenge";
  grossAmount: string;
  paymentType: string;
  transactionTime: string;
  vaNumbers?: Array<{
    bank: string;
    vaNumber: string;
  }>;
  signatureKey: string;
}

export interface PaymentProvider {
  createTransaction(req: CreateTransactionRequest): Promise<CreateTransactionResponse>;
  verifyNotification(body: any): PaymentNotification;
  getAvailableChannels(): Promise<PaymentChannel[]>;
}
