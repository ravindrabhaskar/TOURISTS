import crypto from "crypto";
import { db } from "@/server/db";
import { ok, fail } from "@/lib/http";
import { logger } from "@/lib/logger";
import { paymentAdapter } from "@/server/integrations/payments";
import { confirmPayment, failPayment } from "@/server/domains/bookings";

type RazorpayWebhook = {
  event: string;
  payload?: {
    payment?: { entity?: { id?: string; order_id?: string; method?: string } };
  };
};

/** Provider webhook. Signature-verified and idempotent via WebhookEvent table.
 * Configure the same AUTH-derived secret in the provider dashboard (sandbox:
 * simulated by the /pay page calling confirmPayment directly). */
export async function POST(req: Request) {
  try {
    const raw = await req.text();
    const signature = req.headers.get("x-razorpay-signature") ?? "";
    const secret = process.env.RAZORPAY_KEY_SECRET ?? "";
    if (!secret) return Response.json({ ok: false, error: { code: "NOT_CONFIGURED" } }, { status: 503 });

    const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
    if (signature !== expected || !signature) {
      logger.warn("payments.webhook_bad_signature");
      return Response.json({ ok: false, error: { code: "BAD_SIGNATURE" } }, { status: 401 });
    }

    const body = JSON.parse(raw) as RazorpayWebhook;
    const externalId = String((body as unknown as { id?: string }).id ?? `${body.event}:${Date.now()}`);
    const dup = await db.webhookEvent.findUnique({ where: { provider_externalId: { provider: "razorpay", externalId } } });
    if (dup) return Response.json({ ok: true, data: { status: "SKIPPED_DUPLICATE" } });

    await db.webhookEvent.create({
      data: { provider: "razorpay", externalId, payload: body as never },
    });

    const entity = body.payload?.payment?.entity;
    if (body.event === "payment.captured" && entity?.order_id && entity.id) {
      // Live adapter verification path — re-verifies order/payment binding.
      const adapter = paymentAdapter();
      if (adapter.isLive()) {
        await confirmPayment("razorpay", entity.order_id, entity.id, signature);
      }
    } else if (body.event === "payment.failed" && entity?.order_id) {
      await failPayment("razorpay", entity.order_id, "Provider reported failure");
    }

    return ok({ processed: true });
  } catch (e) {
    return fail(e);
  }
}

export const dynamic = "force-dynamic";
