import { env, aiProviderName } from "@/lib/env";
import { mockProvider } from "./mock";
import type { CompletionRequest, CompletionResult, LlmProvider } from "../types";

type OpenAiToolCall = {
  id: string;
  function: { name: string; arguments: string };
};

export const openAiProvider: LlmProvider = {
  name: "openai",
  model: env.OPENAI_MODEL,
  async complete(req: CompletionRequest): Promise<CompletionResult> {
    const body: Record<string, unknown> = {
      model: env.OPENAI_MODEL,
      messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: req.temperature ?? 0.4,
      max_tokens: req.maxTokens ?? 900,
    };
    if (req.tools?.length) {
      body.tools = req.tools.map((t) => ({
        type: "function",
        function: { name: t.name, description: t.description, parameters: t.parameters },
      }));
    }
    const toolMsgs = req.messages.filter((m) => m.role === "tool");
    if (toolMsgs.length) {
      body.messages = [
        ...req.messages
          .filter((m) => m.role !== "tool")
          .map((m) =>
            m.role === "assistant" && (m.toolName || m.toolCallId)
              ? { role: "assistant", content: null, tool_calls: [{ id: m.toolCallId, function: { name: m.toolName!, arguments: "{}" } }] }
              : { role: m.role, content: m.content },
          ),
        ...toolMsgs.map((m) => ({ role: "tool", tool_call_id: m.toolCallId, content: m.content })),
      ];
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${env.OPENAI_API_KEY}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(`openai ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const j = (await res.json()) as {
      choices: Array<{ message: { content: string | null; tool_calls?: OpenAiToolCall[] } }>;
      usage?: { prompt_tokens: number; completion_tokens: number };
    };
    const msg = j.choices[0]?.message;
    return {
      text: msg?.content ?? null,
      toolCalls:
        msg?.tool_calls?.map((tc) => ({ id: tc.id, name: tc.function.name, argumentsJson: tc.function.arguments })) ?? [],
      usage: {
        promptTokens: j.usage?.prompt_tokens,
        completionTokens: j.usage?.completion_tokens,
        estimatedCostUsd: estimateCost(env.OPENAI_MODEL, j.usage?.prompt_tokens ?? 0, j.usage?.completion_tokens ?? 0),
      },
      provider: this.name,
      model: env.OPENAI_MODEL,
    };
  },
};

// Rough public pricing map — kept coarse; real billing comes from the provider console.
const USD_PER_1K: Record<string, [number, number]> = {
  "gpt-4o-mini": [0.00015, 0.0006],
};
function estimateCost(model: string, promptTokens: number, completionTokens: number): number {
  const [pIn, pOut] = USD_PER_1K[model] ?? [0.001, 0.002];
  return (promptTokens / 1000) * pIn + (completionTokens / 1000) * pOut;
}

export const anthropicProvider: LlmProvider = {
  name: "anthropic",
  model: env.ANTHROPIC_MODEL,
  async complete(req: CompletionRequest): Promise<CompletionResult> {
    const system = req.messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
    const convo = req.messages.filter((m) => m.role !== "system");
    const body: Record<string, unknown> = {
      model: env.ANTHROPIC_MODEL,
      system,
      max_tokens: req.maxTokens ?? 1024,
      temperature: req.temperature ?? 0.4,
      messages: convo.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
    };
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(`anthropic ${res.status}`);
    const j = (await res.json()) as {
      content: Array<{ type: string; text?: string }>;
      usage: { input_tokens: number; output_tokens: number };
    };
    const text = j.content.find((c) => c.type === "text")?.text ?? null;
    return {
      text,
      toolCalls: [],
      usage: { promptTokens: j.usage.input_tokens, completionTokens: j.usage.output_tokens },
      provider: this.name,
      model: env.ANTHROPIC_MODEL,
    };
  },
};

export function providerFor(): LlmProvider {
  switch (aiProviderName()) {
    case "openai":
      return openAiProvider;
    case "anthropic":
      return anthropicProvider;
    default:
      return mockProvider;
  }
}
