export type AiRole = "system" | "user" | "assistant" | "tool";

export type AiMessage = {
  role: AiRole;
  content: string;
  toolCallId?: string;
  toolName?: string;
};

export type ToolSpec = {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required?: string[];
  };
};

export type ToolCall = { id: string; name: string; argumentsJson: string };

export type CompletionRequest = {
  messages: AiMessage[];
  tools?: ToolSpec[];
  temperature?: number;
  maxTokens?: number;
  feature: "ASSISTANT" | "PLANNER" | "EXPLAIN" | "MODIFY";
  userId?: string | null;
};

export type CompletionUsage = { promptTokens?: number; completionTokens?: number; estimatedCostUsd?: number };

export type CompletionResult = {
  text: string | null;
  toolCalls: ToolCall[];
  usage: CompletionUsage;
  provider: string;
  model: string;
};

export interface LlmProvider {
  name: string;
  model: string;
  complete(req: CompletionRequest): Promise<CompletionResult>;
}

export class ProviderUnavailableError extends Error {}
