// pages/api/talk-to-me-chat.ts
// Isoleret API-endpoint for TTM — Talk To Me.
// Deler ingen logik med /api/chat eller hypno-flowet.

import type { NextApiRequest, NextApiResponse } from "next"

// waitUntil: holder serverless-funktionen i live til compression er færdig
const waitUntil: (p: Promise<unknown>) => void =
  (globalThis as any)[Symbol.for("vercel.waitUntil")] ??
  ((p: Promise<unknown>) => { p.catch((e) => console.error("[TTM waitUntil]", e)) })
import { setWidgetCors } from "./_utils/cors"
import { ensureUserKey } from "./_utils/auth"
import { newUuid } from "../../chat/utils/ids"
import { readConsent, writeConsent, consentAllowsPersistence, consentTtlSeconds, type ConsentRetentionDays } from "../../chat/consent/store"
import { readConversationState, writeConversationState } from "../../chat/persistence/conversationStateStore"
import { talkToMeCapability, compressTtmTranscriptIfNeeded, runTTMWithPersona } from "../../chat/ai/capabilities/talkToMe"
import { createOpenAiCompatibleClient } from "../../chat/ai/provider"
import type { ConversationState } from "../../chat/kernel/types"
import { SESSION_TTL_SECONDS } from "../../chat/utils/ttl"
import { readPersonaState, writePersonaState } from "../../chat/persona/store"
import { applyPersonaDelta, parsePersonaDelta } from "../../chat/persona/prompt"
import type { PersonaState, PersonaValues } from "../../chat/persona/types"
import { DEFAULT_PERSONA_VALUES, PERSONA_KEYS } from "../../chat/persona/types"

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
  personaUserValues?: Partial<PersonaValues>   // bruger-slider-værdier fra frontend
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
  personaState?: PersonaState
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseBody>
) {
  setWidgetCors(req, res, "POST, DELETE, OPTIONS")

  if (req.method === "OPTIONS") {
    res.status(200).end()
    return
  }

  // ── Hard reset (DELETE) ────────────────────────────────────────────────────
  if (req.method === "DELETE") {
    const userKey = ensureUserKey(req, res)
    if (!userKey) return
    const body = req.body ?? {}
    const rawConvId = typeof body?.conversationId === "string" ? body.conversationId.trim() : ""
    if (rawConvId.startsWith(TTM_CONV_PREFIX)) {
      const shortId = rawConvId.replace(/^ttm:/, "")
      try {
        const { getRedisClient } = await import("../../chat/persistence/redis")
        const redis = getRedisClient()
        if (redis) {
          await Promise.all([
            redis.del(`gaarsdal:state:${rawConvId}`),
            redis.zrem("gaarsdal:ttm:index", shortId),
          ])
        }
      } catch (e) {
        console.error("[TTM hard reset]", e)
      }
    }
    res.status(200).json({ message: "", conversationId: rawConvId, showNumberPicker: false, showContinuationPicker: false, previousTurns: [], isReturning: false })
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

  // ── Persona state ───────────────────────────────────────────────────────────
  let personaState: PersonaState = await readPersonaState(conversationId)

  // Opdatér bruger-slider-værdier hvis sendt fra frontend
  if (body?.personaUserValues && typeof body.personaUserValues === "object") {
    const incoming = body.personaUserValues as Record<string, unknown>
    const nextUser = { ...personaState.user }
    for (const k of PERSONA_KEYS) {
      const v = incoming[k]
      if (typeof v === "number" && v >= 1 && v <= 5) {
        nextUser[k] = Math.round(v)
      }
    }
    personaState = { ...personaState, user: nextUser, updatedAt: Date.now() }
  }

  // ── Run capability ──────────────────────────────────────────────────────────
  const llm = createOpenAiCompatibleClient()
  let result: Awaited<ReturnType<typeof runTTMWithPersona>>

  try {
    result = await runTTMWithPersona(
      { state, userText, contextPack: undefined },
      llm,
      personaState
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

  // ── Opdatér personaState med Ida's delta ────────────────────────────────────
  const debugAny = result.debug as any
  if (debugAny?.personaDelta && Object.keys(debugAny.personaDelta).length > 0) {
    const newIdaValues = applyPersonaDelta(
      personaState.user,
      personaState.ida,
      debugAny.personaDelta
    )
    personaState = {
      ...personaState,
      ida: newIdaValues,
      idaReason: debugAny.idaReason ?? "",
      updatedAt: Date.now(),
    }
  }

  // ── Persist ─────────────────────────────────────────────────────────────────
  if (canPersist) {
    await writeConversationState(nextState, ttlSeconds).catch(() => {})
    await writePersonaState(conversationId, personaState, ttlSeconds).catch(() => {})

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
    personaState,
  })

  // ── Post-response: komprimér transcript hvis >= 10 rå ture ─────────────────
  if (canPersist && userText) {
    waitUntil(
      compressTtmTranscriptIfNeeded({
        conversationId,
        userKey,
        canPersist,
        ttlSeconds,
      })
    )
  }
}
