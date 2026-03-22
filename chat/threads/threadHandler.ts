// chat/threads/threadHandler.ts
import type { NextApiResponse } from "next"
import { createInitialState, createLobbyState } from "../kernel/state"
import { readConversationState, writeConversationState } from "../persistence/conversationStateStore"
import {
  archiveThread,
  ensureThreadIndex,
  setActiveThread,
  upsertThread,
  writeThreadIndex,
} from "../persistence/threadIndexStore"
import { appendConversationEventV1 } from "../events/store"
import { getOrCreateThreadThemeAndEpisode } from "../memory/longTermMemoryStore"
import { newUuid } from "../utils/ids"
import { isLobbyConversation, toLobbyConversationId, withThreadMeta } from "../utils/conversation"
import { SESSION_TTL_SECONDS, PROFILE_TTL_SECONDS, MEMORY_TTL_SECONDS } from "../utils/ttl"
import { nowMs } from "../../utils/time"

export type ThreadCreateInput = { type: "THREAD_CREATE"; mode: "normal" | "parenthesis" }
export type ThreadSwitchInput = { type: "THREAD_SWITCH"; conversation_id: string }
export type ThreadArchiveInput = { type: "THREAD_ARCHIVE" }
export type ThreadInput = ThreadCreateInput | ThreadSwitchInput | ThreadArchiveInput


function withThreadNavMeta(state: any, returnDepth: number): any {
  return {
    ...state,
    meta: {
      ...(state?.meta ?? {}),
      "threads.return_depth": { value: returnDepth, source_node: "SYSTEM_UI" },
    },
  }
}

async function ensureThreadBinding(params: {
  userKey: string
  conversationId: string
  state: any
}): Promise<{ state: any }> {
  const meta = params.state?.meta && typeof params.state.meta === "object" ? params.state.meta : {}
  const existingThemeId = (meta?.["thread.theme_id"] as any)?.value
  const existingEpisodeId = (meta?.["thread.episode_id"] as any)?.value
  if (typeof existingThemeId === "string" && typeof existingEpisodeId === "string") {
    return { state: params.state }
  }

  const ensured = await getOrCreateThreadThemeAndEpisode({
    userKey: params.userKey,
    conversationId: params.conversationId,
    ttlSeconds: MEMORY_TTL_SECONDS,
  })

  const nextMeta = {
    ...meta,
    "thread.theme_id": { value: ensured.theme.theme_id, source_node: "SYSTEM_THREAD_BINDING" },
    "thread.episode_id": { value: ensured.episode.episode_id, source_node: "SYSTEM_THREAD_BINDING" },
  }
  return { state: { ...params.state, meta: nextMeta } }
}

async function emitEvent(params: {
  userKey: string
  conversationId: string
  revision: number
  nodeId?: string | null
  eventType: string
  payload: unknown
}): Promise<void> {
  await appendConversationEventV1({
    schema_version: "v1",
    event_id: newUuid(),
    event_type: params.eventType as any,
    conversation_id: params.conversationId,
    user_key: params.userKey,
    revision: params.revision,
    input_id: params.revision,
    node_id: params.nodeId ?? undefined,
    timestamp_ms: nowMs(),
    payload: params.payload,
  })
}

export async function handleThreadCreate(params: {
  input: ThreadCreateInput
  userKey: string
  res: NextApiResponse
}): Promise<void> {
  const { input, userKey, res } = params
  const newId = newUuid()
  const initialThreadState = createInitialState(newId)
  const mode = input.mode === "parenthesis" ? "parenthesis" : "normal"

  let createdState =
    mode === "parenthesis"
      ? {
          ...withThreadNavMeta(initialThreadState, 0),
          active_node: "PARENTHESIS",
          active_node_message:
            "Velkommen. Her kan du tænke frit og undersøgende, og jeg hjælper med at holde rammen klar.",
          meta: {
            ...(withThreadNavMeta(initialThreadState, 0).meta ?? {}),
            "thread.mode": { value: "parenthesis", source_node: "SYSTEM_THREAD_CREATE" },
          },
        }
      : withThreadNavMeta(initialThreadState, 0)

  const binding = await ensureThreadBinding({ userKey, conversationId: newId, state: createdState })
  createdState = binding.state

  await writeConversationState(createdState, SESSION_TTL_SECONDS)

  const index0 = await ensureThreadIndex({ userKey, ttlSeconds: PROFILE_TTL_SECONDS })
  let index1 = upsertThread({
    index: index0,
    conversationId: newId,
    title: mode === "parenthesis" ? "Parentesespor" : "Ny samtale",
    preview: "",
  })
  index1 = setActiveThread({ index: index1, conversationId: newId })
  await writeThreadIndex({ userKey, index: index1, ttlSeconds: PROFILE_TTL_SECONDS })

  await emitEvent({
    userKey,
    conversationId: newId,
    revision: createdState.revision,
    nodeId: createdState.active_node,
    eventType: "thread_created",
    payload: { thread_mode: mode, active_node: createdState.active_node },
  })

  res.status(200).json({
    state: withThreadMeta(createdState, index1),
    transition: { type: "THREAD_CREATE", from: null, to: createdState.active_node, reason: "thread created" },
    log: {
      conversation_id: newId,
      revision_before: -1,
      revision_after: createdState.revision,
      active_node_before: null,
      active_node_after: createdState.active_node,
      input_type: "UI_ACTION",
      transition_type: "THREAD_CREATE",
      timestamp: new Date().toISOString(),
    },
  })
}

export async function handleThreadSwitch(params: {
  input: ThreadSwitchInput
  userKey: string
  res: NextApiResponse
}): Promise<void> {
  const { input, userKey, res } = params
  const targetId = input.conversation_id
  if (!targetId || typeof targetId !== "string") {
    res.status(400).json({ error: "Missing conversation_id for THREAD_SWITCH" })
    return
  }

  const stored = await readConversationState(targetId)
  if (!stored) {
    res.status(404).json({ error: "Thread not found" })
    return
  }

  const index0 = await ensureThreadIndex({ userKey, ttlSeconds: PROFILE_TTL_SECONDS })
  let index1 = upsertThread({ index: index0, conversationId: targetId })
  index1 = setActiveThread({ index: index1, conversationId: targetId })
  await writeThreadIndex({ userKey, index: index1, ttlSeconds: PROFILE_TTL_SECONDS })

  await emitEvent({
    userKey,
    conversationId: targetId,
    revision: stored.revision,
    nodeId: stored.active_node,
    eventType: "thread_switched",
    payload: { active_node: stored.active_node },
  })

  res.status(200).json({
    state: withThreadMeta(stored, index1),
    transition: { type: "THREAD_SWITCH", from: null, to: stored.active_node, reason: "thread switched" },
    log: {
      conversation_id: stored.conversation_id,
      revision_before: stored.revision,
      revision_after: stored.revision,
      active_node_before: stored.active_node,
      active_node_after: stored.active_node,
      input_type: "UI_ACTION",
      transition_type: "THREAD_SWITCH",
      timestamp: new Date().toISOString(),
    },
  })
}

export async function handleThreadArchive(params: {
  userKey: string
  res: NextApiResponse
}): Promise<void> {
  const { userKey, res } = params

  const index0 = await ensureThreadIndex({ userKey, ttlSeconds: PROFILE_TTL_SECONDS })
  const activeId = index0.active_conversation_id
  if (!activeId || isLobbyConversation(activeId)) {
    res.status(400).json({ error: "No active thread to archive" })
    return
  }

  const index1 = archiveThread({ index: index0, conversationId: activeId })
  await writeThreadIndex({ userKey, index: index1, ttlSeconds: PROFILE_TTL_SECONDS })

  const lobbyState = createLobbyState(toLobbyConversationId(userKey))
  await writeConversationState(lobbyState, SESSION_TTL_SECONDS)

  await emitEvent({
    userKey,
    conversationId: activeId,
    revision: lobbyState.revision,
    nodeId: lobbyState.active_node,
    eventType: "thread_archived",
    payload: { archived_conversation_id: activeId },
  })

  res.status(200).json({
    state: withThreadMeta(lobbyState, index1),
    transition: { type: "THREAD_ARCHIVE", from: activeId, to: lobbyState.active_node, reason: "thread archived" },
    log: {
      conversation_id: lobbyState.conversation_id,
      revision_before: lobbyState.revision,
      revision_after: lobbyState.revision,
      active_node_before: lobbyState.active_node,
      active_node_after: lobbyState.active_node,
      input_type: "UI_ACTION",
      transition_type: "THREAD_ARCHIVE",
      timestamp: new Date().toISOString(),
    },
  })
}
