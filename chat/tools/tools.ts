import type { ConversationState } from "../kernel/types"
import { readUserProfile, writeUserProfile } from "../memory/store"
import type { CheckpointSpec, ToolSpec } from "../nodes/registry"
import { consolidateV1, ensureTrack } from "../platform/consolidation"

type ToolRunParams = {
  kind: "TOOL" | "CHECKPOINT"
  spec: ToolSpec | CheckpointSpec
  userKey: string
  state: ConversationState
  userText: string
}

export type ToolRunResult = {
  nextNode: string
  reason: string
  response_message?: string
  meta_delta?: Record<string, unknown>
}

const DEFAULT_PROFILE_TTL_SECONDS = 90 * 24 * 60 * 60

/**
 * V1 tool runner.
 *
 * - TOOL: intended for background consolidation
 * - CHECKPOINT: explicit commit/refine step
 */
export async function runTool(params: ToolRunParams): Promise<ToolRunResult> {
  const profile = await readUserProfile(params.userKey)

  if (!profile) {
    // If profile is missing, don't block flow; return no-op.
    const nextNode = (params.spec as any).on_success_to ?? (params.spec as any).on_done_to
    return {
      nextNode,
      reason: "profile missing (noop)",
    }
  }

  // Tool behavior is keyed by spec fields.
  if (params.kind === "TOOL") {
    const spec = params.spec as ToolSpec
    try {
      if (spec.tool_id === "consolidate-v1") {
        const { profile: updated, updated: didUpdate } = consolidateV1({ profile, state: params.state })
        if (didUpdate) {
          await writeUserProfile({ userKey: params.userKey, profile: updated, ttlSeconds: DEFAULT_PROFILE_TTL_SECONDS })
        }
      }
      return {
        nextNode: spec.on_success_to,
        reason: `tool:${spec.tool_id} ok`,
      }
    } catch (e: any) {
      return {
        nextNode: spec.on_error_to ?? spec.on_success_to,
        reason: `tool:${spec.tool_id} failed`,
        response_message: typeof e?.message === "string" ? e.message : "Tool failed",
      }
    }
  }

  // CHECKPOINT
  const spec = params.spec as CheckpointSpec
  // Minimal checkpoint: consolidate + ensure a "triage" track when triage data exists.
  const triageTags = params.state?.meta?.["triage.topic_tags"]?.value
  if (Array.isArray(triageTags) && triageTags.length) {
    ensureTrack({ profile, program: "triage", title: "" })
  }

  const { profile: updated, updated: didUpdate } = consolidateV1({ profile, state: params.state })
  if (didUpdate) {
    await writeUserProfile({ userKey: params.userKey, profile: updated, ttlSeconds: DEFAULT_PROFILE_TTL_SECONDS })
  }

  return {
    nextNode: spec.on_done_to,
    reason: "checkpoint committed",
  }
}
