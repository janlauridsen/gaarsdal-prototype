import { LlmChatInput, LlmClient } from "./types"

function safeJsonParse(content: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(content)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null
    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}

// Supports both OpenAI-compatible APIs and Anthropic native API
// Switch between providers via env vars:
//   OPENAI_API_KEY + OPENAI_BASE_URL  → OpenAI / OpenAI-compatible
//   ANTHROPIC_API_KEY                 → Anthropic native (claude-* models)
//
// Model override: HYPNO_MODEL=claude-haiku-4-5-20251001 (or any model string)

function isAnthropicModel(model: string): boolean {
  return model.startsWith("claude-")
}

async function callOpenAiCompatible(input: LlmChatInput): Promise<Record<string, unknown> | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1"
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(input),
  })

  if (!response.ok) return null

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content
  if (typeof content !== "string") return null
  return safeJsonParse(content)
}

async function callAnthropicNative(input: LlmChatInput): Promise<Record<string, unknown> | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  // Separate system messages from user/assistant turns
  const systemMessages = input.messages.filter((m) => m.role === "system")
  const conversationMessages = input.messages.filter((m) => m.role !== "system")

  const systemContent = systemMessages.map((m) => m.content).join("\n\n")

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: input.model,
      max_tokens: 1024,
      temperature: input.temperature,
      system: systemContent || undefined,
      messages: conversationMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    }),
  })

  if (!response.ok) return null

  const data = await response.json()
  const content = data?.content?.[0]?.text
  if (typeof content !== "string") return null
  return safeJsonParse(content)
}

export function createOpenAiCompatibleClient(): LlmClient {
  return {
    async chatJson(input: LlmChatInput): Promise<Record<string, unknown> | null> {
      // Route to Anthropic native if model is a Claude model and ANTHROPIC_API_KEY is set
      if (isAnthropicModel(input.model) && process.env.ANTHROPIC_API_KEY) {
        return callAnthropicNative(input)
      }
      return callOpenAiCompatible(input)
    },
  }
}
