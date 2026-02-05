import { LlmChatInput, LlmClient } from "./types"

function safeJsonParse(content: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(content)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null
    }
    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}

export function createOpenAiCompatibleClient(): LlmClient {
  return {
    async chatJson(input: LlmChatInput): Promise<Record<string, unknown> | null> {
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
    },
  }
}
