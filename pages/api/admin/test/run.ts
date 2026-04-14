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

interface ChunkResult {
  partial: boolean
  userKey: string
  fromTurn: number
  nextFromTurn: number
  transcript: Turn[]
  done: boolean
  result?: TestResult
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
    const criteria = Array.isArray(parsed.criteria) ? parsed.criteria : []
    // Beregn passed fra kriterier frem for at stole på LLM's top-level felt
    const passed = criteria.length > 0
      ? criteria.every((c: any) => c.passed === true)
      : Boolean(parsed.passed)
    return {
      passed,
      criteria,
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

// ─── Chunked kørsel ───────────────────────────────────────────────────────────
// Kører maxTurnsPerChunk turns ad gangen.
// Første kald: fromTurn=0, userKey genereres automatisk.
// Efterfølgende kald: fromTurn=N, userKey fra forrige svar.
// Når alle turns er kørt eller exitCondition er nået: kør observer og returner resultat.

async function runChunk(
  tc: TestCase,
  host: string,
  fromTurn: number,
  prevTranscript: Turn[],
  userKey: string,
  chunkSize: number,
  retentionDays: number
): Promise<ChunkResult> {
  const transcript = [...prevTranscript]

  try {
    // Hent eller opret state via consent hvis første chunk
    let currentState: any = null
    if (fromTurn === 0) {
      const consent = await chatPost(host, userKey, null, { type: "CONSENT_RESPONSE", retentionDays })
      currentState = consent.state
    }

    const toTurn = Math.min(fromTurn + chunkSize, tc.maxTurns)

    for (let i = fromTurn; i < toTurn; i++) {
      const userMsg = await driverNextMessage(tc, transcript)
      if (userMsg === null || userMsg === "STOP") {
        // Kør observer og returner
        const verdict = await runObserver(tc, transcript)
        return {
          partial: false,
          done: true,
          userKey,
          fromTurn,
          nextFromTurn: i,
          transcript,
          result: {
            id: tc.id,
            description: tc.description,
            passed: verdict.passed,
            turns: transcript.length,
            userKey,
            criteria: verdict.criteria,
            summary: verdict.summary,
            transcript,
          },
        }
      }

      const chatResult = await chatPost(host, userKey, currentState, { type: "FREE_TEXT", text: userMsg })
      currentState = chatResult.state

      transcript.push({
        turn: i + 1,
        user: userMsg,
        bot: chatResult.botMessage,
      })
    }

    const allTurnsDone = toTurn >= tc.maxTurns

    if (allTurnsDone) {
      // Alle turns kørt — kør observer
      const verdict = await runObserver(tc, transcript)
      return {
        partial: false,
        done: true,
        userKey,
        fromTurn,
        nextFromTurn: toTurn,
        transcript,
        result: {
          id: tc.id,
          description: tc.description,
          passed: verdict.passed,
          turns: transcript.length,
          userKey,
          criteria: verdict.criteria,
          summary: verdict.summary,
          transcript,
        },
      }
    }

    // Flere turns tilbage — returner delresultat
    return {
      partial: true,
      done: false,
      userKey,
      fromTurn,
      nextFromTurn: toTurn,
      transcript,
    }
  } catch (e: any) {
    return {
      partial: false,
      done: true,
      userKey,
      fromTurn,
      nextFromTurn: fromTurn,
      transcript,
      result: {
        id: tc.id,
        description: tc.description,
        passed: false,
        turns: transcript.length,
        userKey,
        error: String(e?.message ?? e),
        criteria: [],
        summary: "Test afbrudt pga. fejl",
        transcript,
      },
    }
  }
}

async function runCase(tc: TestCase, host: string, retentionDays: number = 0): Promise<TestResult> {
  const userKey = generateUserKey()
  const transcript: Turn[] = []

  try {
    const consent = await chatPost(host, userKey, null, { type: "CONSENT_RESPONSE", retentionDays })
    let currentState = consent.state

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
  const retentionDays = req.query.retain === "1" ? 7 : 0

  // ── Chunked mode: ?id=tc-xx&chunk=1&fromTurn=0&userKey=xxx&transcript=[] ──
  if (req.query.chunk === "1" && typeof req.query.id === "string") {
    const tc = ALL_TEST_CASES.find((c) => c.id === req.query.id)
    if (!tc) return res.status(404).json({ error: `Test case '${req.query.id}' ikke fundet` })

    const fromTurn = parseInt(String(req.query.fromTurn ?? "0"), 10)
    const chunkSize = parseInt(String(req.query.chunkSize ?? "4"), 10)
    const userKey = typeof req.query.userKey === "string" && req.query.userKey
      ? req.query.userKey
      : generateUserKey()

    let prevTranscript: Turn[] = []
    try {
      prevTranscript = JSON.parse(String(req.query.transcript ?? "[]"))
    } catch {}

    const chunkResult = await runChunk(tc, host, fromTurn, prevTranscript, userKey, chunkSize, retentionDays)
    return res.status(200).json(chunkResult)
  }

  // ── Normal mode ────────────────────────────────────────────────────────────
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
    const result = await runCase(tc, host, retentionDays)
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
