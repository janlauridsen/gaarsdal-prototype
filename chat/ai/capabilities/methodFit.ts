import { AiCapabilityResult } from "@/chat/ai/types"
import { Transition } from "@/chat/kernel/types"

import {
  MethodFitCase,
  MethodFitProfileUpdate,
  extractMethodFitUpdate,
  mergeMethodFitCase,
  makeMethodFitFocusPlan,
  makeMethodFitRankings,
  normalizeMethodFitProfileUpdate,
} from "@/chat/method-fit/schema"

import { readMethodFitCase, writeMethodFitCase } from "@/chat/method-fit/store"
import { makeRecommendationsFromRankings } from "@/chat/method-fit/recommender"

// NOTE: AiCapabilityResult.debug has a strict type: { capability: string; used_fallback: boolean }
// Do not add extra fields there, or Next.js type-check will fail.

export async function methodFitCapability(args: {
  conversation_id: string
  revision: number
  user_input: string
  meta: Record<string, unknown>
}): Promise<AiCapabilityResult> {
  const { conversation_id, revision, user_input, meta } = args

  // 1) Load existing case (authoritative persisted state for METHOD_FIT)
  const existing = await readMethodFitCase(conversation_id)

  // 2) Extract update from user input (LLM extraction)
  const extraction = await extractMethodFitUpdate({
    language: "da",
    user_input,
    current: existing ?? null,
  })

  const extractionOk = !!extraction?.ok
  const normalized: MethodFitProfileUpdate = normalizeMethodFitProfileUpdate(
    extraction?.update ?? {}
  )

  // 3) Merge update into case
  const merged: MethodFitCase = mergeMethodFitCase(existing, normalized, {
    case_id: conversation_id,
    language: "da",
  })

  // 4) Recompute deterministic rankings/focus-plan
  const rankings = makeMethodFitRankings(merged)
  const recommendations = makeRecommendationsFromRankings(rankings, merged)
  const focus_plan = makeMethodFitFocusPlan({
    conversation_id,
    revision,
    merged,
    rankings,
  })

  const mergedWithComputed: MethodFitCase = {
    ...merged,
    rankings,
    recommendations,
    focus_plan,
  }

  // 5) Persist updated case (Redis store)
  await writeMethodFitCase(conversation_id, mergedWithComputed)

  // 6) Prepare meta writes for the kernel (ONLY keys allowed by registry meta_domains_written)
  // IMPORTANT: Do NOT write "method_fit.case" unless registry allows it.
  // We keep meta granular to avoid huge meta payloads and to fit the whitelist model.
  const transition: Transition = {
    type: "NODE_HOP",
    from: "METHOD_FIT",
    to: "METHOD_FIT",
    reason: "method-fit update",
    meta_delta: {
      "method_fit.case_id": conversation_id,
      "method_fit.transcript": [
        ...(Array.isArray(meta?.["method_fit.transcript"]) ? (meta["method_fit.transcript"] as any[]) : []),
        { role: "user", content: user_input, ts: Date.now() },
      ],
      "method_fit.profile": mergedWithComputed.profile,
      "method_fit.scope": mergedWithComputed.scope,
      "method_fit.problem_tags": mergedWithComputed.problem_tags,
      "method_fit.constraints": mergedWithComputed.constraints,
      "method_fit.red_flags": mergedWithComputed.red_flags,
      "method_fit.hypnosis_fit": mergedWithComputed.hypnosis_fit,
      "method_fit.recommendations": mergedWithComputed.recommendations,
      "method_fit.unknown_candidates": mergedWithComputed.unknown_candidates,
      "method_fit.focus_plan": mergedWithComputed.focus_plan,

      // Convenience outputs for UI
      "method_fit.questions_remaining": Math.max(
        0,
        (mergedWithComputed.focus_plan?.suggested_questions?.length ?? 0)
      ),
      "method_fit.next_question":
        mergedWithComputed.focus_plan?.suggested_questions?.[0]?.question ?? "",
      "method_fit.summary": mergedWithComputed.scope?.desired_outcome?.value
        ? `Mål: ${mergedWithComputed.scope.desired_outcome.value}`
        : "",
    },
  }

  return {
    transition,
    debug: {
      capability: "method-fit-v1",
      used_fallback: !extractionOk,
    },
  }
}
