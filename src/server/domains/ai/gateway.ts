import { db } from "@/server/db";
import { env, aiProviderName, isProd } from "@/lib/env";
import { logger } from "@/lib/logger";
import { providerFor } from "./providers";
import { ASSISTANT_TOOLS, executeTool } from "./tools";
import type { AiMessage, CompletionRequest, CompletionResult } from "./types";

const MAX_TOOL_ITERATIONS = 3;

async function monthSpendUsd(): Promise<number> {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const agg = await db.aiUsageLog.aggregate({
    where: { createdAt: { gte: start }, estimatedCostUsd: { not: null } },
    _sum: { estimatedCostUsd: true },
  });
  return agg._sum.estimatedCostUsd ?? 0;
}

export type GatewayResult = CompletionResult & { degraded?: boolean; blockedReason?: string };

/**
 * AI Orchestrator: routing, budget guard, retries with backoff, structured
 * usage logging. Business logic never talks to a vendor SDK directly.
 */
export async function complete(req: CompletionRequest): Promise<GatewayResult> {
  const providerName = aiProviderName();
  const feature = req.feature;
  const startedAt = Date.now();

  if (providerName === "mock") {
    const res = await runProvider(providerFor(), req);
    await logUsage({ userId: req.userId, feature, result: res, latencyMs: Date.now() - startedAt });
    return res;
  }

  const spend = await monthSpendUsd();
  if (spend >= env.AI_MONTHLY_BUDGET_USD) {
    logger.warn("ai.budget_blocked", { spend, cap: env.AI_MONTHLY_BUDGET_USD });
    // Graceful degradation → deterministic engine keeps the product usable.
    const res = await runProvider(providerFor(), req);
    await logUsage({ userId: req.userId, feature, result: res, latencyMs: Date.now() - startedAt, status: "BLOCKED_BUDGET" });
    return { ...res, degraded: true, blockedReason: "AI budget reached — answered by built-in engine." };
  }

  let lastError: unknown = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await runProvider(providerFor(), req);
      await logUsage({ userId: req.userId, feature, result: res, latencyMs: Date.now() - startedAt });
      return res;
    } catch (e) {
      lastError = e;
      logger.warn("ai.attempt_failed", { attempt, error: String(e) });
      if (attempt === 1) await new Promise((r) => setTimeout(r, 400));
    }
  }
  logger.error("ai.failed_degrading", { error: String(lastError) });
  const res = await runProvider(providerFor(), req);
  await logUsage({ userId: req.userId, feature, result: res, latencyMs: Date.now() - startedAt, status: "ERROR" });
  return { ...res, degraded: true };
}

async function runProvider(p: ReturnType<typeof providerFor>, req: CompletionRequest): Promise<CompletionResult> {
  return p.complete(req);
}

async function logUsage(opts: {
  userId?: string | null;
  feature: string;
  result: CompletionResult;
  latencyMs: number;
  status?: string;
}) {
  try {
    await db.aiUsageLog.create({
      data: {
        userId: opts.userId ?? null,
        feature: opts.feature,
        provider: opts.result.provider,
        model: opts.result.model,
        promptTokens: opts.result.usage.promptTokens ?? null,
        completionTokens: opts.result.usage.completionTokens ?? null,
        latencyMs: opts.latencyMs,
        estimatedCostUsd: opts.result.usage.estimatedCostUsd ?? null,
        status: opts.status ?? "OK",
      },
    });
  } catch (e) {
    logger.warn("ai.usage_log_failed", { error: String(e) });
  }
}

export const SYSTEM_PROMPT = `You are Sanchari, the official AI travel assistant for Andhra Pradesh, India.

RULES:
- Ground every factual claim in tool results from the platform catalog. NEVER invent prices, timings, availability, or bookings.
- Distinguish clearly between: platform-verified information, live third-party info (weather), and general suggestions.
- Never claim a booking exists unless the booking system confirmed it.
- Be warm and concise. Prefer short bullet answers with links like /destinations/<slug>.
- Support Telugu, English and Hindi; reply in the user's language.
- Fashion-free zone: you only discuss travel in Andhra Pradesh.
- If information is unavailable, say so honestly and suggest what IS available.`;

/** Full assistant turn with the grounded tool loop. */
export async function assistantTurn(opts: {
  sessionId: string;
  userId: string | null;
  userMessage: string;
  language?: string;
}): Promise<{ conversationId: string; answer: string; degraded: boolean }> {
  const existing = await db.chatConversation.findFirst({
    where: { sessionId: opts.sessionId },
    orderBy: { updatedAt: "desc" },
    include: { messages: { orderBy: { createdAt: "asc" }, take: 12 } },
  });
  const conversation =
    existing ??
    (await db.chatConversation.create({
      data: { sessionId: opts.sessionId, userId: opts.userId ?? null, language: opts.language ?? "en" },
      include: { messages: true },
    }));
  if (existing && opts.language) {
    await db.chatConversation.update({ where: { id: existing.id }, data: { language: opts.language } });
  }

  await db.chatMessage.create({
    data: { conversationId: conversation.id, role: "USER", content: opts.userMessage.slice(0, 2000) },
  });

  const history: AiMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...conversation.messages.slice(-8).map((m) => ({ role: m.role.toLowerCase() as "user" | "assistant", content: m.content })),
    { role: "user", content: opts.userMessage },
  ];

  const res = await complete({
    messages: history,
    tools: ASSISTANT_TOOLS,
    feature: "ASSISTANT",
    userId: opts.userId,
  });

  let answer = res.text;
  let messages = history;

  for (let i = 0; i < MAX_TOOL_ITERATIONS && res.toolCalls.length > 0; i++) {
    for (const call of res.toolCalls) {
      const output = await executeTool(call.name, call.argumentsJson);
      messages = [...messages, { role: "tool", content: JSON.stringify(output), toolCallId: call.id, toolName: call.name }];
    }
    const nextRes = await complete({ messages, tools: ASSISTANT_TOOLS, feature: "ASSISTANT", userId: opts.userId });
    if (nextRes.text) {
      answer = nextRes.text;
      break;
    }
  }

  const finalAnswer = answer?.trim() || "I'm here to help you explore Andhra Pradesh. What would you like to know?";
  await db.chatMessage.create({
    data: {
      conversationId: conversation.id,
      role: "ASSISTANT",
      content: finalAnswer,
      toolName: res.toolCalls[0]?.name,
      toolPayload: res.degraded ? ({ degraded: true } as never) : undefined,
    },
  });
  void isProd;
  return { conversationId: conversation.id, answer: finalAnswer, degraded: Boolean(res.degraded) };
}
