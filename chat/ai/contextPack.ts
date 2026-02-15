import type { ConversationState } from "../kernel/types"
import { ensureDefaultThemeAndEpisode, readEpisode, readEpisodes, readFacts, readThemes } from "../memory/longTermMemoryStore"

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

export async function buildContextPackV23(params: {
  userKey: string
  state: ConversationState
  ttlSeconds: number
}): Promise<ContextPackV23> {
  // Best-effort: if memory store is disabled/unavailable, this should degrade to empty context.
  const ensured = await ensureDefaultThemeAndEpisode({
    userKey: params.userKey,
    ttlSeconds: params.ttlSeconds,
  })

  // Prefer actual stored data (it may have been updated async)
  const themes = await readThemes({ userKey: params.userKey, limit: 20 })

  // Iteration 1 selection rule:
  // - pick most recently updated active theme, excluding "general" if any other exists.
  const active = themes.filter((t) => t.status === "active")
  const nonGeneral = active.filter((t) => t.theme_id !== "general")
  const selectedTheme = (nonGeneral.length ? nonGeneral : active).sort((a, b) => b.updated_at - a.updated_at)[0]

  const theme = selectedTheme ?? ensured.theme
  const themeId = theme.theme_id

  // Pick most recent episode for selected theme; fallback to ensured episode.
  const episodes = await readEpisodes({ userKey: params.userKey, themeId, limit: 10 })
  const episodeId = episodes[0]?.episode_id ?? ensured.episode.episode_id
  const episode = (await readEpisode({ userKey: params.userKey, episodeId })) ?? ensured.episode

  const canonicalFacts = await readFacts({
    userKey: params.userKey,
    status: "canonical",
    limit: 200,
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
