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

type Turn = { role: "user" | "assistant"; content: string }

type ResponseBody = {
  message: string
  conversationId: string
  showNumberPicker: boolean
  showContinuationPicker: boolean
  previousTurns: Turn[]
  isReturning: boolean
  move?: string
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
    res.status(405).json({ message: "", conversationId: "", showNumberPicker: false, showContinuationPicker: false, previousTurns: [], isReturning: false, error: "Method not allowed" })
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

  // userText trækkes ud tidligt så den kan bruges i early-return-tjekket nedenfor
  const userText = typeof body?.userText === "string" ? body.userText.trim() : ""

  // ── Rent samtykke-kald (ingen userText, kun retentionDays) ─────────────────
  // Kør IKKE capability — det ville tilføje endnu en kopi af åbningshilsenen
  // til transcript og skrive overflødig state til Redis.
  if (typeof body?.retentionDays === "number" && !userText) {
    res.status(200).json({
      message: "",
      conversationId,
      showNumberPicker: false,
      showContinuationPicker: false,
      previousTurns: [],
      isReturning: false,
    })
    return
  }

  // ── State ───────────────────────────────────────────────────────────────────
  let state = canPersist ? await readConversationState(conversationId) : null
  const isReturning = state !== null && ((state.meta["ttm.turn_count"]?.value as number) ?? 0) > 0

  if (!state) {
    state = createTTMState(conversationId)
  }

  // ── Run capability ──────────────────────────────────────────────────────────
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
      showContinuationPicker: false,
      previousTurns: [],
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

    // Skriv til TTM-index så admin kan hente samtalen
    try {
      const { getRedisClient } = await import("../../chat/persistence/redis")
      const redis = getRedisClient()
      if (redis) {
        const TTM_INDEX_KEY = "gaarsdal:ttm:index"
        const convIdShort = conversationId.replace(/^ttm:/, "")
        await redis.zadd(TTM_INDEX_KEY, { score: Date.now(), member: convIdShort })
        await redis.expire(TTM_INDEX_KEY, ttlSeconds)
      }
    } catch {
      // Non-critical
    }
  }

  // ── showNumberPicker / showContinuationPicker ──────────────────────────────
  const ritualStage = nextMeta["ttm.ritual_stage"]?.value ?? "q1"
  const showNumberPicker = ritualStage === "q1" && assistantMessage.length > 0
  const showContinuationPicker = ritualStage === "continuation_check" && assistantMessage.length > 0

  // Hent de sidste 6 turns fra transcript til at vise som historik ved continuation
  let previousTurns: Turn[] = []
  if (showContinuationPicker) {
    const raw = nextMeta["ttm.transcript"]?.value
    if (Array.isArray(raw)) {
      previousTurns = (raw as Turn[])
        .filter((t) => t && (t.role === "user" || t.role === "assistant") && typeof t.content === "string" && t.content.trim().length > 0)
        .slice(-6)
    }
  }

  const move = (result as any).debug?.move ?? undefined

  res.status(200).json({
    message: assistantMessage,
    conversationId,
    showNumberPicker,
    showContinuationPicker,
    previousTurns,
    isReturning,
    move,
  })
}
