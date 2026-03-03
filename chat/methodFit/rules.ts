// chat/methodFit/rules.ts
// Version: 2026-02-23
// Purpose: Deterministic rule engine + ranking for method-fit.

import type { KnownMethod } from "./methodRegistry"
import { evidenceTierToScore, formatConflictsHardConstraints, lowEffortPenalty, riskTierToPenalty, softPreferenceBonus } from "./taxonomy"
import type { HardConstraint, ProblemTag, SoftPreference } from "./taxonomy"
import type { HypnosisRecommendation, MethodFitCaseSchemaV1, MethodFitRecommendations, RankedMethod, UnknownOption } from "./schema"

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0
  if (n < 0) return 0
  if (n > 1) return 1
  return n
}

function uniqStrings(xs: string[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const x of xs) {
    const k = String(x ?? "").trim()
    if (!k) continue
    if (seen.has(k)) continue
    seen.add(k)
    out.push(k)
  }
  return out
}

export function tagMatchScore(userTags: ProblemTag[], methodTargets: ProblemTag[]): number {
  const u = userTags.filter(Boolean)
  if (u.length === 0) return 0
  const set = new Set(methodTargets)
  let hit = 0
  for (const t of u) if (set.has(t)) hit += 1
  return hit / Math.max(1, u.length)
}

export function computeProblemFitScore(params: {
  user_tags: ProblemTag[]
  hard_constraints: HardConstraint[]
  method: KnownMethod
}): { ok: true; score: number; why: string[]; cautions: string[] } | { ok: false; excluded_reasons: string[] } {
  const { user_tags, hard_constraints, method } = params
  const conflict = formatConflictsHardConstraints(method.formats, hard_constraints)
  if (conflict.excluded) return { ok: false, excluded_reasons: conflict.reasons }

  const tag_match = tagMatchScore(user_tags, method.targets)
  const evidence = evidenceTierToScore(method.evidence_tier)
  const risk_penalty = riskTierToPenalty(method.risk_tier)

  // V1 weights
  let score = 0.7 * tag_match + 0.25 * evidence - 1.0 * risk_penalty

  // no_homework is handled as penalty (not exclusion)
  if (hard_constraints.includes("no_homework") && method.formats.includes("self_practice")) {
    score -= 0.05
  }

  score = clamp01(score)

  const why: string[] = []
  if (tag_match > 0) why.push("Matcher dine nævnte områder")
  if (method.formats.includes("touch")) why.push("Kropsorienteret/manuel tilgang")
  if (method.formats.includes("talk")) why.push("Samtalebaseret støtte")
  if (method.formats.includes("self_practice")) why.push("Kan støtte via hjemmeøvelser")
  if (method.formats.includes("needles")) why.push("Indebærer nåle")
  if (method.formats.includes("ingestible")) why.push("Indebærer indtag (tilskud/urter)")

  const cautions: string[] = []
  if (method.formats.includes("ingestible")) cautions.push("Vær opmærksom på interaktioner og medicin")
  if (method.risk_tier === "high") cautions.push("Kræver ekstra omtanke/screening")
  if (hard_constraints.includes("no_homework") && method.formats.includes("self_practice")) {
    cautions.push("Indebærer typisk lidt hjemmepraksis")
  }

  return { ok: true, score, why: uniqStrings(why), cautions: uniqStrings(cautions) }
}

export function computeOverallScore(params: {
  base_score: number
  hard_constraints: HardConstraint[]
  soft_preferences: SoftPreference[]
  method: KnownMethod
}): { score: number; penalties_applied: string[] } {
  const { base_score, hard_constraints, soft_preferences, method } = params
  let score = base_score
  const penalties: string[] = []

  // no_homework: stronger penalty in overall
  if (hard_constraints.includes("no_homework") && method.formats.includes("self_practice")) {
    score -= 0.12
    penalties.push("hard_constraint:no_homework")
  }

  // Soft bonuses
  const bonus = softPreferenceBonus(method.formats, soft_preferences)
  if (bonus > 0) penalties.push("soft_preference:bonus")
  score += bonus

  // prefer_low_effort
  const lowEff = lowEffortPenalty(method.formats, soft_preferences)
  if (lowEff > 0) penalties.push("soft_preference:prefer_low_effort")
  score -= lowEff

  score = clamp01(score)
  return { score, penalties_applied: penalties }
}

export function computeHypnosisFit(caseData: MethodFitCaseSchemaV1): HypnosisRecommendation {
  const tags = caseData.problem_tags.value
  const set = new Set(tags)

  let fit: "primary" | "secondary" | "low_fit" = "secondary"
  const why: string[] = []
  const limits: string[] = []

  const primaryTags: ProblemTag[] = ["stress", "sleep", "habit", "anxiety"]
  const hasPrimary = primaryTags.some((t) => set.has(t))
  const hasPain = set.has("pain_msk")

  if (hasPrimary) {
    fit = "primary"
    why.push("Ofte relevant ved stress/uro, søvn og vane-/adfærdsændring")
  } else if (hasPain) {
    fit = "secondary"
    why.push("Kan være relevant som supplement til regulering, coping og vaner omkring smerte")
    limits.push("Er sjældent førstevalg ved rent strukturel/akut smerte")
  } else {
    fit = "low_fit"
    why.push("Kan nogle gange støtte indirekte (stress/regulering), men er ikke oplagt som primær her")
    limits.push("Overvej især kropslige/medicinske spor hvis symptomerne er primært somatiske")
  }

  return {
    id: "hypnosis",
    label: "Hypnoterapi",
    fit,
    why: uniqStrings(why),
    limits: uniqStrings(limits),
    evidence_tier: "mixed",
    risk_tier: "low",
  }
}

export function generateRankings(params: {
  knownMethods: KnownMethod[]
  caseData: MethodFitCaseSchemaV1
}): { problem_fit: RankedMethod[]; overall: RankedMethod[] } {
  const { knownMethods, caseData } = params
  const userTags = caseData.problem_tags.value
  const hard = caseData.constraints.hard.value
  const soft = caseData.constraints.soft.value

  const candidatesA: RankedMethod[] = []
  for (const method of knownMethods) {
    const res = computeProblemFitScore({ user_tags: userTags, hard_constraints: hard, method })
    if (!res.ok) continue

    candidatesA.push({
      kind: "known",
      id: method.id,
      label: method.label,
      score: res.score,
      evidence_tier: method.evidence_tier,
      risk_tier: method.risk_tier,
      formats: method.formats,
      why: res.why,
      cautions: res.cautions,
    })
  }

  // Sort descending by A
  candidatesA.sort((a, b) => b.score - a.score)

  const candidatesB: RankedMethod[] = candidatesA.map((m) => {
    const method = knownMethods.find((x) => x.id === m.id)
    if (!method) return m
    const { score, penalties_applied } = computeOverallScore({
      base_score: m.score,
      hard_constraints: hard,
      soft_preferences: soft,
      method,
    })
    return { ...m, score, penalties_applied }
  })

  candidatesB.sort((a, b) => b.score - a.score)

  // Thresholds and caps
  const listA = candidatesA.filter((m) => m.score >= 0.55).slice(0, 4)
  const listB = candidatesB.filter((m) => m.score >= 0.5).slice(0, 4)

  // Ensure minimum of 2 if possible
  const min2 = (xs: RankedMethod[], src: RankedMethod[]) => {
    if (xs.length >= 2) return xs
    const fill: RankedMethod[] = [...xs]
    for (const m of src) {
      if (fill.some((x) => x.id === m.id)) continue
      fill.push(m)
      if (fill.length >= 2) break
    }
    return fill
  }

  return {
    problem_fit: min2(listA, candidatesA).slice(0, 4),
    overall: min2(listB, candidatesB).slice(0, 4),
  }
}

export function buildRecommendations(params: {
  knownMethods: KnownMethod[]
  caseData: MethodFitCaseSchemaV1
}): MethodFitRecommendations {
  const { knownMethods, caseData } = params

  const rankings = generateRankings({ knownMethods, caseData })
  const hypnosis = computeHypnosisFit(caseData)

  // Unknown options: always unverified in V1 (thread-local; no cross-thread presence cache)
  const unknown_other_options: UnknownOption[] = caseData.unknown_candidates.map((u) => ({
    kind: "unknown",
    raw_name: u.raw_name,
    normalized_key: u.normalized_key,
    dk_presence_status: u.dk_presence_status,
    formats: [],
    why: ["Forslået som mulig retning, men ikke valideret i DK"],
    note: "Udbredelse i Danmark er ikke valideret i denne samtale — tjek lokalt.",
  }))

  return {
    problem_fit: rankings.problem_fit,
    overall: rankings.overall,
    hypnosis,
    unknown_other_options,
    policy: {
      unknown_visibility: "immediate_flagged",
      allow_unknown_in_top_lists: false,
    },
  }
}
