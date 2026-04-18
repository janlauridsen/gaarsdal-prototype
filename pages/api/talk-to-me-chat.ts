// pages/api/talk-to-me-chat.ts
// Isoleret API-endpoint for TTM — Talk To Me.
// Deler ingen logik med /api/chat eller hypno-flowet.

import type { NextApiRequest, NextApiResponse } from "next"
import { setWidgetCors } from "./_utils/cors"
import { ensureUserKey } from "./_utils/auth"
import { newUuid } from "../../chat/utils/ids"
import { readConsent, writeConsent, consentAllowsPersistence, consentTtlSeconds, type ConsentRetentionDays } from "../../chat/consent/store"
import { readConversationState, writeConversationState } from "../../chat/persistence/conversationStateStore"
import { talkToMeCapability } from "../../chat/ai/capabilities/talkToMe"
import { createOpenAiCompatibleClient } from "../../chat/ai/provider"
import type { ConversationState } from "../../chat/kernel/types"
import { SESSION_TTL_SECONDS } from "../../chat/utils/ttl"

export const config = { maxDuration: 30 }

const TTM_CONV_PREFIX = "ttm:"

function createTTMState(conversationId: string): ConversationState {
  return {
    conversation_id: conversationId,
    revision: 0,
    active_node: "TALK_TO_ME",
    active_node_message: "",
    allowed_transitions: ["TALK_TO_ME", "CRISIS_INFO"],
    meta: {},
    status: "active",
    parentese_stack: [],
  }
}

type RequestBody = {
  userText?: string
  conversationId?: string
  retentionDays?: ConsentRetentionDays
}

type ResponseBody = {
  message: string
  conversationId: string
  showNumberPicker: boolean
  isReturning: boolean
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseBody>
) {
  setWidgetCors(req, res, "POST, OPTIONS")

  if (req.method === "OPTIONS") {
    res.status(200).end()
    return
  }

  if (req.method !== "POST") {
    res.status(405).json({ message: "", conversationId: "", showNumberPicker: false, isReturning: false, error: "Method not allowed" })
    return
  }

  const userKey = ensureUserKey(req, res)

  // ── Samtykke ────────────────────────────────────────────────────────────────
  let consentRecord = await readConsent(userKey)

  // Håndtér samtykke-svar fra frontend
  const body = req.body as RequestBody
  if (typeof body?.retentionDays === "number") {
    const newRecord = {
      version: 1 as const,
      allowed: true,
      retentionDays: body.retentionDays as ConsentRetentionDays,
      consentedAt: new Date().toISOString(),
    }
    await writeConsent(userKey, newRecord)
    consentRecord = newRecord
  }

  const canPersist = consentAllowsPersistence(consentRecord)
  const ttlSeconds = consentRecord ? consentTtlSeconds(consentRecord) : SESSION_TTL_SECONDS

  // ── Conversation ID ─────────────────────────────────────────────────────────
  const rawConvId = typeof body?.conversationId === "string" ? body.conversationId.trim() : ""
  const conversationId = rawConvId.startsWith(TTM_CONV_PREFIX) && rawConvId.length > 8
    ? rawConvId
    : `${TTM_CONV_PREFIX}${newUuid()}`

  // ── State ───────────────────────────────────────────────────────────────────
  let state = canPersist ? await readConversationState(conversationId) : null
  const isReturning = state !== null && ((state.meta["ttm.turn_count"]?.value as number) ?? 0) > 0

  if (!state) {
    state = createTTMState(conversationId)
  }

  // ── Run capability ──────────────────────────────────────────────────────────
  const userText = typeof body?.userText === "string" ? body.userText.trim() : ""

  const llm = createOpenAiCompatibleClient()
  let result: Awaited<ReturnType<typeof talkToMeCapability.run>>

  try {
    result = await talkToMeCapability.run(
      { state, userText, contextPack: undefined },
      llm
    )
  } catch (err) {
    console.error("[TTM] capability fejlede", String(err))
    res.status(500).json({
      message: "Noget gik galt. Prøv igen.",
      conversationId,
      showNumberPicker: false,
      isReturning,
      error: "capability_error",
    })
    return
  }

  // ── Opdatér state med transition ────────────────────────────────────────────
  const { transition } = result
  const assistantMessage = transition.response_message ?? ""

  const nextNode = transition.to ?? state.active_node
  const metaDelta = (transition as any).meta_delta ?? {}

  const nextMeta: ConversationState["meta"] = { ...state.meta }
  for (const [k, v] of Object.entries(metaDelta)) {
    nextMeta[k] = v as any
  }

  const nextState: ConversationState = {
    ...state,
    revision: state.revision + 1,
    active_node: nextNode,
    active_node_message: assistantMessage,
    meta: nextMeta,
  }

  // ── Persist ─────────────────────────────────────────────────────────────────
  if (canPersist) {
    await writeConversationState(nextState, ttlSeconds).catch(() => {})
  }

  // ── showNumberPicker: vis talvælger når Q1 stilles ──────────────────────────
  const ritualStage = nextMeta["ttm.ritual_stage"]?.value ?? "q1"
  const showNumberPicker = ritualStage === "q1" && assistantMessage.length > 0

  res.status(200).json({
    message: assistantMessage,
    conversationId,
    showNumberPicker,
    isReturning,
  })
}
