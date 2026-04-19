// pages/api/admin/ttm-test.ts
// TTM-specifik test runner.
// Kører AI-drevne testcases mod /api/talk-to-me-chat.
// Understøtter model-sammenligning via ?model= parameteren.
//
// GET  /api/admin/ttm-test?token=TOKEN&id=ttm-01  — kør én test
// GET  /api/admin/ttm-test?token=TOKEN             — kør alle
// GET  /api/admin/ttm-test?token=TOKEN&id=ttm-01&model=gpt-4o — kør med specifik model

import type { NextApiRequest, NextApiResponse } from "next"
import { ALL_TTM_TEST_CASES, type TtmTestCase } from "../../../tests/ttm/index"
import { newUuid } from "../../../chat/utils/ids"

export const config = { maxDuration: 60 }

// ─── Auth ──────────────────────────────────────────────────────────────────────

function validateToken(req: NextApiRequest, res: NextApiResponse): boolean {
  const token = req.query.token
  const expected = process.env.ADMIN_TOKEN
  if (!expected || token !== expected) {
    res.status(401).json({ error: "Unauthorized" })
    return false
  }
  return true
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Turn {
  turn: number
  user: string
  bot: string
  move?: string
}

interface CriterionResult {
  criterion: string
  passed: boolean
  reasoning: string
}

interface TtmTestResult {
  id: string
  description: string
  model: string
  passed: boolean
  turns: number
  error?: string
  passCriteria: CriterionResult[]
  moveCriteria: CriterionResult[]
  moveDistribution: Record<string, number>
  summary: string
  transcript: Turn[]
}

// ─── LLM hjælper ───────────────────────────────────────────────────────────────

async function callLLM(systemPrompt: string, userPrompt: string, temperature = 0.7, maxTokens = 400): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      temperature,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  })
  if (!res.ok) throw new Error(`LLM fejl: ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() ?? ""
}

// ─── Driver ─────────────────────────────────────────────────────────────────────

function buildDriverSystem(tc: TtmTestCase): string {
  return [
    "Du simulerer en bruger i en samtale med en samtalepartner kaldet Jan.",
    "",
    `Din rolle: ${tc.driverRole}`,
    `Dit mål: ${tc.driverGoal}`,
    `Stop-betingelse: ${tc.exitCondition}`,
    "",
    "Regler:",
    "- Skriv KUN brugerens næste besked — ingen forklaringer.",
    "- Naturlig dansk. 1-2 sætninger.",
    "- Hvis stop-betingelsen er opfyldt, svar med præcis: STOP",
    "- Stil aldrig det samme spørgsmål to gange.",
  ].join("\n")
}

async function driverNextMessage(tc: TtmTestCase, transcript: Turn[]): Promise<string | null> {
  const history =
    transcript.length === 0
      ? "Ingen dialog endnu — start samtalen naturligt."
      : transcript.map((t) => `Bruger: ${t.user}\nJan: ${t.bot}`).join("\n\n")

  const response = await callLLM(
    buildDriverSystem(tc),
    `Nuværende dialog:\n${history}\n\nHvad siger brugeren nu?`,
    0.7
  )

  if (response.trim().toUpperCase() === "STOP") return null
  return response.trim().replace(/^Bruger:\s*/i, "").trim()
}

// ─── TTM API kald ───────────────────────────────────────────────────────────────

async function ttmPost(
  host: string,
  userKey: string,
  conversationId: string,
  userText: string,
  modelOverride?: string,
  retentionDays?: number
): Promise<{ botMessage: string; move?: string; conversationId: string }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Cookie: `gaarsdal_uid=${userKey}`,
  }

  const body: Record<string, unknown> = { userText, conversationId }
  if (typeof retentionDays === "number") body.retentionDays = retentionDays

  const res = await fetch(`https://${host}/api/talk-to-me-chat`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`TTM API fejl: ${res.status}`)
  const data = await res.json()
  return {
    botMessage: (data as any).message ?? "",
    move: (data as any).move,
    conversationId: (data as any).conversationId ?? conversationId,
  }
}

// ─── Observer ───────────────────────────────────────────────────────────────────

const OBSERVER_SYSTEM = `Du er testobservatør for TTM — Talk To Me, en samtaleassistent.
Din opgave er at evaluere om Jan (assistenten) lever op til kriterierne.

Vigtige fortolkningsregler:
- "Max X%" betyder at X% er et LOFT, ikke et mål. 0% spørgsmål er BEDRE end 50% og skal evalueres som bestået.
- "Mindst ét X move" er bestået hvis X forekommer én eller flere gange.
- Evaluer kvaliteten af Jan's svar, ikke kun tællebare mønstre.

Svar KUN med valid JSON — ingen tekst udenfor JSON.`

async function runObserver(
  tc: TtmTestCase,
  transcript: Turn[],
  moveDistribution: Record<string, number>
): Promise<{ passed: boolean; passCriteria: CriterionResult[]; moveCriteria: CriterionResult[]; summary: string }> {

  const transcriptText = transcript
    .map((t) => `[Turn ${t.turn}] (move: ${t.move ?? "?"})\nBruger: ${t.user}\nJan: ${t.bot}`)
    .join("\n\n")

  const moveText = Object.entries(moveDistribution)
    .map(([m, n]) => `${m}: ${n}`)
    .join(", ")

  const passCriteriaText = tc.passCriteria.map((c, i) => `${i + 1}. ${c}`).join("\n")
  const moveCriteriaText = (tc.moveCriteria ?? []).map((c, i) => `${i + 1}. ${c}`).join("\n")

  const prompt = [
    `Transcript (${transcript.length} turns):`,
    transcriptText,
    "",
    `Move-fordeling: ${moveText}`,
    "",
    `Pass-kriterier:`,
    passCriteriaText,
    "",
    moveCriteriaText ? `Move-kriterier:\n${moveCriteriaText}` : "",
    "",
    `Returnér JSON:`,
    `{`,
    `  "passed": true/false,`,
    `  "passCriteria": [{ "criterion": "...", "passed": true/false, "reasoning": "..." }],`,
    `  "moveCriteria": [{ "criterion": "...", "passed": true/false, "reasoning": "..." }],`,
    `  "summary": "1-2 sætninger på dansk"`,
    `}`,
    `"passed" er true kun hvis ALLE pass-kriterier er opfyldt.`,
  ].join("\n")

  const raw = await callLLM(OBSERVER_SYSTEM, prompt, 0, 1200)

  try {
    const parsed = JSON.parse(raw)
    return {
      passed: Boolean(parsed.passed),
      passCriteria: Array.isArray(parsed.passCriteria) ? parsed.passCriteria : [],
      moveCriteria: Array.isArray(parsed.moveCriteria) ? parsed.moveCriteria : [],
      summary: String(parsed.summary ?? ""),
    }
  } catch {
    return {
      passed: false,
      passCriteria: [],
      moveCriteria: [],
      summary: `Observer parse-fejl: ${raw.slice(0, 200)}`,
    }
  }
}

// ─── Kør én test ────────────────────────────────────────────────────────────────

async function runOneTest(
  tc: TtmTestCase,
  host: string,
  modelOverride?: string
): Promise<TtmTestResult> {

  const userKey = `ttm-test-${newUuid().slice(0, 12)}`
  const conversationId = `ttm:test-${newUuid()}`
  const transcript: Turn[] = []
  const moveDistribution: Record<string, number> = {}

  // Begræns turns for store modeller der er langsomme (undgå 60s Vercel timeout)
  const isLargeModel = modelOverride === "gpt-4o" || modelOverride === "gpt-4.1"
  const effectiveMaxTurns = isLargeModel ? Math.min(tc.maxTurns, 4) : tc.maxTurns

  try {
    // Init — sæt samtykke (retentionDays: 90) så state persisteres i Redis
    await ttmPost(host, userKey, conversationId, "", modelOverride, 90)

    // Hent Q1
    const init = await ttmPost(host, userKey, conversationId, "", modelOverride)
    const actualConvId = init.conversationId

    // Skip ritual — send score og top-of-mind automatisk
    await ttmPost(host, userKey, actualConvId, "7", modelOverride)
    const topOfMind = await driverNextMessage(tc, [])
    if (topOfMind) {
      await ttmPost(host, userKey, actualConvId, topOfMind, modelOverride)
    }

    // Kør samtalen
    for (let i = 0; i < effectiveMaxTurns; i++) {
      const userMsg = await driverNextMessage(tc, transcript)
      if (!userMsg) break

      const { botMessage, move } = await ttmPost(host, userKey, actualConvId, userMsg, modelOverride)
      if (!botMessage) break

      const turnMove = move ?? "UNKNOWN"
      moveDistribution[turnMove] = (moveDistribution[turnMove] ?? 0) + 1

      transcript.push({ turn: i + 1, user: userMsg, bot: botMessage, move: turnMove })
    }

    // Observer evaluerer
    const observation = await runObserver(tc, transcript, moveDistribution)

    return {
      id: tc.id,
      description: tc.description,
      model: modelOverride ?? process.env.TTM_MODEL ?? "gpt-4.1-mini",
      passed: observation.passed,
      turns: transcript.length,
      passCriteria: observation.passCriteria,
      moveCriteria: observation.moveCriteria,
      moveDistribution,
      summary: observation.summary,
      transcript,
    }

  } catch (err) {
    return {
      id: tc.id,
      description: tc.description,
      model: modelOverride ?? "unknown",
      passed: false,
      turns: transcript.length,
      error: String(err),
      passCriteria: [],
      moveCriteria: [],
      moveDistribution,
      summary: `Fejl: ${String(err)}`,
      transcript,
    }
  }
}

// ─── Handler ────────────────────────────────────────────────────────────────────

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!validateToken(req, res)) return

  const host = req.headers.host ?? "gaarsdal.net"
  const id = typeof req.query.id === "string" ? req.query.id : null
  const modelOverride = typeof req.query.model === "string" ? req.query.model : undefined

  const cases = id
    ? ALL_TTM_TEST_CASES.filter((tc) => tc.id === id)
    : ALL_TTM_TEST_CASES

  if (cases.length === 0) {
    res.status(404).json({ error: `Test ikke fundet: ${id}` })
    return
  }

  try {
    const results: TtmTestResult[] = []
    for (const tc of cases) {
      const result = await runOneTest(tc, host, modelOverride)
      results.push(result)
    }

    const passed = results.filter((r) => r.passed).length
    res.status(200).json({
      total: results.length,
      passed,
      failed: results.length - passed,
      model: modelOverride ?? process.env.TTM_MODEL ?? "gpt-4.1-mini",
      results,
    })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
}
