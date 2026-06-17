// chat/jobs/handlers/evaluateSession.ts
//
// Session-behavior evaluering: kører asynkront efter hvert FREE_TEXT turn.
// Klassificerer mønstre der spænder over flere ture — fjendtlighed mod Jan,
// engagement-niveau, troværdighedssignaler — og gemmer et directive der
// injiceres i system-prompten på efterfølgende ture.
//
// Adskilt fra `anticipate_turn` (som forudsiger næste træk) — dette job
// evaluerer SESSIONEN SÅ FAR, ikke fremtiden.
//
// Output gemmes under `gaarsdal:session:behavior:{conversation_id}` —
// separat fra conversation state for ikke at blæse state op, og synligt
// for admin-siden uafhængigt af chat-flowet.

import { createOpenAiCompatibleClient } from "../../ai/provider"
import { jobsTtlSeconds } from "../store"
import { JobRecordV1 } from "../types"
import type { EvaluateSessionPayload, SessionBehaviorV1 } from "../types"
import { nowMs } from "../../utils/time"

const CURSORS = ["INIT", "CLASSIFY", "DONE"] as const
type Cursor = typeof CURSORS[number]

function sessionBehaviorKey(conversationId: string): string {
  return `gaarsdal:session:behavior:${conversationId}`
}

type ClassifyResult = {
  hostile_pattern: boolean
  hostile_signals: string[]
  engagement_level: "high" | "medium" | "low" | "disengaging"
  trust_indicators: string[]
  recommended_stance: "neutral" | "firm" | "warm" | "disengage"
  directive: string | null
}

async function llmClassifySession(params: {
  transcript: string
  chatbotType: "standard" | "children" | "alcohol"
}): Promise<ClassifyResult | null> {
  const llm = createOpenAiCompatibleClient()
  const model = process.env.HYPNO_MODEL ?? "gpt-4.1-mini"

  const domainNote =
    params.chatbotType === "children"
      ? "Dette er en børne-chatbot — forældre eller unge (8-18 år) skriver om børn og Jans hypnoterapi-praksis."
      : params.chatbotType === "alcohol"
      ? "Dette er en alkohol-chatbot — brugere skriver om alkoholvaner."
      : "Dette er en generel hypnoterapi-chatbot."

  const system =
    "Du evaluerer en samtales SAMLEDE mønster — ikke kun seneste besked.\n\n" +
    domainNote +
    "\n\n" +
    "Vurder følgende ud fra HELE samtaleforløbet:\n\n" +
    "1. hostile_pattern: Har brugeren udvist vedvarende fjendtlighed, personangreb eller diskrimination " +
    "mod Jan, terapeuten eller hypnoterapi som fag — over flere ture, ikke kun én bemærkning?\n\n" +
    "2. hostile_signals: Konkrete eksempler på fjendtlige udsagn (korte citater eller paraphraser).\n\n" +
    "3. engagement_level: 'high' (uddyber, svarer reflekteret), 'medium' (svarer men kort), " +
    "'low' (minimale svar, lidt interesse), 'disengaging' (svarer modvilligt eller virker på vej ud).\n\n" +
    "4. trust_indicators: Tegn på skepsis, test-adfærd ('jeg tester bare botten'), eller genuin interesse.\n\n" +
    "5. recommended_stance: Hvordan assistenten bør forholde sig i NÆSTE svar:\n" +
    "   - 'neutral': normal tilgang, ingen særlig justering\n" +
    "   - 'firm': brugeren tester grænser — vær kort og afvisende på personangreb, undgå at engagere dig\n" +
    "   - 'warm': brugeren er åben/sårbar — prioriter varme over effektivitet\n" +
    "   - 'disengage': samtalen er fastlåst i fjendtlighed — afslut kortfattat uden at optrappe\n\n" +
    "6. directive: HVIS recommended_stance er 'firm' eller 'disengage' — skriv EN kort sætning " +
    "der instruerer assistenten konkret (fx 'Brugeren har angrebet Jan personligt to gange — " +
    "afvis yderligere personspørgsmål kortfattet uden at stille opfølgende spørgsmål'). " +
    "Ellers null.\n\n" +
    "Returner KUN JSON: { \"hostile_pattern\": boolean, \"hostile_signals\": string[], " +
    "\"engagement_level\": string, \"trust_indicators\": string[], " +
    "\"recommended_stance\": string, \"directive\": string | null }"

  const user = `Samtaleforløb:\n${params.transcript}`

  try {
    const raw = await llm.chatJson({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    })

    const r = raw as any
    if (typeof r?.hostile_pattern !== "boolean") return null

    return {
      hostile_pattern: r.hostile_pattern,
      hostile_signals: Array.isArray(r.hostile_signals) ? r.hostile_signals.filter((x: unknown) => typeof x === "string").slice(0, 5) : [],
      engagement_level: ["high", "medium", "low", "disengaging"].includes(r.engagement_level) ? r.engagement_level : "medium",
      trust_indicators: Array.isArray(r.trust_indicators) ? r.trust_indicators.filter((x: unknown) => typeof x === "string").slice(0, 5) : [],
      recommended_stance: ["neutral", "firm", "warm", "disengage"].includes(r.recommended_stance) ? r.recommended_stance : "neutral",
      directive: typeof r.directive === "string" && r.directive.trim() ? r.directive.trim() : null,
    }
  } catch {
    return null
  }
}

export async function tickEvaluateSession(job: JobRecordV1): Promise<{ job: JobRecordV1; completed: boolean }> {
  const cursor = (job.cursor as Cursor) ?? "INIT"
  const payload = job.payload as EvaluateSessionPayload
  const ts = nowMs()
  const ttl = jobsTtlSeconds()

  if (cursor === "INIT") {
    return {
      job: { ...job, cursor: "CLASSIFY", progress: 0.2, status: "running", updated_at: ts },
      completed: false,
    }
  }

  if (cursor === "CLASSIFY") {
    const result = await llmClassifySession({
      transcript: payload.transcript_excerpt,
      chatbotType: payload.chatbot_type,
    })

    if (!result) {
      return {
        job: { ...job, cursor: "DONE", status: "failed", last_error: "llm_classify_failed", progress: 1, updated_at: ts },
        completed: true,
      }
    }

    try {
      const { getRedisClient } = await import("../../persistence/redis")
      const client = getRedisClient()
      if (client) {
        const behavior: SessionBehaviorV1 = {
          schema_version: "v1",
          conversation_id: job.conversation_id,
          hostile_pattern: result.hostile_pattern,
          hostile_signals: result.hostile_signals,
          engagement_level: result.engagement_level,
          trust_indicators: result.trust_indicators,
          recommended_stance: result.recommended_stance,
          directive: result.directive,
          based_on_revision: job.based_on_revision,
          updated_at: ts,
        }
        await client.set(sessionBehaviorKey(job.conversation_id), JSON.stringify(behavior), { ex: ttl })
      }
    } catch {
      // Non-fatal — admin-visning og prompt-injektion er best-effort
    }

    return {
      job: { ...job, cursor: "DONE", status: "completed", progress: 1, updated_at: ts },
      completed: true,
    }
  }

  return { job: { ...job, status: "completed", progress: 1, updated_at: ts }, completed: true }
}
