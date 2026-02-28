import crypto from "crypto"

import { Transition } from "../../kernel/types"
import { AiCapability, AiCapabilityContext, AiCapabilityResult, LlmClient } from "../types"

type JournalProfile = "alcohol" | "general" | "strict"

type ParsedInput = {
  profile?: JournalProfile
  text?: string
  drinks?: number
  urge_0_10?: number
  strict_0_10?: number
}

type JournalEntry = {
  entry_id: string
  ts_ms: number
  schema_version: "v1"
  kind: JournalProfile
  text?: string
  fields?: {
    drinks?: number
    urge_0_10?: number
    strict_0_10?: number
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
    if (typeof obj.drinks === "number" && Number.isFinite(obj.drinks)) out.drinks = obj.drinks
    if (typeof obj.urge_0_10 === "number" && Number.isFinite(obj.urge_0_10)) out.urge_0_10 = obj.urge_0_10
    if (typeof obj.strict_0_10 === "number" && Number.isFinite(obj.strict_0_10)) out.strict_0_10 = obj.strict_0_10
    return out
  } catch {
    return null
  }
}

function clampInt(n: number, min: number, max: number): number {
  const x = Math.trunc(n)
  if (x < min) return min
  if (x > max) return max
  return x
}

function readEntries(context: AiCapabilityContext): JournalEntry[] {
  const raw = (context.state.meta as any)?.["journal.entries"]?.value
  if (!Array.isArray(raw)) return []
  return raw.filter((e: any) => e && typeof e === "object").map((e: any) => e as JournalEntry)
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
      ts_ms: Date.now(),
      schema_version: "v1",
      kind: profile,
      text: text || undefined,
      fields:
        profile === "alcohol"
          ? { drinks, urge_0_10: urge }
          : profile === "strict"
          ? { strict_0_10: strict }
          : undefined,
    }

    const prev = readEntries(context)
    const next = [...prev, entry].slice(-400)

    const transition: Transition = {
      type: "NODE_HOP",
      from: context.state.active_node,
      reason: "diary-entry",
      response_message: undefined,
      meta_delta: {
        "journal.entries": next,
      },
    }

    return {
      transition,
      debug: { capability: "diary-v1", used_fallback: false },
    }
  },
}
