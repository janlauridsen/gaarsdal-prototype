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

function nowIso(): string {
  return new Date().toISOString()
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : ""
}

function asStringArrayFromDelimited(v: unknown): string[] {
  const s = asString(v).trim()
  if (!s) return []
  // split by ; or ,
  return s
    .split(/[;,]/g)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 20)
}

function getFormLastValues(state: ConversationState): Record<string, unknown> | null {
  const raw = state?.meta?.["form.last"]?.value as any
  if (!raw || typeof raw !== "object") return null
  const values = (raw as any).values
  if (!values || typeof values !== "object") return null
  return values as Record<string, unknown>
}

/**
 * V1 tool runner.
 *
 * - TOOL: intended for background consolidation or deterministic transformation
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

  // TOOL behavior is keyed by spec fields.
  if (params.kind === "TOOL") {
    const spec = params.spec as ToolSpec
    try {
      if (spec.tool_id === "consolidate-v1") {
        const { profile: updated, updated: didUpdate } = consolidateV1({ profile, state: params.state })
        if (didUpdate) {
          await writeUserProfile({
            userKey: params.userKey,
            profile: updated,
            ttlSeconds: DEFAULT_PROFILE_TTL_SECONDS,
          })
        }
      }

      if (spec.tool_id === "apply-form-to-track-v1") {
        const values = getFormLastValues(params.state)
        if (!values) {
          return {
            nextNode: spec.on_error_to ?? spec.on_success_to,
            reason: "tool:apply-form-to-track-v1 missing form.last",
            response_message: "Mangler form.last i state.meta (kør form først).",
          }
        }

        // Ensure/activate sandbox track
        const { profile: p2, track, created } = ensureTrack({
          profile,
          program: "sandbox",
          title: "",
        })

        const ts = nowIso()

        // Map a minimal set of fields to track.core_overlay
        const topic = asString(values["topic"])
        const goal = asString(values["goal"])
        const time_patterns = asString(values["time_patterns"])
        const situational_triggers = asString(values["situational_triggers"])
        const relational_patterns = asString(values["relational_patterns"])
        const preferred_tone = asString(values["preferred_tone"])
        const support_direction = asString(values["support_direction"])
        const interest_in_methods = asStringArrayFromDelimited(values["interest_in_methods"])

        if (topic) {
          if (!track.core_overlay.topics.includes(topic)) {
            track.core_overlay.topics = [topic, ...track.core_overlay.topics].slice(0, 20)
          }
          // Conservative core hint
          if (!p2.core.semantic.topics.includes(topic)) {
            p2.core.semantic.topics = [topic, ...p2.core.semantic.topics].slice(0, 50)
          }
        }

        if (goal) {
          if (!track.core_overlay.goals.includes(goal)) {
            track.core_overlay.goals = [goal, ...track.core_overlay.goals].slice(0, 20)
          }
          if (!p2.core.semantic.goals.includes(goal)) {
            p2.core.semantic.goals = [goal, ...p2.core.semantic.goals].slice(0, 20)
          }
        }

        if (time_patterns) track.core_overlay.context.time_patterns = time_patterns
        if (situational_triggers) track.core_overlay.context.situational_triggers = situational_triggers
        if (relational_patterns) track.core_overlay.context.relational_patterns = relational_patterns

        if (preferred_tone) {
          track.core_overlay.help_orientation.preferred_tone = preferred_tone
          // Also lift to core preferences (low-risk)
          p2.core.preferences.preferred_tone = preferred_tone
        }
        if (support_direction) track.core_overlay.help_orientation.support_direction = support_direction
        if (interest_in_methods.length) track.core_overlay.help_orientation.interest_in_methods = interest_in_methods

        track.updated_at = ts
        p2.updated_at = ts

        // Evidence snippets: store short quotes per mapped field (dev v1)
        const evidenceKey = "evidence.v1"
        const existingEvidence =
          (track.extensions && typeof track.extensions[evidenceKey] === "object" && track.extensions[evidenceKey] !== null)
            ? (track.extensions[evidenceKey] as Record<string, unknown>)
            : {}

        const evidence: Record<string, unknown> = { ...existingEvidence }
        const addEvidence = (field: string, value: string) => {
          if (!value) return
          evidence[field] = {
            quote: value,
            ts,
            node: params.state.active_node,
          }
        }

        addEvidence("topic", topic)
        addEvidence("goal", goal)
        addEvidence("time_patterns", time_patterns)
        addEvidence("situational_triggers", situational_triggers)
        addEvidence("relational_patterns", relational_patterns)
        addEvidence("preferred_tone", preferred_tone)
        addEvidence("support_direction", support_direction)
        if (interest_in_methods.length) {
          addEvidence("interest_in_methods", interest_in_methods.join("; "))
        }

        track.extensions = {
          ...(track.extensions ?? {}),
          [evidenceKey]: evidence,
          "sandbox.v1": {
            created_track: created,
            applied_at: ts,
          },
        }

        await writeUserProfile({
          userKey: params.userKey,
          profile: p2,
          ttlSeconds: DEFAULT_PROFILE_TTL_SECONDS,
        })

        return {
          nextNode: spec.on_success_to,
          reason: "tool:apply-form-to-track-v1 ok",
          meta_delta: {
            "sandbox.apply_result": {
              at: ts,
              track_id: track.track_id,
              created_track: created,
              mapped_fields: Object.keys(values),
            },
          },
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

  // Minimal checkpoint: consolidate, and write a visible meta marker.
  const { profile: updated, updated: didUpdate } = consolidateV1({ profile, state: params.state })
  if (didUpdate) {
    await writeUserProfile({
      userKey: params.userKey,
      profile: updated,
      ttlSeconds: DEFAULT_PROFILE_TTL_SECONDS,
    })
  }

  const ts = nowIso()
  return {
    nextNode: spec.on_done_to,
    reason: "checkpoint committed",
    meta_delta: {
      "checkpoint.last": {
        at: ts,
        from_node: params.state.active_node,
      },
    },
  }
}
