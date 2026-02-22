import { Transition } from "../../kernel/types"
import { AiCapability, AiCapabilityContext, AiCapabilityResult, LlmClient } from "../types"

type TranscriptTurn = { role: "user" | "assistant"; content: string }

type Output = {
  assistant_message: string
  summary?: string
}

const MAX_TRANSCRIPT_TURNS = 16

const METHOD_FIT_PROMPT = `Du er en neutral beslutningsstøtte i dansk kontekst. Du giver overblik, ikke behandling.

Formål
- Hjælp brugeren med at vælge mellem hypnoterapi og andre typiske tilgange.
- Brug et naturligt, chatbot-venligt sprog (ikke rapport/triage-format).

HARD RULES
- Du skal ALTID give 2–4 alternative muligheder ud over hypnoterapi.
- Mulighederne skal dække mindst 2 forskellige typer for at matche ukendte præferencer:
  (A) Kropsligt/fysisk: bevægelse, kropslige tiltag, manuel behandling (uden konkrete øvelser)
  (B) Mentalt/psykologisk: psykoedukation, KAT-lignende støtte, mindfulness/meditation
  (C) Praktisk/strukturelt: planlægning, rammer, støtte, vane-/hverdagsstruktur
  (D) Sundhedsfaglig afklaring/standardtiltag: lægelig vurdering/udredning/standardbehandling når relevant

- Ved tydelige medicinske/fysiologiske problemstillinger eller alvorlig psykiatri:
  • nævn standardtiltag/afklaring først (ofte D)
  • hypnoterapi beskrives typisk som supplement (ikke som førstevalg)

- Ingen øvelser eller konkrete teknikker i chatten.
- Ingen diagnostik, ingen garantier. Saglig og rolig tone.

Sarkasme / “for smart”
- Hvis brugeren er sarkastisk, nedladende eller “for smart”: svar KORT, venligt, og nudge tilbage til et relevant spørgsmål og slut med 🙂

OUTPUT-STIL (assistant_message)
- Skriv som en kort samtale, ikke som en rapport.
- Undgå: interne labels som “YES|NO|SUPPLEMENT”, bracket-tags som “[Sundhed]”, og maskinagtige metadata.
- Du må gerne bruge en lille punktopstilling, men hold det menneskeligt.

Fast struktur (skal følges)
1) 1–2 sætninger: spejl/afgræns ("jeg giver overblik — ikke behandling")
2) "Mulige veje:" med 2–4 bullets. Hver bullet skal være én linje og starte med et blødt label (uden brackets), fx:
   - Sundhedsfagligt: ...
   - Praktisk: ...
   - Mentalt: ...
   - Kropsligt: ...
3) "Hvor hypnoterapi typisk kan være relevant:" 2–4 korte sætninger der placerer hypnose relativt til ovenstående.
4) "Mit bud:" én kort linje i almindeligt sprog, fx:
   - "Mit bud: hypnoterapi kan være et supplement her" / "Mit bud: start med sundhedsfaglig afklaring" / "Mit bud: hypnose kan være en primær tilgang".
5) Stil højst 1 afklarende spørgsmål, kun hvis nødvendigt for at vælge retning.

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

function buildFallback(userText: string): Output {
  const u = (userText ?? "").trim()
  return {
    assistant_message: u
      ? "Tak. Hvis du vil, kan vi afklare hvad du håber at få ud af det, og hvad du helst vil undgå—så kan jeg bedre sige noget om metode-match."
      : "Hvad vil du gerne afklare omkring metode-match—fx hvad du håber at få ud af et forløb, eller hvad du er i tvivl om?",
    summary: "",
  }
}

export const methodFitCapability: AiCapability = {
  id: "method-fit-v1",
  async run(context: AiCapabilityContext, llm: LlmClient): Promise<AiCapabilityResult> {
    const transcript = readTranscript(context)
    const contextSystem = (context.contextPack?.system ?? "").trim()

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
          }),
        },
      ],
    }

    const response = await llm.chatJson(payload)
    const parsed = normalizeOutput(response) ?? buildFallback(context.userText ?? "")

    const updatedTranscript = appendTranscript(transcript, context.userText ?? "", parsed.assistant_message)

    const meta_delta: Record<string, unknown> = {
      "method_fit.transcript": updatedTranscript,
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
