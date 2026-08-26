import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(16),
  SESSION_COOKIE_NAME: z.string().default("sanchari_session"),
  SESSION_TTL_HOURS: z.coerce.number().int().positive().default(168),
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),

  AI_PROVIDER: z.enum(["mock", "openai", "anthropic"]).default("mock"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-3-5-haiku-latest"),
  AI_MONTHLY_BUDGET_USD: z.coerce.number().default(25),

  MOCK_WEATHER: z.coerce.boolean().default(false),
  ROUTING_PROVIDER: z.string().default("osrm"),
  PAYMENT_PROVIDER: z.enum(["sandbox", "razorpay"]).default("sandbox"),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),

  EMAIL_PROVIDER: z.string().default("console"),
  SMS_PROVIDER: z.string().default("console"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
  throw new Error(`Invalid environment configuration → ${issues}`);
}

export const env = parsed.data;
export const isProd = process.env.NODE_ENV === "production";

export const aiProviderName = (): "openai" | "anthropic" | "mock" => {
  if (env.AI_PROVIDER === "openai" && env.OPENAI_API_KEY) return "openai";
  if (env.AI_PROVIDER === "anthropic" && env.ANTHROPIC_API_KEY) return "anthropic";
  return "mock";
};

export const paymentProviderName = () =>
  env.PAYMENT_PROVIDER === "razorpay" && env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET
    ? "razorpay"
    : "sandbox";
