// chat/threads/threadHandler.ts
import type { NextApiResponse } from "next"
import { createInitialState, createLobbyState } from "../kernel/state"
import { readConversationState, writeConversationState } from "../persistence/conversationStateStore"
import {
  archiveThread,
  ensureThreadIndex,
  isGenericThreadTitle,
  setActiveThread,
  upsertThread,
  writeThreadIndex,
} from "../persistence/threadIndexStore"
import type { ThreadIndex } from "../persistence/threadIndexStore"
import { appendConversationEventV1 } from "../events/store"
import { getOrCreateThreadThemeAndEpisode } from "../memory/longTermMemoryStore"
import { readUserProfile } from "../memory/store"
import { readFacts } from "../memory/longTermMemoryStore"
import { createOpenAiCompatibleClient } from "../ai/provider"
import { newUuid } from "../utils/ids"
import { isLobbyConversation, toLobbyConversationId, withThreadMeta } from "../utils/conversation"
import { SESSION_TTL_SECONDS, PROFILE_TTL_SECONDS, MEMORY_TTL_SECONDS } from "../utils/ttl"
import { nowMs } from "../utils/time"

export type ThreadCreateInput = { type: "THREAD_CREATE"; mode: "normal" | "parenthesis" }
export type ThreadSwitchInput = { type: "THREAD_SWITCH"; conversation_id: string }
export type ThreadArchiveInput = { type: "THREAD_ARCHIVE"; conversation_id?: string }
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


/**
 * Bygger en velkomstbesked til en ny tråd baseret på brugerens historik.
 *
 * Dagbogslogik: når brugeren starter en ny samtale, skal systemet
 * signalere at det husker hvad der har optaget dem tidligere — uden
 * at antage at de vil fortsætte samme spor.
 *
 * Returnerer null hvis:
 * - Der er ingen tidligere tråde med et reelt emne
 * - Alle tråde har generiske titler ("Ny samtale")
 * - Det er en parenthesis-tråd
 */
async function buildAiGreeting(params: {
  userKey: string
  index: ThreadIndex
  newConversationId: string
  mode: "normal" | "parenthesis"
}): Promise<{ greeting: string; topic: string } | null> {
  if (params.mode === "parenthesis") return null

  const previousThreads = params.index.threads.filter(
    (t) =>
      t.conversation_id !== params.newConversationId &&
      t.status === "active" &&
      !isGenericThreadTitle(t.title) &&
      t.title.trim().length > 0
  )

  if (previousThreads.length === 0) return null

  const latest = previousThreads[0]
  const fallbackTopic = latest.title.trim().toLowerCase()
  const fallbackGreeting =
    typeof latest.preview === "string" && latest.preview.trim().length > 10
      ? `Hej igen. Sidst talte vi om ${fallbackTopic} — du nævnte: "${latest.preview.trim().slice(0, 80)}". Hvad har du på hjerte i dag?`
      : `Hej igen. Sidst talte vi om ${fallbackTopic}. Hvad har du på hjerte i dag?`

  try {
    // Saml kontekst til AI-greeten
    const profile = await readUserProfile(params.userKey)

    const topTopics = Object.entries(profile?.topic_scores ?? {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([t]) => t)

    const recentThreads = previousThreads.slice(0, 5).map((t) => {
      const preview = typeof t.preview === "string" ? t.preview.trim().slice(0, 80) : ""
      return preview ? `- ${t.title} ("${preview}")` : `- ${t.title}`
    })

    const canonicalFacts = await readFacts({ userKey: params.userKey, status: "canonical", limit: 30 })
    const factLines = canonicalFacts
      .slice(0, 8)
      .map((f) => `- ${f.key}: ${typeof f.value === "string" ? f.value.slice(0, 120) : JSON.stringify(f.value).slice(0, 120)}`)

    const contextBlock = [
      topTopics.length ? `Brugerens primære emner: ${topTopics.join(", ")}` : null,
      recentThreads.length ? `Seneste samtaler:
${recentThreads.join("\n")}` : null,
      factLines.length ? `Kendte facts om brugeren:\n${factLines.join("\n")}` : null,
    ]
      .filter(Boolean)
      .join("\n\n")

    const llm = createOpenAiCompatibleClient()
    const result = await llm.chatJson({
      model: process.env.HYPNO_MODEL ?? "gpt-4.1-mini",
      temperature: 0.6,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Du er en empatisk hypnoterapeut-assistent. Skriv en personlig velkomstbesked til en returbruger på dansk.

Regler:
- Maks 2 sætninger
- Vis at du husker hvad brugeren tidligere har delt — nævn konkret et emne eller mønster fra historikken
- Slut med ét åbent spørgsmål der inviterer til hvad der fylder i dag — spørgsmålet må gerne åbne for at det kan være noget nyt, fx "Er der noget fra sidst du vil vende tilbage til, eller er der noget nyt på hjerte?"
- Varm og rolig tone — ikke klinisk, ikke overdrevet
- Svar KUN med JSON: { "greeting": "...", "topic": "..." } hvor topic er det primære emne du refererer til`,
        },
        {
          role: "user",
          content: contextBlock || "Ingen historik tilgængelig.",
        },
      ],
    })

    const greeting = typeof result?.greeting === "string" ? result.greeting.trim() : null
    const topic = typeof result?.topic === "string" ? result.topic.trim() : fallbackTopic

    if (greeting && greeting.length > 10) {
      return { greeting, topic }
    }
  } catch {
    // LLM fejlede — brug fallback
  }

  return { greeting: fallbackGreeting, topic: fallbackTopic }
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

  // Byg ny-tråd greeting FØR vi skriver til index (så den nye tråd ikke tæller som "tidligere")
  const index0 = await ensureThreadIndex({ userKey, ttlSeconds: PROFILE_TTL_SECONDS })

  const greetingResult = await buildAiGreeting({ userKey, index: index0, newConversationId: newId, mode })
  if (greetingResult) {
    // Sæt velkomstbesked og seed last_topic i meta så AI'en ved hvad "der" refererer til
    // når brugeren skriver "jeg vil gerne fortsætte der" i den nye tråd.
    const existingMeta = createdState.meta && typeof createdState.meta === "object" ? createdState.meta : {}
    createdState = {
      ...createdState,
      active_node_message: greetingResult.greeting,
      meta: {
        ...existingMeta,
        "gen_hypno.last_topic": { value: greetingResult.topic, source_node: "SYSTEM_THREAD_CREATE" },
      },
    }
  }

  await writeConversationState(createdState, SESSION_TTL_SECONDS)
  let index1 = upsertThread({
    index: index0,
    conversationId: newId,
    title: mode === "parenthesis" ? "Parentesespor" : "Ny samtale",
    preview: "",
  })
  index1 = setActiveThread({ index: index1, conversationId: newId })

  // Prune empty ghost threads older than 30 minutes — silently, no extra Redis calls.
  // A ghost thread is one with no preview (never got a user message) and a generic title.
  const THIRTY_MINUTES_MS = 30 * 60 * 1000
  const now = Date.now()
  index1 = {
    ...index1,
    threads: index1.threads.filter((t) => {
      if (t.conversation_id === newId) return true // keep the new thread
      if (t.status !== "active") return false       // already archived
      const hasContent = (t.preview || "").trim().length > 0
      const hasNamedTitle = (t.title || "").trim().toLowerCase() !== "ny samtale"
      if (hasContent || hasNamedTitle) return true  // has real content
      const age = now - Date.parse(t.updated_at || t.created_at || "")
      return age < THIRTY_MINUTES_MS                // keep if less than 30 min old
    }),
  }

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
  conversationId?: string
}): Promise<void> {
  const { userKey, res } = params

  const index0 = await ensureThreadIndex({ userKey, ttlSeconds: PROFILE_TTL_SECONDS })

  // Brug specifik conversationId hvis angivet (fra trash-knap), ellers aktiv tråd
  const targetId = params.conversationId ?? index0.active_conversation_id
  const activeId = targetId
  if (!activeId || isLobbyConversation(activeId)) {
    res.status(400).json({ error: "No active thread to archive" })
    return
  }

  const index1 = archiveThread({ index: index0, conversationId: activeId })
  await writeThreadIndex({ userKey, index: index1, ttlSeconds: PROFILE_TTL_SECONDS })

  // Kun nulstil til lobby hvis den arkiverede tråd var den aktive
  const wasActive = index0.active_conversation_id === activeId
  const lobbyState = createLobbyState(toLobbyConversationId(userKey))
  if (wasActive) {
    await writeConversationState(lobbyState, SESSION_TTL_SECONDS)
  }

  await emitEvent({
    userKey,
    conversationId: activeId,
    revision: lobbyState.revision,
    nodeId: lobbyState.active_node,
    eventType: "thread_archived",
    payload: { archived_conversation_id: activeId },
  })

  const hasActiveThreadsLeft = index1.threads.some((t) => t.status === "active")

  let responseState: any

  if (!hasActiveThreadsLeft) {
    // Alle tråde er slettet — opret en frisk tråd med standard velkomst.
    // Returnerer IKKE lobby — det undgår at frontenden genopretter gamle emner.
    const freshId = newUuid()
    const freshState = createInitialState(freshId)
    let bound = await ensureThreadBinding({ userKey, conversationId: freshId, state: freshState })
    await writeConversationState(bound.state, SESSION_TTL_SECONDS)

    let freshIndex = upsertThread({ index: index1, conversationId: freshId, title: "Ny samtale", preview: "" })
    freshIndex = setActiveThread({ index: freshIndex, conversationId: freshId })
    await writeThreadIndex({ userKey, index: freshIndex, ttlSeconds: PROFILE_TTL_SECONDS })

    responseState = withThreadMeta(bound.state, freshIndex)
  } else if (wasActive) {
    // Den aktive tråd blev slettet — skift til lobby så frontenden kan vælge ny
    await writeConversationState(lobbyState, SESSION_TTL_SECONDS)
    responseState = withThreadMeta(lobbyState, index1)
  } else {
    // En ikke-aktiv tråd blev slettet — bevar aktiv tråd i state
    const activeId = index1.active_conversation_id
    const activeState = activeId ? await readConversationState(activeId) : null
    responseState = activeState
      ? withThreadMeta(activeState, index1)
      : withThreadMeta(lobbyState, index1)
  }

  res.status(200).json({
    state: responseState,
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
