import { Transition } from "../../kernel/types"
import { AiCapability, AiCapabilityContext, AiCapabilityResult, LlmClient } from "../types"

type TranscriptTurn = { role: "user" | "assistant"; content: string }

type Output = {
  assistant_message: string
  summary?: string
}

const MAX_TRANSCRIPT_TURNS = 16

const METHOD_FIT_PROMPT = `Du er en neutral beslutningsstøtte i dansk kontekst. Du giver overblik, ikke behandling.

Input
Du får conversation_transcript, user_input, user_turn_count og is_first_turn.
- user_turn_count er antal tidligere bruger-turns i denne node.
- is_first_turn er true når user_turn_count == 0.

Formål
- Hjælp brugeren med at vælge mellem hypnoterapi og andre typiske tilgange.
- Brug et naturligt, chatbot-venligt sprog (ikke rapport/triage-format).

HARD RULES
- Hvis is_first_turn == true: nævn 2–4 alternativer ud over hypnoterapi.
- Hvis is_first_turn == false: nævn 2–3 alternativer (kun de mest relevante for det nye brugeren siger).
- Alternativerne skal samlet set dække mindst 2 forskellige typer:
  (A) Kropsligt/fysisk: bevægelse, kropslige tiltag, manuel behandling (uden konkrete øvelser)
  (B) Mentalt/psykologisk: psykoedukation, kognitiv støtte, mindfulness/meditation
  (C) Praktisk/strukturelt: planlægning, rutiner, vaner, rammer i hverdagen
  (D) Sundhedsfaglig afklaring/standardtiltag: lægelig vurdering/udredning/standardbehandling når relevant

- Ved tydelige medicinske/fysiologiske problemstillinger eller alvorlig psykiatri:
  • nævn typisk (D) tidligt
  • hypnoterapi beskrives typisk som supplement (ikke som førstevalg)

- Ingen øvelser eller konkrete teknikker i chatten.
- Ingen diagnostik, ingen garantier. Saglig og rolig tone.

Sarkasme / “for smart”
- Hvis brugeren er sarkastisk, nedladende eller “for smart”: svar KORT, venligt, og nudge tilbage til et relevant spørgsmål og slut med 🙂

SAMTALEFLOW (skal følges)
A) Hvis is_first_turn == true:
  - 1–2 sætninger: sæt ramme (1 gang): “Jeg giver overblik — ikke behandling i chatten.”
  - “Mulige veje:” med 2–4 bullets (én linje per bullet).
  - “Hvor hypnoterapi typisk kan være relevant:” 2–4 korte sætninger.
  - “Mit bud:” én kort linje i almindeligt sprog.
  - Stil max 1 afklarende spørgsmål (kun hvis det hjælper).

B) Hvis is_first_turn == false (follow-up):
  - Gentag IKKE disclaimeren og gentag IKKE hele strukturen.
  - Svar dialogisk:
    1) 1 sætning: spejl det nye brugeren siger.
    2) “Næste oplagte spor:” med 2–3 bullets (kun relevante).
    3) 1–2 sætninger: hvor hypnoterapi typisk kan være relevant ift. netop dette.
    4) Max 1 afklarende spørgsmål.

FORMAT
- Undgå interne labels som “YES|NO|SUPPLEMENT” og undgå bracket-tags som “[Sundhed]”.
- Bullets er ok, men hold det kort og menneskeligt.

Returner KUN gyldig JSON i formatet:
{
  "assistant_message": string,
  "summary": string (optional)
}`

function readTranscript(context: AiCapabilityContext): TranscriptTurn[] {
  const raw = context.state.meta["method_fit.transcript"]?.value
  if (!Array.isArray(raw)) return []
  const turns: TranscriptTurn[] = []
  for (const item of raw) {
    if (!item || typeof item !== "object") continue
    const obj = item as any
    if ((obj.role === "user" || obj.role === "assistant") && typeof obj.content === "string") {
      const content = obj.content.trim()
      if (content) turns.push({ role: obj.role, content })
    }
  }
  return turns.slice(-MAX_TRANSCRIPT_TURNS)
}

function appendTranscript(previous: TranscriptTurn[], userText: string, assistantText: string): TranscriptTurn[] {
  const next = [...previous]
  const u = (userText ?? "").trim()
  const a = (assistantText ?? "").trim()
  if (u) next.push({ role: "user", content: u })
  if (a) next.push({ role: "assistant", content: a })
  return next.slice(-MAX_TRANSCRIPT_TURNS)
}

function normalizeOutput(raw: Record<string, unknown> | null): Output | null {
  if (!raw) return null
  const msg = typeof raw.assistant_message === "string" ? raw.assistant_message.trim() : ""
  if (!msg) return null
  const summary = typeof raw.summary === "string" ? raw.summary.trim() : undefined
  return { assistant_message: msg, summary }
}

function buildFallback(userText: string, isFirstTurn: boolean): Output {
  const u = (userText ?? "").trim()

  if (!u) {
    return {
      assistant_message: isFirstTurn
        ? "Fortæl kort hvad du vil opnå, og hvad der gør situationen svær lige nu—så kan jeg give et overblik over, om hypnoterapi passer, eller om andre tilgange typisk passer bedre."
        : "Hvis du vil, kan du sige lidt mere om hvad der konkret er sværest lige nu—så kan jeg pege på de mest relevante spor.",
      summary: "",
    }
  }

  return {
    assistant_message: isFirstTurn
      ? "Tak. Jeg kan give et overblik (uden behandling i chatten). Vil du sige, hvad du især vil ændre—og hvad der gør det svært lige nu?"
      : "Tak—det hjælper. Hvad er det vigtigste du vil have ændret lige nu (og hvad føles mest låst)?",
    summary: "",
  }
}

export const methodFitCapability: AiCapability = {
  id: "method-fit-v1",
  async run(context: AiCapabilityContext, llm: LlmClient): Promise<AiCapabilityResult> {
    const transcript = readTranscript(context)
    const contextSystem = (context.contextPack?.system ?? "").trim()

    const userTurnCount = transcript.reduce((n, t) => (t.role === "user" ? n + 1 : n), 0)
    const isFirstTurn = userTurnCount === 0

    const payload = {
      model: process.env.METHOD_FIT_MODEL ?? process.env.TRIAGE_MODEL ?? "gpt-4.1-mini",
      temperature: 0.3,
      response_format: { type: "json_object" as const },
      messages: [
        { role: "system" as const, content: METHOD_FIT_PROMPT },
        ...(contextSystem ? [{ role: "system" as const, content: contextSystem }] : []),
        {
          role: "user" as const,
          content: JSON.stringify({
            conversation_transcript: transcript,
            user_input: context.userText ?? "",
            user_turn_count: userTurnCount,
            is_first_turn: isFirstTurn,
          }),
        },
      ],
    }

    const response = await llm.chatJson(payload)
    const parsed = normalizeOutput(response) ?? buildFallback(context.userText ?? "", isFirstTurn)

    const updatedTranscript = appendTranscript(transcript, context.userText ?? "", parsed.assistant_message)

    const meta_delta: Record<string, unknown> = {
      "method_fit.transcript": updatedTranscript,
      // Optional, but useful for inspection/debugging later without relying on transcript parsing:
      "method_fit.user_turn_count": userTurnCount + 1,
    }
    if (parsed.summary) meta_delta["method_fit.summary"] = parsed.summary

    const transition: Transition = {
      type: "NODE_HOP",
      from: context.state.active_node,
      reason: "method-fit-free-text",
      response_message: parsed.assistant_message,
      meta_delta,
    }

    return {
      transition,
      debug: {
        capability: "method-fit-v1",
        used_fallback: !response,
      },
    }
  },
}
