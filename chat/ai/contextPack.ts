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

export type ContextPackV23 = {
  system: string
  theme_id?: string
  episode_id?: string
}

function clamp(s: string, max: number): string {
  const t = (s ?? "").trim().replace(/\s+/g, " ")
  if (!t) return ""
  if (t.length <= max) return t
  return t.slice(0, max - 1) + "…"
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

export async function buildContextPackV23(params: {
  userKey: string
  state: ConversationState
  ttlSeconds: number
}): Promise<ContextPackV23> {
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

  const canonicalFacts = await readFacts({
    userKey: params.userKey,
    status: "canonical",
    limit: 200,
  })

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

  const summary = episode.summary_short ? clamp(episode.summary_short, 520) : ""
  const openLoops = Array.isArray(episode.open_loops) ? episode.open_loops.slice(0, 5) : []

  const parts: string[] = []
  parts.push("LANGTIDSKONTEKST (v23, kompakt og bounded):")
  parts.push(`Theme: ${theme.label} (${theme.theme_id})`)

  if (summary) {
    parts.push("")
    parts.push("Seneste episode-opsummering:")
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

  if (factLines.length) {
    parts.push("")
    parts.push("Kendte facts (canonical, redigerbare af bruger):")
    parts.push(...factLines)
  }

  // Guardrail: keep this compact; if empty, return empty string.
  const system = parts.join("\n").trim()
  return {
    system: system === "LANGTIDSKONTEKST (v23, kompakt og bounded):" ? "" : system,
    theme_id: themeId,
    episode_id: episodeId,
  }
}
