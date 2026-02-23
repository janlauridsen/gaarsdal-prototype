// chat/methodFit/cba.ts
// Version: 2026-02-23
// Purpose: LLM extraction (CBA) for method-fit. Produces patch only (no ranking decisions).

import type { LlmClient } from "../ai/types"
import type { MethodFitPatchV1 } from "./merge"
import type { MethodFitCaseSchemaV1 } from "./schema"
import { normalizeMethodName, resolveKnownMethodId } from "./methodRegistry"
import type { HardConstraint, ProblemTag, SoftPreference } from "./taxonomy"

type TranscriptTurn = { role: "user" | "assistant"; content: string }

const CBA_PROMPT_V1 = `Role: Case Builder Agent (method-fit, Danish context).

Goal:
- Extract structured information from the user's text.
- Do NOT rank methods.
- Do NOT propose treatments as factual medical advice.

Safety:
- No diagnosis.
- If you see red flags (blood, fever, sudden worsening, unexplained weight loss, fainting, neurological deficits, severe mental crisis/self-harm): set red_flags.active=true and add short signals.

Extraction fields:
- scope.presenting_problem (string|null) + confidence 0..1
- scope.desired_outcome (string|null) + confidence 0..1
- problem_tags: array of tags + confidence
- constraints.hard: array of hard constraints + confidence
- constraints.soft: array of soft preferences + confidence
- unknown_candidates: list of possible methods mentioned or suggested that are not confidently a known id.

Enums:
problem_tags: stress, sleep, anxiety, habit, pain_msk, digestive, energy_fatigue, grief_loss, trauma, other
hard_constraints: no_needles, no_touch, no_ingestibles, no_homework
soft_preferences: prefer_talk, prefer_bodywork, prefer_self_practice, prefer_low_effort

Rules:
- Be conservative: if unsure, omit or set low confidence (<=0.4).
- Do not overwrite non-empty values with null/empty.
- If user expresses clear form limits (e.g. 'ingen nåle'), add as hard constraint.
- If user expresses preferences (e.g. 'helst samtale'), add as soft preference.

Input JSON:
{ current_case, conversation_transcript, user_input }

Output ONLY valid JSON:
{
  "patch": {
    "scope": {"presenting_problem": {"value": string|null, "confidence": number}, "desired_outcome": {"value": string|null, "confidence": number}},
    "problem_tags": {"value": string[], "confidence": number},
    "constraints": {"hard": {"value": string[], "confidence": number}, "soft": {"value": string[], "confidence": number}},
    "red_flags": {"active": boolean, "signals": string[]},
    "unknown_candidates": [{"raw_name": string, "normalized_key": string, "dk_presence_status": "unverified", "first_seen_at": string}]
  }
}`

function isRecord(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === "object" && !Array.isArray(x)
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0
  if (n < 0) return 0
  if (n > 1) return 1
  return n
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x) => typeof x === "string").map((x) => x.trim()).filter(Boolean)
}

function nowIso(): string {
  return new Date().toISOString()
}

function pickPatch(out: Record<string, unknown>): Record<string, unknown> {
  const v = out["patch"]
  return isRecord(v) ? v : out
}

function filterEnum<T extends string>(xs: string[], allowed: Set<string>): T[] {
  const out: T[] = []
  for (const x of xs) {
    const k = x.trim() as T
    if (allowed.has(k)) out.push(k)
  }
  return Array.from(new Set(out))
}

const ALLOWED_TAGS = new Set([
  "stress",
  "sleep",
  "anxiety",
  "habit",
  "pain_msk",
  "digestive",
  "energy_fatigue",
  "grief_loss",
  "trauma",
  "other",
])
const ALLOWED_HARD = new Set(["no_needles", "no_touch", "no_ingestibles", "no_homework"])
const ALLOWED_SOFT = new Set(["prefer_talk", "prefer_bodywork", "prefer_self_practice", "prefer_low_effort"])

export async function runMethodFitCbaExtraction(params: {
  llm: LlmClient
  model: string
  current_case: MethodFitCaseSchemaV1
  conversation_transcript: TranscriptTurn[]
  user_input: string
  systemContext?: string
}): Promise<MethodFitPatchV1> {
  const { llm, model, current_case, conversation_transcript, user_input, systemContext } = params

  const payload = {
    model,
    temperature: 0.25,
    response_format: { type: "json_object" as const },
    messages: [
      { role: "system" as const, content: CBA_PROMPT_V1 },
      ...(systemContext ? [{ role: "system" as const, content: systemContext }] : []),
      {
        role: "user" as const,
        content: JSON.stringify({
          current_case,
          conversation_transcript,
          user_input,
        }),
      },
    ],
  }

  const out = await llm.chatJson(payload)
  if (!out || !isRecord(out)) return {}

  const patchRaw = pickPatch(out)
  if (!isRecord(patchRaw)) return {}

  const patch: MethodFitPatchV1 = {}

  // scope
  if (isRecord(patchRaw.scope)) {
    const scope: any = patchRaw.scope
    const pp = scope.presenting_problem
    const doo = scope.desired_outcome
    patch.scope = {}
    if (isRecord(pp)) {
      patch.scope.presenting_problem = {
        value: typeof pp.value === "string" ? pp.value : null,
        confidence: clamp01(Number(pp.confidence)),
      }
    }
    if (isRecord(doo)) {
      patch.scope.desired_outcome = {
        value: typeof doo.value === "string" ? doo.value : null,
        confidence: clamp01(Number(doo.confidence)),
      }
    }
  }

  // problem_tags
  if (isRecord(patchRaw.problem_tags)) {
    const pt: any = patchRaw.problem_tags
    const val = filterEnum<ProblemTag>(asStringArray(pt.value), ALLOWED_TAGS)
    patch.problem_tags = { value: val, confidence: clamp01(Number(pt.confidence)) }
  }

  // constraints
  if (isRecord(patchRaw.constraints)) {
    const c: any = patchRaw.constraints
    patch.constraints = {}
    if (isRecord(c.hard)) {
      const h: any = c.hard
      const val = filterEnum<HardConstraint>(asStringArray(h.value), ALLOWED_HARD)
      patch.constraints.hard = { value: val, confidence: clamp01(Number(h.confidence)) }
    }
    if (isRecord(c.soft)) {
      const s: any = c.soft
      const val = filterEnum<SoftPreference>(asStringArray(s.value), ALLOWED_SOFT)
      patch.constraints.soft = { value: val, confidence: clamp01(Number(s.confidence)) }
    }
  }

  // red_flags
  if (isRecord(patchRaw.red_flags)) {
    const rf: any = patchRaw.red_flags
    patch.red_flags = {
      active: Boolean(rf.active),
      signals: asStringArray(rf.signals),
    }
  }

  // unknown_candidates
  const unknownRaw = patchRaw.unknown_candidates
  if (Array.isArray(unknownRaw)) {
    const outCandidates: any[] = []
    for (const item of unknownRaw) {
      if (!isRecord(item)) continue
      const raw_name = typeof item.raw_name === "string" ? item.raw_name.trim() : ""
      const normalized_key = normalizeMethodName(typeof item.normalized_key === "string" ? item.normalized_key : raw_name)
      if (!raw_name || !normalized_key) continue

      // If it resolves to a known method id, do NOT keep it as unknown.
      if (resolveKnownMethodId(raw_name) || resolveKnownMethodId(normalized_key)) continue

      outCandidates.push({
        raw_name,
        normalized_key,
        dk_presence_status: "unverified" as const,
        first_seen_at: nowIso(),
      })
    }
    if (outCandidates.length) patch.unknown_candidates = outCandidates as any
  }

  return patch
}
