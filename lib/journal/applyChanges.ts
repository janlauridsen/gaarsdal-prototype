import {
  JournalChange,
  JournalEntryV4,
  clamp0to10,
  clampNonNegInt,
  normalizeText,
  clampTsMs,
} from "./journalSchema"
import { asKeySet, perceivedBenefitTags, perceivedCostTags, desiredOutcomeTags, ambivalenceTags } from "./tagSets"

const benefitSet = asKeySet(perceivedBenefitTags)
const costSet = asKeySet(perceivedCostTags)
const outcomeSet = asKeySet(desiredOutcomeTags)
const ambivalenceSet = asKeySet(ambivalenceTags)

const MAX_TAGS_BENEFIT = 3
const MAX_TAGS_COST = 3
const MAX_TAGS_OUTCOME = 3
const MAX_TAGS_AMBIVALENCE = 2

// Whitelist paths for patching
const ALLOWED_PATHS = new Set<string>([
  "ts_ms",
  "text",

  "fields.drinks",
  "fields.urge_0_10",

  "fields.mood_tag",
  "fields.mood_0_10",
  "fields.trigger_tag",
  "fields.context_tag",

  "fields.coping_tag",
  "fields.action",

  "fields.craving_peak_0_10",
  "fields.craving_duration_min",

  "fields.perceived_benefit_tags",
  "fields.perceived_cost_tags",
  "fields.benefit_impact_0_10",
  "fields.cost_impact_0_10",

  "fields.change_intent_0_10",
  "fields.desired_outcome_tags",
  "fields.ambivalence_tags",
])

function splitPath(path: string): { top: "ts_ms" | "text" | "fields"; key?: string } | null {
  if (path === "ts_ms") return { top: "ts_ms" }
  if (path === "text") return { top: "text" }
  if (path.startsWith("fields.")) return { top: "fields", key: path.slice("fields.".length) }
  return null
}

function normalizeStringTag(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined
  const s = v.trim()
  return s ? s : undefined
}

function normalizeStringArray(v: unknown, allowed: Set<string>, max: number): string[] | undefined {
  if (!Array.isArray(v)) return undefined
  const out: string[] = []
  for (const item of v) {
    const k = normalizeStringTag(item)
    if (k && allowed.has(k) && !out.includes(k)) out.push(k)
    if (out.length >= max) break
  }
  return out.length ? out : []
}

export type ApplyResult = {
  entry: JournalEntryV4
  applied: JournalChange[]
  ignored: JournalChange[]
}

export function applyJournalChanges(
  entry: JournalEntryV4,
  changes: JournalChange[],
  opts: { nowMs?: number } = {}
): ApplyResult {
  const now = typeof opts.nowMs === "number" ? opts.nowMs : Date.now()

  const applied: JournalChange[] = []
  const ignored: JournalChange[] = []

  for (const ch of Array.isArray(changes) ? changes : []) {
    if (!ch || typeof ch !== "object") continue
    const op = ch.op
    const path = typeof ch.path === "string" ? ch.path : ""
    if (!op || !path || !ALLOWED_PATHS.has(path)) {
      ignored.push(ch)
      continue
    }

    const p = splitPath(path)
    if (!p) {
      ignored.push(ch)
      continue
    }

    // Enforce kind constraints: alcohol_urge cannot set drinks, alcohol_drink can set both.
    if (entry.kind === "alcohol_urge" && path === "fields.drinks") {
      ignored.push(ch)
      continue
    }

    if (op === "unset") {
      if (p.top === "ts_ms") {
        // ignore
        ignored.push(ch)
        continue
      }
      if (p.top === "text") {
        delete (entry as any).text
        applied.push(ch)
        continue
      }
      if (p.top === "fields" && p.key) {
        delete (entry.fields as any)[p.key]
        applied.push(ch)
        continue
      }
      ignored.push(ch)
      continue
    }

    if (op === "append_text") {
      if (path !== "text") {
        ignored.push(ch)
        continue
      }
      const append = normalizeText(ch.value, 1000)
      if (!append) {
        ignored.push(ch)
        continue
      }
      const cur = typeof entry.text === "string" ? entry.text : ""
      const next = (cur + append).trim()
      entry.text = next ? next : undefined
      applied.push(ch)
      continue
    }

    if (op !== "set") {
      ignored.push(ch)
      continue
    }

    // set
    if (p.top === "ts_ms") {
      const n = typeof ch.value === "number" ? ch.value : Number(ch.value)
      entry.ts_ms = clampTsMs(n, now)
      applied.push({ op, path, value: entry.ts_ms })
      continue
    }

    if (p.top === "text") {
      const t = normalizeText(ch.value, 2000)
      entry.text = t
      applied.push({ op, path, value: entry.text })
      continue
    }

    // fields.*
    const k = p.key!
    switch (k) {
      case "drinks": {
        const n = typeof ch.value === "number" ? ch.value : Number(ch.value)
        ;(entry.fields as any).drinks = clampNonNegInt(n, 50)
        applied.push({ op, path, value: (entry.fields as any).drinks })
        break
      }
      case "urge_0_10":
      case "mood_0_10":
      case "craving_peak_0_10":
      case "benefit_impact_0_10":
      case "cost_impact_0_10":
      case "change_intent_0_10": {
        const n = typeof ch.value === "number" ? ch.value : Number(ch.value)
        ;(entry.fields as any)[k] = clamp0to10(n)
        applied.push({ op, path, value: (entry.fields as any)[k] })
        break
      }
      case "craving_duration_min": {
        const n = typeof ch.value === "number" ? ch.value : Number(ch.value)
        ;(entry.fields as any).craving_duration_min = clampNonNegInt(n, 24 * 60)
        applied.push({ op, path, value: (entry.fields as any).craving_duration_min })
        break
      }
      case "mood_tag":
      case "trigger_tag":
      case "context_tag":
      case "coping_tag":
      case "action": {
        const s = normalizeStringTag(ch.value)
        ;(entry.fields as any)[k] = s
        applied.push({ op, path, value: (entry.fields as any)[k] })
        break
      }
      case "perceived_benefit_tags": {
        const arr = normalizeStringArray(ch.value, benefitSet, MAX_TAGS_BENEFIT)
        if (arr === undefined) { ignored.push(ch); break }
        entry.fields.perceived_benefit_tags = arr
        applied.push({ op, path, value: arr })
        break
      }
      case "perceived_cost_tags": {
        const arr = normalizeStringArray(ch.value, costSet, MAX_TAGS_COST)
        if (arr === undefined) { ignored.push(ch); break }
        entry.fields.perceived_cost_tags = arr
        applied.push({ op, path, value: arr })
        break
      }
      case "desired_outcome_tags": {
        const arr = normalizeStringArray(ch.value, outcomeSet, MAX_TAGS_OUTCOME)
        if (arr === undefined) { ignored.push(ch); break }
        entry.fields.desired_outcome_tags = arr
        applied.push({ op, path, value: arr })
        break
      }
      case "ambivalence_tags": {
        const arr = normalizeStringArray(ch.value, ambivalenceSet, MAX_TAGS_AMBIVALENCE)
        if (arr === undefined) { ignored.push(ch); break }
        entry.fields.ambivalence_tags = arr
        applied.push({ op, path, value: arr })
        break
      }
      default:
        ignored.push(ch)
    }
  }

  // bump revision if something applied
  if (applied.length) {
    entry.revision = (typeof entry.revision === "number" ? entry.revision : 0) + 1
  }

  return { entry, applied, ignored }
}

export function allowedChangePaths(): string[] {
  return Array.from(ALLOWED_PATHS.values()).sort()
}
