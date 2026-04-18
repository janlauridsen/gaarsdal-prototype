// chat/ai/contextPack.ts
import type { ConversationState } from "../kernel/types"
import {
  ensureDefaultThemeAndEpisode,
  readThreadThemeAndEpisode,
  readEpisode,
  readEpisodes,
  readFacts,
  readThemes,
  readTheme,
  type MemoryFact,
} from "../memory/longTermMemoryStore"
import { readUserProfile } from "../memory/store"
import { readLatestDraft } from "../jobs/store"
import { readThreadIndex } from "../persistence/threadIndexStore"

export type ContextPackV23 = {
  system: string
  theme_id?: string
  episode_id?: string
  goal_hypothesis?: string | null
  rhetorical_instruction?: string | null
}

function clamp(s: string, max: number): string {
  const t = (s ?? "").trim().replace(/\s+/g, " ")
  if (!t) return ""
  if (t.length <= max) return t
  return t.slice(0, max - 1) + "…"
}

// Henter separat anticipate_turn draft (gemt under nøgle med job_id prefixet "anticipate:")
async function readAnticipateLatestDraft(conversationId: string): Promise<import("../jobs/types").DraftV1 | null> {
  try {
    const { getRedisClient } = await import("../persistence/redis")
    const client = getRedisClient()
    if (!client) return null
    const KEY_PREFIX = "gaarsdal:"
    const latestKey = `${KEY_PREFIX}anticipate:draft:latest:conversation:${conversationId}`
    const jobId = await client.get<string>(latestKey)
    if (typeof jobId !== "string" || !jobId.trim()) return null
    const draftKey = `${KEY_PREFIX}anticipate:draft:conversation:${conversationId}:${jobId.trim()}`
    const raw = await client.get<unknown>(draftKey)
    if (!raw) return null
    return typeof raw === "string" ? JSON.parse(raw) : (raw as any)
  } catch {
    return null
  }
}

// Topic-overlap: check om mindst ét meningsfuldt token fra anticipated tekst
// optræder i brugerens faktiske tekst. Ignorerer stopord.
const STOPWORDS_DK = new Set(["og", "i", "på", "for", "til", "af", "at", "om", "er", "det", "du", "jeg", "vi", "en", "et", "de", "har", "med", "kan", "ikke", "hvad", "som", "der"])

function topicOverlap(anticipated: string, actual: string): boolean {
  const tokens = (s: string) =>
    s.toLowerCase().replace(/[^a-zæøå\s]/g, " ").split(/\s+/).filter(t => t.length >= 4 && !STOPWORDS_DK.has(t))
  const anticipatedTokens = new Set(tokens(anticipated))
  const actualTokens = tokens(actual)
  return actualTokens.some(t => anticipatedTokens.has(t))
}

function safeValue(value: any): string {
  if (value == null) return ""
  if (typeof value === "string") return clamp(value, 140)
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  try {
    return clamp(JSON.stringify(value), 180)
  } catch {
    return ""
  }
}

function parseThreadAssetKey(key: string): { kind: "summary" | "open_loops"; conversationId: string } | null {
  if (key.startsWith("thread.asset.summary.")) {
    return {
      kind: "summary",
      conversationId: key.slice("thread.asset.summary.".length),
    }
  }
  if (key.startsWith("thread.asset.open_loops.")) {
    return {
      kind: "open_loops",
      conversationId: key.slice("thread.asset.open_loops.".length),
    }
  }
  return null
}

function isCanonicalThreadAsset(fact: MemoryFact): boolean {
  if (fact.status !== "canonical") return false
  return fact.key.startsWith("thread.asset.summary.") || fact.key.startsWith("thread.asset.open_loops.")
}

function buildApprovedThreadAssetLines(params: {
  facts: MemoryFact[]
  currentConversationId: string
}): string[] {
  const grouped = new Map<
    string,
    {
      summary?: string
      openLoops?: string[]
      updated_at: number
    }
  >()

  for (const fact of params.facts) {
    if (!isCanonicalThreadAsset(fact)) continue

    const parsed = parseThreadAssetKey(fact.key)
    if (!parsed) continue
    if (!parsed.conversationId || parsed.conversationId === params.currentConversationId) continue

    const entry = grouped.get(parsed.conversationId) ?? {
      summary: undefined,
      openLoops: undefined,
      updated_at: fact.updated_at,
    }

    if (parsed.kind === "summary" && typeof fact.value === "string") {
      entry.summary = clamp(fact.value, 220)
    }

    if (parsed.kind === "open_loops" && Array.isArray(fact.value)) {
      entry.openLoops = fact.value
        .filter((v) => typeof v === "string")
        .map((v) => clamp(String(v), 140))
        .filter(Boolean)
        .slice(0, 5)
    }

    entry.updated_at = Math.max(entry.updated_at, fact.updated_at)
    grouped.set(parsed.conversationId, entry)
  }

  const ordered = Array.from(grouped.entries())
    .sort((a, b) => b[1].updated_at - a[1].updated_at)
    .slice(0, 8)

  const lines: string[] = []

  for (const [, entry] of ordered) {
    if (entry.summary) {
      lines.push(`- ${entry.summary}`)
    }
    for (const loop of entry.openLoops ?? []) {
      lines.push(`- Åbent loop: ${loop}`)
    }
  }

  return lines
}


function topicEpisodeIdForContext(topic: string): string {
  const normalized = topic.toLowerCase().trim().replace(/\s+/g, "-").slice(0, 60)
  return `episode:topic:${normalized}`
}

async function buildTopicEpisodeLines(params: {
  userKey: string
  currentConversationId: string
  maxTopics?: number
}): Promise<string[]> {
  const profile = await readUserProfile(params.userKey)
  if (!profile) return []

  const topTopics = Object.entries(profile.topic_scores ?? {})
    .filter(([, score]) => score >= 0.4)
    .sort((a, b) => b[1] - a[1])
    .slice(0, params.maxTopics ?? 2)
    .map(([topic]) => topic)

  const lines: string[] = []
  for (const topic of topTopics) {
    const episodeId = topicEpisodeIdForContext(topic)
    const ep = await readEpisode({ userKey: params.userKey, episodeId })
    if (!ep?.summary_short) continue

    lines.push(`Emne "${topic}":`)
    lines.push(`  ${clamp(ep.summary_short, 400)}`)
    if (Array.isArray(ep.open_loops) && ep.open_loops.length) {
      for (const loop of ep.open_loops.slice(0, 4)) {
        lines.push(`  - Åbent: ${clamp(String(loop), 120)}`)
      }
    }
  }
  return lines
}

export async function buildContextPackV23(params: {
  userKey: string
  state: ConversationState
  ttlSeconds: number
  userText?: string
  /** Session-only: spring alle Redis-skrivninger over og returner tom kontekst */
  sessionOnly?: boolean
}): Promise<ContextPackV23> {
  // Session-only: ingen historisk kontekst og ingen Redis-writes
  if (params.sessionOnly) {
    return { system: "", theme_id: undefined, episode_id: undefined }
  }

  // Cross-thread contamination guardrail:
  // If the conversation has an explicit thread binding, always use it.
  const boundThemeId = (params.state.meta?.["thread.theme_id"] as any)?.value
  const boundEpisodeId = (params.state.meta?.["thread.episode_id"] as any)?.value

  const ensured =
    typeof boundThemeId === "string" && typeof boundEpisodeId === "string"
      ? (await readThreadThemeAndEpisode({
          userKey: params.userKey,
          conversationId: params.state.conversation_id,
        })) ??
        (await ensureDefaultThemeAndEpisode({
          userKey: params.userKey,
          ttlSeconds: params.ttlSeconds,
        }))
      : await ensureDefaultThemeAndEpisode({
          userKey: params.userKey,
          ttlSeconds: params.ttlSeconds,
        })

  let themeId = ensured.theme.theme_id
  let episodeId = ensured.episode.episode_id

  // If thread binding exists, do not use any “most recent theme” selection.
  if (typeof boundThemeId === "string" && typeof boundEpisodeId === "string") {
    themeId = boundThemeId
    episodeId = boundEpisodeId
  } else {
    // Prefer actual stored data (it may have been updated async)
    const themes = await readThemes({ userKey: params.userKey, limit: 20 })

    // Iteration 1 selection rule (legacy fallback only):
    // - pick most recently updated active theme, excluding "general" if any other exists.
    const active = themes.filter((t) => t.status === "active")
    const nonGeneral = active.filter((t) => t.theme_id !== "general" && t.theme_id !== "theme:general")
    const selectedTheme = (nonGeneral.length ? nonGeneral : active).sort((a, b) => b.updated_at - a.updated_at)[0]

    themeId = (selectedTheme ?? ensured.theme).theme_id
    const episodes = await readEpisodes({ userKey: params.userKey, themeId, limit: 10 })
    episodeId = episodes[0]?.episode_id ?? ensured.episode.episode_id
  }

  const theme = (await readTheme({ userKey: params.userKey, themeId })) ?? ensured.theme
  const episode = (await readEpisode({ userKey: params.userKey, episodeId })) ?? ensured.episode

  const [canonicalFacts, suggestedFacts] = await Promise.all([
    readFacts({ userKey: params.userKey, status: "canonical", limit: 200 }),
    readFacts({ userKey: params.userKey, status: "suggested", limit: 100 }),
  ])

  const currentConversationId = params.state.conversation_id

  const approvedThreadAssetLines = buildApprovedThreadAssetLines({
    facts: canonicalFacts,
    currentConversationId,
  })

  // Bound and filter facts for prompt relevance (simple v23 heuristic):
  // prefer prefs.* + user.* + theme.* first
  const priority = (k: string): number => {
    if (k.startsWith("prefs.")) return 0
    if (k.startsWith("user.")) return 1
    if (k.startsWith("theme.")) return 2
    if (k.startsWith("track.")) return 3
    if (k.startsWith("triage.")) return 4
    return 9
  }

  const facts = canonicalFacts
    .filter((f) => !isCanonicalThreadAsset(f))
    .slice()
    .sort((a, b) => priority(a.key) - priority(b.key))
    .slice(0, 18)

  const factLines = facts
    .map((f) => {
      const v = safeValue(f.value)
      if (!v) return null
      return `- ${f.key}: ${v}`
    })
    .filter(Boolean) as string[]

  // Suggested facts: only show keys not already covered by canonical, max 6, sorted by confidence
  const canonicalKeys = new Set(canonicalFacts.map((f) => f.key))
  const suggestedLines = suggestedFacts
    .filter((f) => !canonicalKeys.has(f.key) && !isCanonicalThreadAsset(f))
    .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))
    .slice(0, 6)
    .map((f) => {
      const v = safeValue(f.value)
      if (!v) return null
      return `- ${f.key}: ${v} (ubekræftet)`
    })
    .filter(Boolean) as string[]

  const summary = episode.summary_short ? clamp(episode.summary_short, 520) : ""
  const openLoops = Array.isArray(episode.open_loops) ? episode.open_loops.slice(0, 5) : []

  // Topic-collapsed episodes: cross-thread knowledge about recurring topics
  const topicEpisodeLines = await buildTopicEpisodeLines({
    userKey: params.userKey,
    currentConversationId: currentConversationId,
    maxTopics: 2,
  })

  const parts: string[] = []
  parts.push("LANGTIDSKONTEKST (v23, kompakt og bounded):")

  if (topicEpisodeLines.length) {
    parts.push("")
    parts.push("Hvad vi ved om brugerens emner (akkumuleret på tværs af samtaler):")
    parts.push(...topicEpisodeLines)
  }

  parts.push(`Theme: ${theme.label} (${theme.theme_id})`)

  if (summary) {
    parts.push("")
    parts.push("Seneste samtale-opsummering:")
    parts.push(summary)
  }

  if (openLoops.length) {
    parts.push("")
    parts.push("Åbne loops (maks 5):")
    for (const l of openLoops) parts.push(`- ${clamp(String(l), 140)}`)
  }

  if (approvedThreadAssetLines.length) {
    parts.push("")
    parts.push("Godkendte aktiver fra tidligere tråde:")
    parts.push(...approvedThreadAssetLines)
  }

  // Injicér thread-oversigt synkront — altid tilgængeligt uanset scan-status.
  // Giver LLM'en direkte kendskab til alle trådes emner ved is_history_query.
  const threadIdxForList = await readThreadIndex(params.userKey)
  if (threadIdxForList?.threads) {
    const otherThreads = threadIdxForList.threads.filter(
      (t: { conversation_id: string; status?: string }) =>
        t.conversation_id !== params.state.conversation_id && t.status !== "archived"
    )
    if (otherThreads.length) {
      parts.push("")
      parts.push("Brugerens øvrige samtaler (titler og seneste besked):")
      for (const t of otherThreads.slice(0, 6)) {
        const preview = typeof (t as any).preview === "string" && (t as any).preview.trim()
          ? ` — "${clamp((t as any).preview.trim(), 80)}"`
          : ""
        parts.push(`- ${(t as any).title ?? "Samtale"}${preview}`)
      }
    }
  }

  // Inject scan_threads draft early — don't wait for revision 8 accept.
  // This gives AI cross-thread context from turn 2 onwards.
  const latestDraft = await readLatestDraft(params.state.conversation_id)
  if (latestDraft?.summary_draft && !latestDraft.accepted_at) {
    parts.push("")
    parts.push("Kontekst fra tidligere samtaler (foreløbig, ikke bekræftet af bruger):")
    parts.push(clamp(latestDraft.summary_draft, 400))
    if (Array.isArray(latestDraft.open_questions) && latestDraft.open_questions.length) {
      parts.push("Åbne spørgsmål fra tidligere:")
      for (const q of latestDraft.open_questions.slice(0, 3)) {
        parts.push(`- ${clamp(String(q), 120)}`)
      }
    }
  } else {
    // Ingen draft for denne tråd — check andre trådes nyeste drafts.
    const threadIdx2 = threadIdxForList
    if (threadIdx2?.threads) {
      const otherIds = threadIdx2.threads
        .map((t: { conversation_id: string }) => t.conversation_id)
        .filter((id: string) => id !== params.state.conversation_id)
      for (const otherId of otherIds.slice(0, 3)) {
        const otherDraft = await readLatestDraft(otherId)
        if (otherDraft?.summary_draft) {
          parts.push("")
          parts.push("Detaljeret kontekst fra tidligere samtale:")
          parts.push(clamp(otherDraft.summary_draft, 400))
          break
        }
      }
    }
  }

  if (factLines.length) {
    parts.push("")
    parts.push("Kendte facts (canonical, redigerbare af bruger):")
    parts.push(...factLines)
  }

  if (suggestedLines.length) {
    parts.push("")
    parts.push("Mulige facts (ikke bekræftet — brug lavmælt):")
    parts.push(...suggestedLines)
  }

  // Inject anticipate_turn retorisk instruktion — kun hvis brugerens input er on-track.
  // Hent anticipate-draft separat (har kind="anticipate_turn", gemt under samme draft-nøgler).
  //
  // Relevance-strategi (to niveauer):
  // 1. Token-overlap: eksakt match mellem forudset og faktisk brugertekst.
  // 2. Fresh-draft fallback: hvis draftet er lavet til netop dette turn
  //    (based_on_revision === current revision - 1), er det per definition
  //    relevant — LLM-simulationen byggede på den forrige assistent-respons
  //    og er i sync med emnet. Inject uden token-check.
  if (params.userText) {
    // Closing-signal: spring retorisk instruktion over — brugeren er ved at afslutte
    // og anticipate-draft må aldrig presse mod fortsat refleksion når brugeren lukker.
    const closingExact = ["tak", "ok tak", "okay tak", "mange tak", "farvel", "hej hej",
      "det var nyttigt", "tusind tak", "tak for det", "tak skal du have", "det er nok"]
    const closingPhrases = ["tak for", "jeg tager det med", "lad os stoppe", "det var alt",
      "det vil jeg gøre", "godt, det prøver jeg", "ja det lyder godt"]
    const userLower = params.userText.trim().toLowerCase()
    const isClosing = closingExact.includes(userLower)
      || closingPhrases.some(p => userLower.includes(p))

  }

  // rhetorical_instruction håndteres som separat felt (ikke i system-strengen)
  // så det kan injiceres som et hard-directive i singleTurnCall fremfor som soft kontekst.

  // Guardrail: keep this compact; if empty, return empty string.
  const system = parts.join("\n").trim()

  // Hent goal_hypothesis og rhetorical_instruction fra anticipate draft
  let goalHypothesis: string | null = null
  let rhetoricalInstruction: string | null = null
  if (params.userText) {
    try {
      const closingExact = ["tak", "ok tak", "okay tak", "mange tak", "farvel", "hej hej",
        "det var nyttigt", "tusind tak", "tak for det", "tak skal du have", "det er nok"]
      const closingPhrases = ["tak for", "jeg tager det med", "lad os stoppe", "det var alt",
        "det vil jeg gøre", "godt, det prøver jeg", "ja det lyder godt"]
      const userLower = params.userText.trim().toLowerCase()
      const isClosing = closingExact.includes(userLower)
        || closingPhrases.some(p => userLower.includes(p))

      if (!isClosing) {
        const draft = await readAnticipateLatestDraft(params.state.conversation_id)
        const gh = (draft as any)?.conversation_goal_hypothesis
        if (typeof gh === "string" && gh.trim().length > 0) {
          goalHypothesis = gh.trim()
        }
        if (draft?.summary_draft && draft.open_questions?.[0]) {
          const anticipatedText = draft.open_questions[0].toLowerCase()
          const actualText = params.userText.toLowerCase()
          const currentRevision = (params.state.revision ?? 1)
          const draftRevision = (draft as any).based_on_revision ?? 0
          const isFreshDraft = draftRevision >= currentRevision - 1
          const isOnTrack = isFreshDraft || topicOverlap(anticipatedText, actualText)
          if (isOnTrack) {
            rhetoricalInstruction = clamp(draft.summary_draft, 300)
          }
        }
      }
    } catch { /* non-fatal */ }
  }

  return {
    system: system === "LANGTIDSKONTEKST (v23, kompakt og bounded):" ? "" : system,
    theme_id: themeId,
    episode_id: episodeId,
    goal_hypothesis: goalHypothesis,
    rhetorical_instruction: rhetoricalInstruction,
  }
}
