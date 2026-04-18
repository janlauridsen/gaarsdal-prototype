import { ConversationState, Transition } from "../kernel/types"

export type LlmChatMessage = {
  role: "system" | "user" | "assistant"
  content: string
}

export type LlmChatInput = {
  model: string
  temperature: number
  response_format?: { type: "json_object" }
  messages: LlmChatMessage[]
}

export type LlmClient = {
  chatJson(input: LlmChatInput): Promise<Record<string, unknown> | null>
}

export type AiCapabilityContext = {
  state: ConversationState
  userText: string
  contextPack?: {
    system: string
    user_profile?: string
    goal_hypothesis?: string | null
    rhetorical_instruction?: string | null
  }
}

export type AiCapabilityResult = {
  transition: Transition
  debug: {
    capability: string
    used_fallback: boolean
  }
}

export type AiCapability = {
  id: string
  run(context: AiCapabilityContext, llm: LlmClient): Promise<AiCapabilityResult>
}
