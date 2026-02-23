// chat/methodFit/focusPlan.ts
// Version: 2026-02-23
// Purpose: Focus-plan guidance for method-fit dialogue (stored in case + meta).

import type { MethodFitCaseSchemaV1 } from "./schema"
import type { HardConstraint, ProblemTag, SoftPreference } from "./taxonomy"

export type MethodFitFocusPlanV1 = {
  version: "v1"
  conversation_id: string
  revision: number

  // High-level gaps that should be filled before recommending.
  missing_fields: Array<"presenting_problem" | "desired_outcome" | "problem_tags" | "constraints">

  suggested_questions: Array<{
    field_path: string
    question: string
  }>

  constraints: {
    max_questions: 1 | 2 | 3
    avoid_repeat_within_turns: number
  }

  ready_for_recommendation: boolean
  created_at: string
}

function nowIso(): string {
  return new Date().toISOString()
}

function recentTranscriptText(transcript: Array<{ role: "user" | "assistant"; content: string }>, turns: number): string {
  return transcript
    .slice(-Math.max(0, turns))
    .map((t) => String(t.content ?? ""))
    .join("\n")
    .toLowerCase()
}

function questionAlreadyAskedRecently(question: string, transcript: Array<{ role: string; content: string }>, windowTurns: number): boolean {
  const recent = recentTranscriptText(transcript as any, windowTurns)
  const q = String(question ?? "").toLowerCase()
  if (!q.trim()) return false
  // Loose match: look for a few key words from the question
  const tokens = q
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z0-9æøå]/g, ""))
    .filter((t) => t.length >= 5)
    .slice(0, 6)
  if (tokens.length === 0) return false
  const hit = tokens.filter((t) => recent.includes(t)).length
  return hit >= Math.max(2, Math.floor(tokens.length / 2))
}

function detectConstraintMentions(userText: string): { hard: HardConstraint[]; soft: SoftPreference[] } {
  const t = String(userText ?? "").toLowerCase()
  const hard: HardConstraint[] = []
  const soft: SoftPreference[] = []

  if (/(nåle|akupunktur).*?(nej|ikke|undgå)/.test(t) || /(undgå|ikke).*(nåle|akupunktur)/.test(t)) hard.push("no_needles")
  if (/(berøring|massage|krops).*?(nej|ikke|undgå)/.test(t) || /(undgå|ikke).*(berøring|massage|krop)/.test(t)) hard.push("no_touch")
  if (/(kosttilskud|urter|piller|tilskud).*?(nej|ikke|undgå)/.test(t) || /(undgå|ikke).*(kosttilskud|urter|piller|tilskud)/.test(t))
    hard.push("no_ingestibles")
  if (/(hjemmeøvelser|øvelser hjemme|hjemmearbejde|daglige øvelser).*?(nej|ikke|undgå)/.test(t) || /(undgå|ikke).*(hjemmeøvelser|hjemmearbejde)/.test(t))
    hard.push("no_homework")

  if (/(helst|foretrækker).*(samtale|snak)/.test(t)) soft.push("prefer_talk")
  if (/(helst|foretrækker).*(krop|berøring|massage|manuel)/.test(t)) soft.push("prefer_bodywork")
  if (/(helst|foretrækker).*(øvelser|træning|hjemme)/.test(t)) soft.push("prefer_self_practice")
  if (/(helst|foretrækker).*(nemt|lav indsats|så lidt som muligt)/.test(t)) soft.push("prefer_low_effort")

  return { hard, soft }
}

function detectProblemTagMentions(userText: string): ProblemTag[] {
  const t = String(userText ?? "").toLowerCase()
  const tags: ProblemTag[] = []
  if (/(stress|presset|overbelast)/.test(t)) tags.push("stress")
  if (/(søvn|sover|insomni|vågn)/.test(t)) tags.push("sleep")
  if (/(angst|panik|uro|bekymr)/.test(t)) tags.push("anxiety")
  if (/(vane|afhæng|ryg|snus|alkohol|overspis|prokrastin)/.test(t)) tags.push("habit")
  if (/(smerte|ondt|spænd|nakke|ryg|skulder|hovedpine|led)/.test(t)) tags.push("pain_msk")
  if (/(mave|tarm|fordøj|oppust|diarr|forstopp)/.test(t)) tags.push("digestive")
  if (/(træt|udmattet|energi|fatigue)/.test(t)) tags.push("energy_fatigue")
  if (/(sorg|tab|skilsmisse|død)/.test(t)) tags.push("grief_loss")
  if (/(traume|ptsd|overgreb)/.test(t)) tags.push("trauma")
  return Array.from(new Set(tags))
}

/**
 * Build a focus plan for the next turn.
 * This is deterministic and purely based on current case + transcript + last user input.
 */
export function buildMethodFitFocusPlan(params: {
  conversationId: string
  revision: number
  caseData: MethodFitCaseSchemaV1
  transcript: Array<{ role: "user" | "assistant"; content: string }>
  lastUserText: string
}): MethodFitFocusPlanV1 {
  const { conversationId, revision, caseData, transcript, lastUserText } = params

  // Opportunistically harvest mentions from the last user turn (deterministic heuristic).
  // This does not replace CBA extraction; it just avoids dead-ends if CBA is empty.
  const mentionTags = detectProblemTagMentions(lastUserText)
  const mentionConstraints = detectConstraintMentions(lastUserText)

  const hasTags = caseData.problem_tags.value.length > 0 || mentionTags.length > 0
  const hasPresenting = Boolean(caseData.scope.presenting_problem.value?.trim())
  const hasOutcome = Boolean(caseData.scope.desired_outcome.value?.trim())

  // Constraints can be explicitly "none" (e.g. user answers "nej").
  // Treat constraints as "known" if either list has items OR we have non-trivial confidence.
  // This avoids repeatedly asking the same constraints question after the user has answered.
  const hardConf = Number(caseData.constraints.hard.confidence ?? 0)
  const softConf = Number(caseData.constraints.soft.confidence ?? 0)
  const hasConstraints =
    caseData.constraints.hard.value.length > 0 ||
    caseData.constraints.soft.value.length > 0 ||
    Math.max(hardConf, softConf) >= 0.25 ||
    mentionConstraints.hard.length > 0 ||
    mentionConstraints.soft.length > 0

  const missing: MethodFitFocusPlanV1["missing_fields"] = []
  if (!hasPresenting) missing.push("presenting_problem")
  if (!hasOutcome) missing.push("desired_outcome")
  if (!hasTags) missing.push("problem_tags")
  if (!hasConstraints) missing.push("constraints")

  // Safety: if red flags are active, we consider this "ready" only in the sense of giving a safety message.
  const ready = missing.length === 0

  const suggested_questions: MethodFitFocusPlanV1["suggested_questions"] = []

  const qPresenting = "Hvad vil du helst opnå (1 sætning), og hvor længe har det stået på?"
  const qTags =
    "Hvilken type problem fylder mest lige nu: smerte/krop, stress/uro, søvn/energi, fordøjelse, vane/adfærd — eller noget andet?"
  const qConstraints =
    "Er der noget du vil undgå (fx nåle, berøring, øvelser hjemme, kosttilskud) — eller noget du foretrækker ift. formen?"
  const qOutcome = "Hvis det lykkes: hvad vil være det tydeligste tegn på at det er blevet bedre?"
  const qSafety =
    "Inden vi foreslår retninger: er der tegn der bør tjekkes sundhedsfagligt først (fx nye stærke smerter, feber, blod, besvimelser) — eller er det allerede undersøgt?"

  // Priorities: presenting/problem tags, then constraints, then outcome.
  const pick = (field: string, question: string) => {
    if (questionAlreadyAskedRecently(question, transcript, 10)) return
    suggested_questions.push({ field_path: field, question })
  }

  if (caseData.red_flags.active) {
    pick("red_flags", qSafety)
  } else if (missing.includes("presenting_problem")) {
    pick("scope.presenting_problem", qPresenting)
  } else if (missing.includes("problem_tags")) {
    pick("problem_tags", qTags)
  } else if (missing.includes("constraints")) {
    pick("constraints", qConstraints)
  } else if (missing.includes("desired_outcome")) {
    pick("scope.desired_outcome", qOutcome)
  }

  return {
    version: "v1",
    conversation_id: conversationId,
    revision,
    missing_fields: missing,
    suggested_questions,
    constraints: { max_questions: 1, avoid_repeat_within_turns: 8 },
    ready_for_recommendation: ready,
    created_at: nowIso(),
  }
}
