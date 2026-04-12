// pages/api/admin/test/run.ts
//
// AI-drevet test runner til Gaarsdal chatbot.
//
// Kør via browser:
//   https://gaarsdal.net/api/admin/test/run?token=ADMIN_TOKEN           (alle cases)
//   https://gaarsdal.net/api/admin/test/run?token=ADMIN_TOKEN&id=tc-02  (én case)
//   https://gaarsdal.net/api/admin/test/run?token=ADMIN_TOKEN&tags=handoff (cases med tag)

import type { NextApiRequest, NextApiResponse } from "next"
import { ALL_TEST_CASES, type TestCase } from "../../../../tests"

export const config = { maxDuration: 60 }

// ─── Typer ───────────────────────────────────────────────────────────────────

interface Turn {
  turn: number
  user: string
  bot: string
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
  const expected = process.env.GAARSDAL_ADMIN_TOKEN
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
  return response.trim()
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

async function chatPost(host: string, userKey: string, state: unknown, input: unknown): Promise<{ state: unknown; botMessage: string }> {
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
  return { state: (data as any).state, botMessage }
}

// ─── Kør én test case ─────────────────────────────────────────────────────────

function generateUserKey(): string {
  return "test-" + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
}

async function runCase(tc: TestCase, host: string): Promise<TestResult> {
  const userKey = generateUserKey()
  const transcript: Turn[] = []

  try {
    // 1. Consent (session-only: retentionDays 0 = ingen Redis-forurening)
    const consent = await chatPost(host, userKey, null, { type: "CONSENT_RESPONSE", retentionDays: 0 })
    let currentState = consent.state

    // 2. Driver-loop
    for (let i = 0; i < tc.maxTurns; i++) {
      const userMsg = await driverNextMessage(tc, transcript)
      if (userMsg === null) break

      const chatResult = await chatPost(host, userKey, currentState, { type: "FREE_TEXT", text: userMsg })
      currentState = chatResult.state

      transcript.push({
        turn: i + 1,
        user: userMsg,
        bot: chatResult.botMessage,
      })
    }

    // 3. Observer
    const verdict = await runObserver(tc, transcript)

    return {
      id: tc.id,
      description: tc.description,
      passed: verdict.passed,
      turns: transcript.length,
      userKey,
      criteria: verdict.criteria,
      summary: verdict.summary,
      transcript,
    }
  } catch (e: any) {
    return {
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
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" })
  if (!validateToken(req, res)) return

  const host = req.headers.host ?? "gaarsdal.net"

  // Filtrer cases
  let cases = ALL_TEST_CASES
  if (typeof req.query.id === "string") {
    cases = cases.filter((c) => c.id === req.query.id)
    if (cases.length === 0) return res.status(404).json({ error: `Test case '${req.query.id}' ikke fundet` })
  } else if (typeof req.query.tags === "string") {
    const tag = req.query.tags
    cases = cases.filter((c) => c.tags.includes(tag))
    if (cases.length === 0) return res.status(404).json({ error: `Ingen test cases med tag '${tag}'` })
  }

  // Kør cases sekventielt (undgår rate limits og timeout-problemer)
  const results: TestResult[] = []
  for (const tc of cases) {
    const result = await runCase(tc, host)
    results.push(result)
  }

  const passCount = results.filter((r) => r.passed).length
  const summary = {
    total: results.length,
    passed: passCount,
    failed: results.length - passCount,
    runAt: new Date().toISOString(),
  }

  res.status(200).json({ summary, results })
}
