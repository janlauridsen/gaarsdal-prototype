import crypto from "crypto"

import { Transition } from "../../kernel/types"
import { AiCapability, AiCapabilityContext, AiCapabilityResult, LlmClient } from "../types"

type JournalProfile = "alcohol" | "general" | "strict"

type ParsedInput = {
  profile?: JournalProfile
  text?: string
  ts_ms?: number
  drinks?: number
  urge_0_10?: number
  strict_0_10?: number

  // alcohol v2 (optional)
  mood_tag?: string
  mood_0_10?: number
  trigger_tag?: string
  context_tag?: string
  coping_tag?: string
  action?: string
  craving_peak_0_10?: number
  craving_duration_min?: number
}

export type JournalEntry = {
  entry_id: string
  ts_ms: number
  schema_version: "v1" | "v2"
  kind: JournalProfile
  text?: string
  fields?: {
    drinks?: number
    urge_0_10?: number
    strict_0_10?: number

    // alcohol v2 (optional)
    mood_tag?: string
    mood_0_10?: number
    trigger_tag?: string
    context_tag?: string
    coping_tag?: string
    action?: string
    craving_peak_0_10?: number
    craving_duration_min?: number
  }
}

function safeParseJson(input: string): ParsedInput | null {
  const t = (input ?? "").trim()
  if (!t) return null
  if (!(t.startsWith("{") && t.endsWith("}"))) return null
  try {
    const v = JSON.parse(t)
    if (!v || typeof v !== "object") return null
    const obj = v as any
    const out: ParsedInput = {}
    if (typeof obj.profile === "string") {
      const p = String(obj.profile)
      if (p === "alcohol" || p === "general" || p === "strict") out.profile = p
    }
    if (typeof obj.text === "string") out.text = obj.text
    if (typeof obj.ts_ms === "number" && Number.isFinite(obj.ts_ms)) out.ts_ms = obj.ts_ms
    if (typeof obj.drinks === "number" && Number.isFinite(obj.drinks)) out.drinks = obj.drinks
    if (typeof obj.urge_0_10 === "number" && Number.isFinite(obj.urge_0_10)) out.urge_0_10 = obj.urge_0_10
    if (typeof obj.strict_0_10 === "number" && Number.isFinite(obj.strict_0_10)) out.strict_0_10 = obj.strict_0_10

    // alcohol v2 optional fields
    if (typeof obj.mood_tag === "string") out.mood_tag = obj.mood_tag
    if (typeof obj.mood_0_10 === "number" && Number.isFinite(obj.mood_0_10)) out.mood_0_10 = obj.mood_0_10
    if (typeof obj.trigger_tag === "string") out.trigger_tag = obj.trigger_tag
    if (typeof obj.context_tag === "string") out.context_tag = obj.context_tag
    if (typeof obj.coping_tag === "string") out.coping_tag = obj.coping_tag
    if (typeof obj.action === "string") out.action = obj.action
    if (typeof obj.craving_peak_0_10 === "number" && Number.isFinite(obj.craving_peak_0_10)) out.craving_peak_0_10 = obj.craving_peak_0_10
    if (typeof obj.craving_duration_min === "number" && Number.isFinite(obj.craving_duration_min)) out.craving_duration_min = obj.craving_duration_min
    return out
  } catch {
    return null
  }
}

function clampTsMs(ts: number): number {
  // Allow backdating, but keep a sane range to avoid accidental year 1970 or far future.
  const min = Date.UTC(2000, 0, 1)
  const max = Date.now() + 24 * 60 * 60 * 1000
  if (!Number.isFinite(ts)) return Date.now()
  if (ts < min) return min
  if (ts > max) return Date.now()
  return Math.trunc(ts)
}

function clampTag(s: string): string | undefined {
  const t = (s ?? "").trim()
  if (!t) return undefined
  return t.slice(0, 40)
}

function clampInt(n: number, min: number, max: number): number {
  const x = Math.trunc(n)
  if (x < min) return min
  if (x > max) return max
  return x
}

function readProfileFromConfig(context: AiCapabilityContext): JournalProfile {
  const cfg = (context.state.meta as any)?.["journal.config"]?.value
  const p = cfg && typeof cfg === "object" ? String((cfg as any).profile ?? "") : ""
  if (p === "alcohol" || p === "general" || p === "strict") return p
  return "general"
}

export const diaryCapability: AiCapability = {
  id: "diary-v1",
  async run(context: AiCapabilityContext, _llm: LlmClient): Promise<AiCapabilityResult> {
    const parsed = safeParseJson(context.userText ?? "")
    const profile: JournalProfile = parsed?.profile ?? readProfileFromConfig(context)

    const text = (parsed?.text ?? context.userText ?? "").trim()

    const ts_ms = typeof parsed?.ts_ms === "number" && Number.isFinite(parsed.ts_ms) ? clampTsMs(parsed.ts_ms) : Date.now()

    const drinks =
      profile === "alcohol" && typeof parsed?.drinks === "number" && Number.isFinite(parsed.drinks)
        ? Math.max(0, Math.trunc(parsed.drinks))
        : undefined

    const urge =
      profile === "alcohol" && typeof parsed?.urge_0_10 === "number" && Number.isFinite(parsed.urge_0_10)
        ? clampInt(parsed.urge_0_10, 0, 10)
        : undefined

    const strict =
      profile === "strict" && typeof parsed?.strict_0_10 === "number" && Number.isFinite(parsed.strict_0_10)
        ? clampInt(parsed.strict_0_10, 0, 10)
        : undefined

    const mood_tag = profile === "alcohol" ? clampTag(parsed?.mood_tag ?? "") : undefined
    const mood_0_10 =
      profile === "alcohol" && typeof parsed?.mood_0_10 === "number" && Number.isFinite(parsed.mood_0_10)
        ? clampInt(parsed.mood_0_10, 0, 10)
        : undefined

    const trigger_tag = profile === "alcohol" ? clampTag(parsed?.trigger_tag ?? "") : undefined
    const context_tag = profile === "alcohol" ? clampTag(parsed?.context_tag ?? "") : undefined
    const coping_tag = profile === "alcohol" ? clampTag(parsed?.coping_tag ?? "") : undefined
    const action = profile === "alcohol" ? clampTag(parsed?.action ?? "") : undefined

    const craving_peak_0_10 =
      profile === "alcohol" && typeof parsed?.craving_peak_0_10 === "number" && Number.isFinite(parsed.craving_peak_0_10)
        ? clampInt(parsed.craving_peak_0_10, 0, 10)
        : undefined
    const craving_duration_min =
      profile === "alcohol" && typeof parsed?.craving_duration_min === "number" && Number.isFinite(parsed.craving_duration_min)
        ? clampInt(parsed.craving_duration_min, 0, 24 * 60)
        : undefined

    // Require at least one signal.
    const hasAny =
      !!text ||
      (profile === "alcohol" && (drinks !== undefined || urge !== undefined)) ||
      (profile === "strict" && strict !== undefined)

    if (!hasAny) {
      const transition: Transition = {
        type: "NODE_HOP",
        from: context.state.active_node,
        reason: "diary-empty",
        response_message: undefined,
      }

      return {
        transition,
        debug: { capability: "diary-v1", used_fallback: false },
      }
    }

    const entry: JournalEntry = {
      entry_id: (crypto as any).randomUUID ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      ts_ms,
      schema_version: profile === "alcohol" ? "v2" : "v1",
      kind: profile,
      text: text || undefined,
      fields:
        profile === "alcohol"
          ? {
              drinks,
              urge_0_10: urge,
              mood_tag,
              mood_0_10,
              trigger_tag,
              context_tag,
              coping_tag,
              action,
              craving_peak_0_10,
              craving_duration_min,
            }
          : profile === "strict"
          ? { strict_0_10: strict }
          : undefined,
    }

    const transition: Transition = {
      type: "NODE_HOP",
      from: context.state.active_node,
      reason: "diary-entry",
      response_message: undefined,
      meta_delta: {
        // Persisted externally in Redis; API layer will append and refresh tail.
        "journal.append_entry": entry,
      },
    }

    return {
      transition,
      debug: { capability: "diary-v1", used_fallback: false },
    }
  },
}
