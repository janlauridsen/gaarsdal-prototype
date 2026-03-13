import type { CheckpointSpec, ConversationState, ToolSpec } from "../kernel/types"
import crypto from "crypto"

import { createInitialState } from "../kernel/state"
import { readConversationState, writeConversationState } from "../persistence/conversationStateStore"
import {
  ensureThreadIndex,
  setActiveThread,
  upsertThread,
  writeThreadIndex,
} from "../persistence/threadIndexStore"

import { readUserProfile, writeUserProfile } from "../memory/store"
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
  state_override?: ConversationState
}

const DEFAULT_PROFILE_TTL_SECONDS = 90 * 24 * 60 * 60
const DEFAULT_SESSION_TTL_SECONDS = 90 * 24 * 60 * 60

function nowIso(): string {
  return new Date().toISOString()
}

function defaultProfileV2(params: { now: string; lastNode: string }) {
  return {
    version: 2,
    updated_at: params.now,
    first_seen_at: params.now,
    last_seen_at: params.now,
    last_node: params.lastNode,
    node_counts: {},
    topic_scores: {},
    pref: { short_answers: 0.5 },
    core: {
      preferences: {
        preferred_tone: "",
        short_answers: 0.5,
      },
      semantic: {
        topics: [],
        goals: [],
      },
    },
    tracks: {
      active_track_id: null,
      items: [],
    },
  }
}

function metaEntry(sourceNode: string, value: unknown): { value: unknown; source_node: string } {
  return { value, source_node: sourceNode }
}

function makeThreadChoices(params: {
  activeConversationId: string | null
  threads: Array<{ conversation_id: string; title: string; preview: string; updated_at: string }>
}): Array<{ id: string; label: string; kind: "continue" | "new" | "thread" }> {
  const items: Array<{ id: string; label: string; kind: "continue" | "new" | "thread" }> = []

  const shortId = (conversationId: string): string => {
    const s = conversationId.replace(/^c:/, "")
    return s.length > 8 ? s.slice(-8) : s
  }

  const normalize = (s: string): string =>
    s
      .trim()
      .replace(/\s+/g, " ")
      .replace(/\.{3,}$/g, "…")
      .replace(/…+$/g, "…")

  const buildLabel = (t: { conversation_id: string; title: string; preview: string }): string => {
    const base = t.title?.trim() ? t.title.trim() : `Tråd ${shortId(t.conversation_id)}`
    const preview = t.preview?.trim() ? t.preview.trim() : ""
    if (!preview) return base

    const nBase = normalize(base).toLowerCase()
    const nPreview = normalize(preview).toLowerCase()

    if (nPreview === nBase) return base
    if (nPreview.startsWith(nBase) && nPreview.length - nBase.length <= 3) return preview
    if (nBase.startsWith(nPreview) && nBase.length - nPreview.length <= 3) return base

    const combined = `${base} — ${preview}`
    return combined.length > 110 ? combined.slice(0, 107).trimEnd() + "…" : combined
  }

  if (params.activeConversationId) {
    const active = params.threads.find((t) => t.conversation_id === params.activeConversationId)
    items.push({
      id: "continue",
      label: active ? `Fortsæt: ${buildLabel(active)}` : "Fortsæt seneste tråd",
      kind: "continue",
    })
  }

  items.push({ id: "new", label: "Start ny tråd", kind: "new" })

  for (const t of params.threads) {
    items.push({
      id: t.conversation_id,
      label: buildLabel(t),
      kind: "thread",
    })
  }

  return items.slice(0, 12)
}

function safeUuid(): string {
  return (crypto as any).randomUUID ? (crypto as any).randomUUID() : crypto.randomBytes(16).toString("hex")
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : ""
}

function asStringArrayFromDelimited(v: unknown): string[] {
  const s = asString(v).trim()
  if (!s) return []
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
  const specAny = params.spec as any
  const toolName = typeof specAny?.name === "string" ? specAny.name : ""

  if (params.kind === "TOOL" && toolName === "profile-bootstrap-v1") {
    const ts = nowIso()

    const existing = await readUserProfile(params.userKey)
    const profile = existing ?? defaultProfileV2({ now: ts, lastNode: params.state.active_node })
    profile.updated_at = ts
    profile.last_seen_at = ts
    profile.last_node = params.state.active_node

    await writeUserProfile({ userKey: params.userKey, profile, ttlSeconds: DEFAULT_PROFILE_TTL_SECONDS })

    const index = await ensureThreadIndex({ userKey: params.userKey, ttlSeconds: DEFAULT_PROFILE_TTL_SECONDS })

    const activeThreads = index.threads.filter((t) => t.status === "active")
    const activeConversationId =
      index.active_conversation_id && activeThreads.some((t) => t.conversation_id === index.active_conversation_id)
        ? index.active_conversation_id
        : null

    const choices = makeThreadChoices({
      activeConversationId,
      threads: activeThreads.map((t) => ({
        conversation_id: t.conversation_id,
        title: t.title,
        preview: t.preview,
        updated_at: t.updated_at,
      })),
    })

    return {
      nextNode: specAny.on_success_to ?? params.state.active_node,
      reason: "profile bootstrap ok",
      meta_delta: {
        "profile.status": existing ? "known" : "new",
        "profile.last_seen_at": ts,
        "threads.count": activeThreads.length,
        "threads.active": activeConversationId,
        "threads.choices": choices,
      },
    }
  }

  if (params.kind === "TOOL" && toolName === "thread-switch-v1") {
    const ts = nowIso()
    const index0 = await ensureThreadIndex({ userKey: params.userKey, ttlSeconds: DEFAULT_PROFILE_TTL_SECONDS })

    const raw = (params.userText ?? "").trim()
    const text = raw.toLowerCase()

    const wantsNew = text === "new" || text === "ny" || text === "start ny" || text === "start" || text === "n"
    const wantsContinue = text === "continue" || text === "fortsæt" || text === "fortsaet" || text === "c"

    let targetConversationId: string | null = null
    let mode: "new" | "continue" | "select" = "select"

    if (wantsNew) {
      mode = "new"
    } else if (wantsContinue) {
      mode = "continue"
      targetConversationId = index0.active_conversation_id
    } else if (raw) {
      mode = "select"
      targetConversationId = raw
    }

    if (mode !== "new" && (!targetConversationId || typeof targetConversationId !== "string")) {
      const activeThreads = index0.threads.filter((t) => t.status === "active")
      const activeConversationId =
        index0.active_conversation_id && activeThreads.some((t) => t.conversation_id === index0.active_conversation_id)
          ? index0.active_conversation_id
          : null

      const choices = makeThreadChoices({
        activeConversationId,
        threads: activeThreads.map((t) => ({
          conversation_id: t.conversation_id,
          title: t.title,
          preview: t.preview,
          updated_at: t.updated_at,
        })),
      })

      return {
        nextNode: params.state.active_node,
        reason: "thread switch missing selection",
        response_message: "Vælg en tråd: skriv 'continue', 'new' eller vælg en af knapperne.",
        meta_delta: {
          "threads.choices": choices,
          "threads.count": activeThreads.length,
          "threads.active": activeConversationId,
        },
      }
    }

    if (mode === "new") {
      const conversationId = `c:${safeUuid()}`
      const newState = createInitialState(conversationId)

      await writeConversationState(newState, DEFAULT_SESSION_TTL_SECONDS)

      let index1 = upsertThread({ index: index0, conversationId, title: "", preview: "" })
      index1 = { ...index1, navigation: { return_stack: [] } }
      index1 = setActiveThread({ index: index1, conversationId })
      await writeThreadIndex({ userKey: params.userKey, index: index1, ttlSeconds: DEFAULT_PROFILE_TTL_SECONDS })

      newState.meta = {
        ...(newState.meta ?? {}),
        "threads.last_switch": metaEntry("THREAD_CHOOSER", { at: ts, mode: "new", from: params.state.conversation_id }),
      }

      return {
        nextNode: newState.active_node,
        reason: "thread switch -> new",
        state_override: newState,
      }
    }

    const loaded = targetConversationId ? await readConversationState(targetConversationId) : null

    const ensured = loaded ?? createInitialState(targetConversationId as string)
    if (!loaded) {
      await writeConversationState(ensured, DEFAULT_SESSION_TTL_SECONDS)
    }

    let index2 = upsertThread({ index: index0, conversationId: ensured.conversation_id })
    index2 = { ...index2, navigation: { return_stack: [] } }
    index2 = setActiveThread({ index: index2, conversationId: ensured.conversation_id })
    await writeThreadIndex({ userKey: params.userKey, index: index2, ttlSeconds: DEFAULT_PROFILE_TTL_SECONDS })

    ensured.meta = {
      ...(ensured.meta ?? {}),
      "threads.last_switch": metaEntry("THREAD_CHOOSER", {
        at: ts,
        mode: mode === "continue" ? "continue" : "select",
        from: params.state.conversation_id,
      }),
    }

    return {
      nextNode: ensured.active_node,
      reason: `thread switch -> ${mode}`,
      state_override: ensured,
    }
  }

  if (
    params.kind === "TOOL" &&
    (toolName === "postproc-step-1-v1" || toolName === "postproc-step-2-v1" || toolName === "postproc-step-3-v1")
  ) {
    const step = toolName === "postproc-step-1-v1" ? 1 : toolName === "postproc-step-2-v1" ? 2 : 3
    const ts = nowIso()
    return {
      nextNode: specAny.on_success_to ?? params.state.active_node,
      reason: `postproc step ${step} ok`,
      meta_delta: {
        "postproc.last": {
          at: ts,
          step,
          node: params.state.active_node,
          conversation_id: params.state.conversation_id,
        },
      },
    }
  }

  const profile = await readUserProfile(params.userKey)

  if (!profile) {
    const nextNode = specAny.on_success_to ?? params.state.active_node
    return {
      nextNode,
      reason: "profile missing (noop)",
    }
  }

  if (params.kind === "TOOL") {
    const spec = params.spec as ToolSpec
    try {
      if (spec.name === "consolidate-v1") {
        const { profile: updated, updated: didUpdate } = consolidateV1({ profile, state: params.state })
        if (didUpdate) {
          await writeUserProfile({
            userKey: params.userKey,
            profile: updated,
            ttlSeconds: DEFAULT_PROFILE_TTL_SECONDS,
          })
        }
      }

      if (spec.name === "apply-form-to-track-v1") {
        const values = getFormLastValues(params.state)
        if (!values) {
          return {
            nextNode: spec.on_failure_to ?? spec.on_success_to ?? params.state.active_node,
            reason: "tool:apply-form-to-track-v1 missing form.last",
            response_message: "Mangler form.last i state.meta (kør form først).",
          }
        }

        const { profile: p2, track, created } = ensureTrack({
          profile,
          program: "sandbox",
          title: "",
        })

        const ts = nowIso()

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
          p2.core.preferences.preferred_tone = preferred_tone
        }
        if (support_direction) track.core_overlay.help_orientation.support_direction = support_direction
        if (interest_in_methods.length) track.core_overlay.help_orientation.interest_in_methods = interest_in_methods

        track.updated_at = ts
        p2.updated_at = ts

        const evidenceKey = "evidence.v1"
        const existingEvidence =
          (track.extensions &&
            typeof track.extensions[evidenceKey] === "object" &&
            track.extensions[evidenceKey] !== null)
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
          nextNode: spec.on_success_to ?? params.state.active_node,
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
        nextNode: spec.on_success_to ?? params.state.active_node,
        reason: `tool:${spec.name} ok`,
      }
    } catch (e: any) {
      return {
        nextNode: spec.on_failure_to ?? spec.on_success_to ?? params.state.active_node,
        reason: `tool:${spec.name} failed`,
        response_message: typeof e?.message === "string" ? e.message : "Tool failed",
      }
    }
  }

  const spec = params.spec as CheckpointSpec

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
    nextNode: spec.on_success_to ?? params.state.active_node,
    reason: "checkpoint committed",
    meta_delta: {
      "checkpoint.last": {
        at: ts,
        from_node: params.state.active_node,
      },
    },
  }
}
