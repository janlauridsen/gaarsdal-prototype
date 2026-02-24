// chat/ai/capabilities/methodFit.ts
// Version: 2026-02-24

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

function isOpenOrNoPreference(text: string): boolean {
  const t = (text ?? "").trim().toLowerCase()
  return (
    /\b(jeg\s+)?er\s+åben\b/.test(t) ||
    /\bingen\s+præference\b/.test(t) ||
    /\bikke\s+nogen\s+præference\b/.test(t) ||
    /\bligegyldigt\b/.test(t) ||
    /\bved\s+ikke\b/.test(t)
  )
}

function lastAssistantAskedPreferences(transcript: TranscriptTurn[]): boolean {
  const lastA = [...transcript].reverse().find(x => x.role === "assistant")?.content?.toLowerCase() ?? ""
  return lastA.includes("præference")
}

export const methodFitCapability: AiCapability = {
  id: "method-fit-v1",
  async run(context: AiCapabilityContext, llm: LlmClient): Promise<AiCapabilityResult> {

    const transcript: TranscriptTurn[] =
      (context.state.meta["method_fit.transcript"]?.value as TranscriptTurn[]) ?? []

    const userText = (context.userText ?? "").trim()

    const current = await readMethodFitCase(context.state.conversation_id)

    let patch: MethodFitPatchV1 = {}
    try {
      patch = await runMethodFitCbaExtraction({
        llm,
        model: process.env.METHOD_FIT_MODEL ?? "gpt-4.1-mini",
        current_case: current,
        conversation_transcript: transcript,
        user_input: userText,
        systemContext: context.contextPack?.system ?? "",
      })
    } catch {
      patch = {}
    }

    let merged = mergeMethodFitCase(current, patch)

    // --- Deterministic preference capture (loop fix) ---
    const isBareNo = userText.toLowerCase() === "nej"

    if (
      isOpenOrNoPreference(userText) ||
      (isBareNo && lastAssistantAskedPreferences(transcript))
    ) {
      ;(merged as any).profile = (merged as any).profile ?? {}
      ;(merged as any).profile.preferences = {
        value: "ingen præference (åben)",
        confidence: 0.85
      }
    }

    const recommendations = buildRecommendations({
      knownMethods: KNOWN_METHODS,
      caseData: merged
    })

    merged.rankings.problem_fit = recommendations.problem_fit
    merged.rankings.overall = recommendations.overall
    merged.hypnosis_fit.level = recommendations.hypnosis.fit
    merged.hypnosis_fit.rationale = recommendations.hypnosis.why.join(" ")

    merged.focus_plan = buildMethodFitFocusPlan({
      conversationId: context.state.conversation_id,
      revision: context.state.revision,
      caseData: merged,
      transcript,
      lastUserText: userText
    })

    await writeMethodFitCase(
      context.state.conversation_id,
      merged,
      METHOD_FIT_TTL_SECONDS
    )

    const ready = merged.focus_plan.ready_for_recommendation && !merged.red_flags.active

    const assistant_message = ready
      ? "Her er en prioriteret oversigt over relevante metoder baseret på det du har delt."
      : merged.focus_plan.suggested_questions[0]?.question ??
        "Fortæl lidt mere, så jeg kan pege på et samlet forslag."

    const transition: Transition = {
      type: "NODE_HOP",
      from: context.state.active_node,
      reason: "method-fit-v3",
      response_message: assistant_message,
      meta_delta: {
        "method_fit.case": merged
      }
    }

    return { transition }
  }
}
