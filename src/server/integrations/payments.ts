import crypto from "crypto";

export type CreateOrderInput = {
  amountRupees: number;
  reference: string;
  notes?: Record<string, string>;
};

export type ProviderOrder = {
  providerOrderId: string;
  provider: string;
  checkoutUrl?: string | null; // hosted page when the provider supplies one
};

export interface PaymentProviderAdapter {
  name: string;
  isLive(): boolean;
  createOrder(input: CreateOrderInput): Promise<ProviderOrder>;
  /** Verify webhook/callback signature — MUST be implemented by every real adapter. */
  verifySignature(payload: { orderId: string; paymentId: string; signature: string }): boolean;
}

/** Sandbox adapter: deterministic local simulation for development/demo.
 * Clearly surfaced as SANDBOX in all UI. Signatures use a local dev secret
 * derived from AUTH_SECRET so the verification code path is genuinely exercised. */
class SandboxAdapter implements PaymentProviderAdapter {
  name = "sandbox";
  isLive() {
    return false;
  }
  async createOrder(): Promise<ProviderOrder> {
    const id = `sbx_order_${crypto.randomBytes(8).toString("hex")}`;
    return { providerOrderId: id, provider: this.name, checkoutUrl: `/checkout/sandbox/${id}` };
  }
  verifySignature(payload: { orderId: string; paymentId: string; signature: string }): boolean {
    return payload.signature === signSandbox(payload.orderId, payload.paymentId);
  }
}

export function signSandbox(orderId: string, paymentId: string): string {
  const secret = process.env.AUTH_SECRET ?? "sanchari-dev-secret";
  return crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
}

/** Razorpay adapter — active only when keys are configured.
 * Order creation via REST API; signature per official spec:
 * HMAC_SHA256(order_id + "|" + payment_id, key_secret). */
class RazorpayAdapter implements PaymentProviderAdapter {
  name = "razorpay";
  isLive() {
    return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  }
  async createOrder(input: CreateOrderInput): Promise<ProviderOrder> {
    const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Basic ${auth}` },
      body: JSON.stringify({
        amount: input.amountRupees * 100, // paise at the adapter boundary only
        currency: "INR",
        receipt: input.reference,
        notes: input.notes ?? {},
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`razorpay order failed ${res.status}`);
    const j = (await res.json()) as { id: string };
    return { providerOrderId: j.id, provider: this.name };
  }
  verifySignature(payload: { orderId: string; paymentId: string; signature: string }): boolean {
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${payload.orderId}|${payload.paymentId}`)
      .digest("hex");
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(payload.signature));
  }
  /** Webhook signature differs from callback signature in Razorpay. */
  verifyWebhook(rawBody: string, signature: string, secret: string): boolean {
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    return expected === signature;
  }
}

export function paymentAdapter(): PaymentProviderAdapter {
  return new RazorpayAdapter().isLive() ? new RazorpayAdapter() : new SandboxAdapter();
}
