export type Money = {
  amount: number;
  currency: string;
};

export type PaymentProviderName = "stripe" | "mpesa" | "manual";

export type PaymentAuthorization = {
  provider: PaymentProviderName;
  reference: string;
  status: "authorized" | "requires_action";
  amount: Money;
  metadata?: Record<string, string>;
};

export type PaymentProvider = {
  authorize(input: {
    bookingId: string;
    customerId?: string;
    amount: Money;
    deposit: Money;
  }): Promise<PaymentAuthorization>;
  capture(input: { reference: string; amount: Money }): Promise<void>;
  release(input: { reference: string }): Promise<void>;
};

class ManualProvider implements PaymentProvider {
  async authorize(input: {
    bookingId: string;
    amount: Money;
    deposit: Money;
  }): Promise<PaymentAuthorization> {
    return {
      provider: "manual",
      reference: `manual_${input.bookingId}`,
      status: "authorized",
      amount: input.amount,
      metadata: {
        depositAmount: String(input.deposit.amount),
      },
    };
  }

  async capture() {
    return;
  }

  async release() {
    return;
  }
}

export function getPaymentProvider(): PaymentProvider {
  const provider = process.env.PAYMENT_PROVIDER as PaymentProviderName | undefined;

  if (provider === "stripe") {
    // Stripe wiring lives behind this interface so M-Pesa can be added without
    // changing booking state transitions.
    return new ManualProvider();
  }

  if (provider === "mpesa") {
    return new ManualProvider();
  }

  return new ManualProvider();
}

export function calculateBookingFees(subtotal: number, depositAmount: number) {
  const clientFeeRate = Number(process.env.CLIENT_SERVICE_FEE_PERCENTAGE ?? 12) / 100;
  const ownerFeeRate = Number(process.env.OWNER_SERVICE_FEE_PERCENTAGE ?? 3) / 100;
  const clientServiceFee = subtotal * clientFeeRate;
  const ownerServiceFee = subtotal * ownerFeeRate;

  return {
    clientServiceFee,
    ownerServiceFee,
    authorizedTotal: subtotal + clientServiceFee + depositAmount,
    ownerPayout: subtotal - ownerServiceFee,
  };
}
