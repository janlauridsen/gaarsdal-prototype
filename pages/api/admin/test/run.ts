// pages/api/admin/test/run.ts
//
// AI-drevet test runner til Gaarsdal chatbot — chunked mode.
//
// chunk=1 mode (fra test-runner.html):
//   Køres i bidder af chunkSize turns for at undgå 60s timeout.
//   Fra turn 2+: state hentes fra Redis (kræver retain > 0).
//   Returnerer { partial: true, userKey, nextFromTurn, transcript } eller
//               { partial: false, result: TestResult }
//
// Direkte mode (ingen chunk=1):
//   https://gaarsdal.net/api/admin/test/run?token=TOKEN&id=tc-02

import type { NextApiRequest, NextApiResponse } from "next"
import { ALL_TEST_CASES, type TestCase } from "../../../../tests"
import { getRedisClient } from "../../../../chat/persistence/redis"

export const config = { maxDuration: 60 }

// ─── Typer ───────────────────────────────────────────────────────────────────

interface Lookahead {
  rhetorical_instruction: string
  anticipated_user_text: string
  conversation_goal_hypothesis: string | null
}

interface Turn {
  turn: number
  user: string
  bot: string
  revision?: number
  lookahead?: Lookahead
}

interface CriterionResult {
  criterion: string
  passed: boolean
  reasoning: string
}

interface TestResult {
  id: string
  description: string
  passed: boolean
  turns: number
  userKey: string
  error?: string
  criteria: CriterionResult[]
  summary: string
  transcript: Turn[]
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

function validateToken(req: NextApiRequest, res: NextApiResponse): boolean {
  const token = req.query.token
  const expected = process.env.ADMIN_TOKEN
  if (!expected || token !== expected) {
    res.status(401).json({ error: "Unauthorized" })
    return false
  }
  return true
}

// ─── LLM hjælper ─────────────────────────────────────────────────────────────

async function callLLM(systemPrompt: string, userPrompt: string, temperature = 0.7, maxTokens = 300): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  })
  if (!res.ok) throw new Error(`OpenAI fejl: ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() ?? ""
}

// ─── Driver ───────────────────────────────────────────────────────────────────

function buildDriverSystem(tc: TestCase): string {
  return [
    "Du simulerer en bruger i en testscenarie for en hypnoterapi-chatbot.",
    "",
    `Din rolle: ${tc.driverRole}`,
    `Dit mål: ${tc.driverGoal}`,
    `Stop-betingelse: ${tc.exitCondition}`,
    "",
    "Regler:",
    "- Skriv KUN brugerens næste besked — ingen forklaringer eller metakommentarer.",
    "- Skriv på naturlig dansk som en rigtig bruger ville skrive.",
    "- Hvis stop-betingelsen er opfyldt, svar med præcis: STOP",
    "- Vær kortfattet. 1-2 sætninger per tur er nok.",
    "- Hvis assistenten præsenterer en formular med felter (navn, emne, kontakt osv.), udfyld den med",
    "  fiktive men realistiske data — fx 'navn: Anders Nielsen\\nemne: søvnproblemer\\nkontakt: anders@example.com'.",
    "- Stil aldrig det samme spørgsmål to gange. Skift strategi hvis du ikke får svar.",
  ].join("\n")
}

async function driverNextMessage(tc: TestCase, transcript: Turn[]): Promise<string | null> {
  const history =
    transcript.length === 0
      ? "Ingen dialog endnu — start samtalen."
      : transcript
          .map((t) => `Bruger: ${t.user}\nAssistent: ${t.bot}`)
          .join("\n\n")

  const response = await callLLM(
    buildDriverSystem(tc),
    `Nuværende dialog:\n${history}\n\nHvad siger brugeren nu?`,
    0.7
  )

  if (response.trim().toUpperCase() === "STOP") return null
  return response.trim().replace(/^Bruger:\s*/i, "").trim()
}

// ─── Observer ─────────────────────────────────────────────────────────────────

const OBSERVER_SYSTEM = `Du er testobservatør for en hypnoterapi-forberedende chatbot kaldet Gaarsdal.
Din opgave er at evaluere om chatbottens adfærd lever op til de angivne kriterier.
Svar KUN med valid JSON — ingen tekst udenfor JSON-blokken, ingen markdown backticks.`

async function runObserver(tc: TestCase, transcript: Turn[]): Promise<{ passed: boolean; criteria: CriterionResult[]; summary: string }> {
  const transcriptText = transcript
    .map((t) => `[Turn ${t.turn}]\nBruger: ${t.user}\nAssistent: ${t.bot.slice(0, 400)}${t.bot.length > 400 ? "…" : ""}`)
    .join("\n\n")

  const prompt = [
    `Transcript:`,
    transcriptText,
    "",
    `Kriterier at evaluere:`,
    tc.passCriteria.map((c, i) => `${i + 1}. ${c}`).join("\n"),
    "",
    `Returner JSON med præcis denne struktur:`,
    `{`,
    `  "passed": true/false,`,
    `  "criteria": [`,
    `    { "criterion": "...", "passed": true/false, "reasoning": "..." }`,
    `  ],`,
    `  "summary": "Kort samlet vurdering på dansk (1-2 sætninger)"`,
    `}`,
  ].join("\n")

  const raw = await callLLM(OBSERVER_SYSTEM, prompt, 0, 1000)

  try {
    const parsed = JSON.parse(raw)
    return {
      passed: Boolean(parsed.passed),
      criteria: Array.isArray(parsed.criteria) ? parsed.criteria : [],
      summary: String(parsed.summary ?? ""),
    }
  } catch {
    return {
      passed: false,
      criteria: [],
      summary: `Observer parse-fejl: ${raw.slice(0, 200)}`,
    }
  }
}

// ─── Chat-kald ────────────────────────────────────────────────────────────────

async function chatPost(host: string, userKey: string, state: unknown, input: unknown): Promise<{ state: unknown; botMessage: string; revision: number }> {
  const res = await fetch(`https://${host}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `gaarsdal_uid=${userKey}`,
    },
    body: JSON.stringify({ state, input }),
  })
  if (!res.ok) throw new Error(`Chat API fejl: ${res.status}`)
  const data = await res.json()
  const botMessage: string =
    (data as any)?.transition?.response_message ||
    (data as any)?.state?.active_node_message ||
    ""
  const revision: number = (data as any)?.state?.revision ?? 0
  return { state: (data as any).state, botMessage, revision }
}

// ─── Tick look-ahead ─────────────────────────────────────────────────────────

async function tickLookahead(host: string, token: string, userKey: string): Promise<void> {
  const conversationId = `lobby:u:${userKey}`
  try {
    await fetch(
      `https://${host}/api/jobs/drain?token=${encodeURIComponent(token)}&conversationId=${encodeURIComponent(conversationId)}`,
      { method: "GET" }
    )
  } catch { /* non-fatal */ }
  } catch {
    // Non-fatal — look-ahead er best-effort
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

// ─── Look-ahead fetch ─────────────────────────────────────────────────────────

async function fetchAnticipateDrafts(conversationId: string): Promise<Map<number, Lookahead>> {
  const result = new Map<number, Lookahead>()
  try {
    const client = getRedisClient()
    if (!client) return result
    const pattern = `gaarsdal:anticipate:draft:conversation:${conversationId}:*`
    const keys: string[] = await (client as any).keys(pattern)
    if (!keys.length) return result
    const raws = await Promise.all(keys.map((k) => client.get(k)))
    for (const raw of raws) {
      if (!raw) continue
      const d = typeof raw === "string" ? JSON.parse(raw) : raw
      const revision: number = d.based_on_revision ?? 0
      result.set(revision, {
        rhetorical_instruction: d.summary_draft ?? "",
        anticipated_user_text: d.open_questions?.[0] ?? "",
        conversation_goal_hypothesis: typeof d.conversation_goal_hypothesis === "string"
          ? d.conversation_goal_hypothesis : null,
      })
    }
  } catch { /* non-fatal */ }
  return result
}

async function fetchCurrentState(userKey: string): Promise<unknown | null> {
  try {
    const client = getRedisClient()
    if (!client) return null
    const raw = await client.get(`gaarsdal:state:lobby:u:${userKey}`)
    if (!raw) return null
    return typeof raw === "string" ? JSON.parse(raw) : raw
  } catch { return null }
}

// ─── Hjælpere ─────────────────────────────────────────────────────────────────

function generateUserKey(): string {
  return "test-" + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
}

function parseRetain(raw: unknown): number {
  const n = parseInt(String(raw), 10)
  if (isNaN(n) || n <= 0) return 0
  if ([1, 7, 30, 90, 365].includes(n)) return n
  return 7
}

// ─── Chunk-handler ────────────────────────────────────────────────────────────

async function handleChunk(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const token = String(req.query.token ?? "")
  const host = req.headers.host ?? "gaarsdal.net"
  const id = String(req.query.id ?? "")
  const fromTurn = parseInt(String(req.query.fromTurn ?? "0"), 10) || 0
  const chunkSize = Math.min(parseInt(String(req.query.chunkSize ?? "3"), 10) || 3, 6)
  const retentionDays = parseRetain(req.query.retain)
  const turnDelayMs = parseInt(String(req.query.turnDelay ?? "0"), 10) || 0
  let userKey = String(req.query.userKey ?? "")
  let transcript: Turn[] = []

  // Parse transcript from previous chunk
  try {
    const raw = req.query.transcript
    if (typeof raw === "string" && raw.length > 2) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) transcript = parsed
    }
  } catch { /* ignore */ }

  const tc = ALL_TEST_CASES.find((c) => c.id === id)
  if (!tc) {
    res.status(404).json({ error: `Test case '${id}' ikke fundet` })
    return
  }

  try {
    let currentState: unknown = null

    if (fromTurn === 0) {
      // Ny session: opret userKey og sæt consent
      userKey = generateUserKey()
      const rd = retentionDays > 0 ? retentionDays : 7
      const consent = await chatPost(host, userKey, null, { type: "CONSENT_RESPONSE", retentionDays: rd })
      currentState = consent.state
    } else {
      // Chunk 2+: load state fra Redis — undgår at sende null som state
      currentState = await fetchCurrentState(userKey)
    }

    const turnEnd = Math.min(fromTurn + chunkSize, tc.maxTurns)
    let stopped = false

    for (let i = fromTurn; i < turnEnd; i++) {
      const userMsg = await driverNextMessage(tc, transcript)
      if (userMsg === null) { stopped = true; break }

      const chatResult = await chatPost(host, userKey, currentState, { type: "FREE_TEXT", text: userMsg })
      currentState = chatResult.state

      transcript.push({ turn: i + 1, user: userMsg, bot: chatResult.botMessage, revision: chatResult.revision })

      // Look-ahead: trigger async job processing på samme instans
      if (turnDelayMs > 0) {
        await sleep(500)
        await tickLookahead(host, token, userKey)
        await sleep(turnDelayMs)
      }
    }

    const allDone = stopped || transcript.length >= tc.maxTurns || transcript.length >= turnEnd && turnEnd >= tc.maxTurns

    if (!allDone && !stopped && transcript.length < tc.maxTurns) {
      // Flere chunks tilbage
      res.status(200).json({
        partial: true,
        userKey,
        nextFromTurn: transcript.length,
        transcript,
      })
      return
    }

    // Alle turns kørt — hent look-ahead drafts og annoteér transcript
    const conversationId = `lobby:u:${userKey}`
    const drafts = await fetchAnticipateDrafts(conversationId)
    // based_on_revision = Redis state revision after that turn
    for (const t of transcript) {
      const draft = drafts.get(t.revision ?? t.turn)
      if (draft) t.lookahead = draft
    }

    const verdict = await runObserver(tc, transcript)
    const result: TestResult = {
      id: tc.id,
      description: tc.description,
      passed: verdict.passed,
      turns: transcript.length,
      userKey,
      criteria: verdict.criteria,
      summary: verdict.summary,
      transcript,
    }
    res.status(200).json({ partial: false, result })
  } catch (e: any) {
    const result: TestResult = {
      id: tc.id,
      description: tc.description,
      passed: false,
      turns: transcript.length,
      userKey,
      error: String(e?.message ?? e),
      criteria: [],
      summary: "Test afbrudt pga. fejl",
      transcript,
    }
    res.status(200).json({ partial: false, result })
  }
}

// ─── Sekventiel handler (direkte URL-kald uden chunk=1) ───────────────────────

async function runCase(tc: TestCase, host: string): Promise<TestResult> {
  const userKey = generateUserKey()
  const transcript: Turn[] = []

  try {
    const consent = await chatPost(host, userKey, null, { type: "CONSENT_RESPONSE", retentionDays: 7 })
    let currentState = consent.state

    for (let i = 0; i < tc.maxTurns; i++) {
      const userMsg = await driverNextMessage(tc, transcript)
      if (userMsg === null) break

      const chatResult = await chatPost(host, userKey, currentState, { type: "FREE_TEXT", text: userMsg })
      currentState = chatResult.state

      transcript.push({ turn: i + 1, user: userMsg, bot: chatResult.botMessage, revision: chatResult.revision })
    }

    const verdict = await runObserver(tc, transcript)
    return {
      id: tc.id, description: tc.description, passed: verdict.passed,
      turns: transcript.length, userKey, criteria: verdict.criteria,
      summary: verdict.summary, transcript,
    }
  } catch (e: any) {
    return {
      id: tc.id, description: tc.description, passed: false,
      turns: transcript.length, userKey, error: String(e?.message ?? e),
      criteria: [], summary: "Test afbrudt pga. fejl", transcript,
    }
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" })
  if (!validateToken(req, res)) return

  // Chunk mode — kaldt fra test-runner.html
  if (req.query.chunk === "1") {
    return handleChunk(req, res)
  }

  const host = req.headers.host ?? "gaarsdal.net"

  let cases = ALL_TEST_CASES
  if (typeof req.query.id === "string") {
    cases = cases.filter((c) => c.id === req.query.id)
    if (cases.length === 0) return res.status(404).json({ error: `Test case '${req.query.id}' ikke fundet` })
  } else if (typeof req.query.tags === "string") {
    const tag = req.query.tags
    cases = cases.filter((c) => c.tags.includes(tag))
    if (cases.length === 0) return res.status(404).json({ error: `Ingen test cases med tag '${tag}'` })
  }

  const results: TestResult[] = []
  for (const tc of cases) {
    const result = await runCase(tc, host)
    results.push(result)
  }

  const passCount = results.filter((r) => r.passed).length
  res.status(200).json({
    summary: { total: results.length, passed: passCount, failed: results.length - passCount, runAt: new Date().toISOString() },
    results,
  })
}
