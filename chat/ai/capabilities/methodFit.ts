import { Transition } from "../../kernel/types"
import { readMethodFitCase, writeMethodFitCase } from "../../persistence/methodFitCaseStore"
import { AiCapability, AiCapabilityContext, AiCapabilityResult, LlmClient } from "../types"
import { KNOWN_METHODS, KNOWN_METHODS_BY_ID, resolveKnownMethodId } from "../../methodFit/methodRegistry"
import { mergeMethodFitCase, type MethodFitPatchV1 } from "../../methodFit/merge"
import { buildRecommendations } from "../../methodFit/rules"
import { buildMethodFitFocusPlan } from "../../methodFit/focusPlan"
import { runMethodFitCbaExtraction } from "../../methodFit/cba"

type TranscriptTurn = { role: "user" | "assistant"; content: string }

const MAX_TRANSCRIPT_TURNS = 24
const METHOD_FIT_TTL_SECONDS = 90 * 24 * 60 * 60

function readTranscript(context: AiCapabilityContext): TranscriptTurn[] {
  const raw = context.state.meta["method_fit.transcript"]?.value
  if (!Array.isArray(raw)) return []
  const turns: TranscriptTurn[] = []
  for (const item of raw) {
    if (!item || typeof item !== "object") continue
    const obj = item as any
    if ((obj.role === "user" || obj.role === "assistant") && typeof obj.content === "string") {
      const content = obj.content.trim()
      if (content) turns.push({ role: obj.role, content })
    }
  }
  return turns.slice(-MAX_TRANSCRIPT_TURNS)
}

function appendTranscript(previous: TranscriptTurn[], userText: string, assistantText: string): TranscriptTurn[] {
  const next = [...previous]
  const u = (userText ?? "").trim()
  const a = (assistantText ?? "").trim()
  if (u) next.push({ role: "user", content: u })
  if (a) next.push({ role: "assistant", content: a })
  return next.slice(-MAX_TRANSCRIPT_TURNS)
}

function evidenceLabel(tier: string): string {
  switch (tier) {
    case "good":
      return "god"
    case "moderate":
      return "moderat"
    case "mixed":
      return "blandet"
    case "limited":
      return "begrænset"
    case "experiential":
      return "primært erfaring"
    default:
      return "ukendt"
  }
}

function buildSafetyMessage(signals: string[]): string {
  const extra = signals.length ? ` (tegn: ${signals.slice(0, 4).join(", ")})` : ""
  return (
    "Inden vi kigger på behandlingsretninger: det du beskriver kan være noget der bør vurderes sundhedsfagligt først" +
    extra +
    ". Har du været forbi læge/fagperson, eller er det undersøgt?"
  )
}

function buildQuestionMessage(userText: string, question: string): string {
  const u = (userText ?? "").trim()
  if (!question.trim()) {
    return u
      ? `Okay—${u}. Hvad vil du helst opnå (1 sætning), og hvor længe har det stået på?`
      : "Hvad vil du helst opnå (1 sætning), og hvor længe har det stået på?"
  }
  return u
    ? `Okay—${u}. For at pege på et samlet forslag har jeg ét spørgsmål: ${question}`
    : `For at pege på et samlet forslag har jeg ét spørgsmål: ${question}`
}

function buildRecommendationMessage(params: {
  presenting_problem: string | null
  desired_outcome: string | null
  recommendations: ReturnType<typeof buildRecommendations>
  redFlagsActive: boolean
}): string {
  const { presenting_problem, desired_outcome, recommendations } = params

  const summaryBits: string[] = []
  if (presenting_problem?.trim()) summaryBits.push(presenting_problem.trim())
  if (desired_outcome?.trim()) summaryBits.push(`mål: ${desired_outcome.trim()}`)
  const summary = summaryBits.length ? summaryBits.join(" • ") : "Ud fra det du har delt" 

  const lines: string[] = []
  lines.push(`${summary}. Her er mulige veje (hypno + plus):`)

  const hyp = recommendations.hypnosis
  const hypFit = hyp.fit === "primary" ? "primær" : hyp.fit === "secondary" ? "supplement" : "lavt match"
  lines.push(
    `- ${hyp.label}: ${hypFit}. ${hyp.why[0] ?? ""} (evidens: ${evidenceLabel(hyp.evidence_tier)})`
  )

  for (const m of recommendations.problem_fit.slice(0, 3)) {
    const why = m.why[0] ?? ""
    lines.push(`- ${m.label}: ${why} (evidens: ${evidenceLabel(m.evidence_tier)})`)
  }

  if (recommendations.overall.length) {
    const overallNames = recommendations.overall.slice(0, 3).map((m) => m.label)
    if (overallNames.length) lines.push(`\nSamlet set (med dine rammer) ligger disse højest: ${overallNames.join(", ")}.`)
  }

  if (recommendations.unknown_other_options.length) {
    lines.push(
      `\nAndre mulige (uvalideret i DK i denne samtale): ${recommendations.unknown_other_options
        .slice(0, 3)
        .map((u) => u.raw_name)
        .join(", ")}.`
    )
  }

  lines.push("\nHvilken af retningerne vil du høre mere om?")
  return lines.join("\n")
}

function buildChips(recommendations: ReturnType<typeof buildRecommendations>): Array<{ id: string; label: string }> {
  const chips: Array<{ id: string; label: string }> = []
  chips.push({ id: "hypnosis", label: "Hypnoterapi" })

  for (const m of recommendations.overall.slice(0, 3)) {
    chips.push({ id: m.id, label: m.label })
  }

  if (recommendations.unknown_other_options.length) {
    chips.push({ id: "unknown", label: "Andre mulige (uvalideret)" })
  }

  // Dedupe by id
  const seen = new Set<string>()
  return chips.filter((c) => {
    if (seen.has(c.id)) return false
    seen.add(c.id)
    return true
  })
}

function resolveKnownIdsFromText(userText: string): string[] {
  // Optional convenience: if user explicitly asks about a known method by name,
  // we can bias chips/response, but we do not branch via keyword rules.
  const t = String(userText ?? "").trim()
  if (!t) return []
  const id = resolveKnownMethodId(t)
  return id ? [id] : []
}

export const methodFitCapability: AiCapability = {
  id: "method-fit-v1",
  async run(context: AiCapabilityContext, llm: LlmClient): Promise<AiCapabilityResult> {
    const transcript = readTranscript(context)
    const userText = (context.userText ?? "").trim()
    const contextSystem = (context.contextPack?.system ?? "").trim()

    // 1) Load case
    const current = await readMethodFitCase(context.state.conversation_id)

    // 2) CBA extraction (patch only)
    const model = process.env.METHOD_FIT_MODEL ?? process.env.TRIAGE_MODEL ?? "gpt-4.1-mini"
    let patch: MethodFitPatchV1 = {}
    try {
      patch = await runMethodFitCbaExtraction({
        llm,
        model,
        current_case: current,
        conversation_transcript: transcript,
        user_input: userText,
        systemContext: contextSystem,
      })
    } catch {
      patch = {}
    }

    // 3) Merge patch into case
    let merged = mergeMethodFitCase(current, patch)

    // 4) Deterministic: recompute hypnosis fit + rankings + recommendations
    const recommendations = buildRecommendations({ knownMethods: KNOWN_METHODS, caseData: merged })
    merged.rankings.problem_fit = recommendations.problem_fit
    merged.rankings.overall = recommendations.overall
    merged.hypnosis_fit.level = recommendations.hypnosis.fit
    merged.hypnosis_fit.rationale = recommendations.hypnosis.why.join(" ")

    // 5) Deterministic: focus plan
    const nextFocus = buildMethodFitFocusPlan({
      conversationId: context.state.conversation_id,
      revision: context.state.revision,
      caseData: merged,
      transcript,
      lastUserText: userText,
    })
    merged.focus_plan = nextFocus

    // 6) Persist case
    await writeMethodFitCase(context.state.conversation_id, merged, METHOD_FIT_TTL_SECONDS)

    // 7) Build assistant message
    let assistant_message = ""

    if (merged.red_flags.active) {
      assistant_message = buildSafetyMessage(merged.red_flags.signals)
    } else if (!merged.focus_plan.ready_for_recommendation) {
      const q = merged.focus_plan.suggested_questions[0]?.question ?? ""
      assistant_message = buildQuestionMessage(userText, q)
    } else {
      assistant_message = buildRecommendationMessage({
        presenting_problem: merged.scope.presenting_problem.value,
        desired_outcome: merged.scope.desired_outcome.value,
        recommendations,
        redFlagsActive: merged.red_flags.active,
      })
    }

    const updatedTranscript = appendTranscript(transcript, userText, assistant_message)

    // 8) meta_delta (only whitelisted keys)
    const meta_delta: Record<string, unknown> = {
      "method_fit.transcript": updatedTranscript,
      "method_fit.case_id": merged.case.case_id,
      "method_fit.problem_tags": merged.problem_tags.value,
      "method_fit.constraints": {
        hard: merged.constraints.hard.value,
        soft: merged.constraints.soft.value,
      },
      "method_fit.red_flags": merged.red_flags,
      "method_fit.hypnosis_fit": merged.hypnosis_fit,
      "method_fit.unknown_candidates": merged.unknown_candidates,
      "method_fit.focus_plan": merged.focus_plan,
    }

    const ready = merged.focus_plan.ready_for_recommendation && !merged.red_flags.active
    if (ready) {
      meta_delta["method_fit.recommendations"] = recommendations
      meta_delta["method_fit.close_signal"] = true
      meta_delta["method_fit.chips"] = buildChips(recommendations)
      meta_delta["method_fit.summary"] = "recommendations_ready"
    } else {
      meta_delta["method_fit.close_signal"] = false
      // Keep legacy v2 counters minimally updated for UI compatibility.
      // We do not rely on them for logic in v3.
      const prevCount = Number(context.state.meta["method_fit.question_count"]?.value ?? 0)
      meta_delta["method_fit.question_count"] = Number.isFinite(prevCount) ? Math.min(prevCount + 1, 99) : 1
      meta_delta["method_fit.questions_remaining"] = Math.max(0, 4 - Number(meta_delta["method_fit.question_count"]))
      meta_delta["method_fit.next_question"] = merged.focus_plan.suggested_questions[0]?.question ?? ""
      meta_delta["method_fit.summary"] = merged.focus_plan.missing_fields.length
        ? `missing:${merged.focus_plan.missing_fields.join(",")}`
        : "asking"
    }

    // Optional: if user asked for a specific known method, include it as a chip suggestion.
    const directKnown = resolveKnownIdsFromText(userText)
    if (directKnown.length && ready && Array.isArray(meta_delta["method_fit.chips"])) {
      const chips = meta_delta["method_fit.chips"] as any[]
      for (const id of directKnown) {
        const m = KNOWN_METHODS_BY_ID[id]
        if (m && !chips.some((c) => c.id === id)) chips.unshift({ id, label: m.label })
      }
      meta_delta["method_fit.chips"] = chips.slice(0, 4)
    }

    const transition: Transition = {
      type: "NODE_HOP",
      from: context.state.active_node,
      reason: "method-fit-v3",
      response_message: assistant_message,
      meta_delta,
    }

    return {
      transition,
      debug: {
        capability: "method-fit-v1",
        used_fallback: false,
      },
    }
  },
}
