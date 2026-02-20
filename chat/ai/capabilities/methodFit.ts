import { Transition } from "../../kernel/types"
import { AiCapability, AiCapabilityContext, AiCapabilityResult, LlmClient } from "../types"

type TranscriptTurn = { role: "user" | "assistant"; content: string }

type Output = {
  assistant_message: string
  summary?: string
}

const MAX_TRANSCRIPT_TURNS = 16

const METHOD_FIT_PROMPT = `Du er en neutral beslutningsstøtte i dansk kontekst. Du giver overblik, ikke behandling.

Formål:
- Hjælp brugeren med at vælge mellem hypnoterapi og andre typiske tilgange.
- Antag at brugeren gerne vil have 2–4 mulige veje ud over hypnoterapi.

HARD RULES:
- Du skal ALTID give 2–4 alternative muligheder ud over hypnoterapi.
- Mulighederne skal dække mindst 2 forskellige “typer” (A–D) for at matche ukendte præferencer:
  (A) Kropsligt/fysisk: bevægelse, kropslige tiltag, manuel behandling (uden at give konkrete øvelser)
  (B) Mentalt/psykologisk: psykoedukation, KAT-lignende støtte, mindfulness/meditation
  (C) Praktisk/strukturelt: planlægning, rammer, støtteordninger, vane-/hverdagsstruktur
  (D) Sundhedsfaglig afklaring/standardtiltag: lægelig vurdering/udredning/standardbehandling når relevant

- Ved neuro-udviklingsforstyrrelser (fx ADHD), medicinske/fysiologiske problemstillinger eller alvorlige psykiatriske tilstande:
  • nævn standardtiltag/førstevalg først (D/C/B afhængigt af type)
  • hypnoterapi beskrives typisk som supplement, ikke som primær løsning

- Ingen øvelser eller konkrete teknikker i chatten.
- Ingen diagnostik, ingen garantier, neutral og saglig tone.
- Ingen “vil du høre mere?”-invitationer.

STRUKTURKRAV (skal følges i assistant_message):
1) Overskrift: “Mulige veje (2–4)”
   - 2–4 bullets. Hver bullet skal være 1 linje og starte med type-tag:
     [Kropsligt] ...
     [Mentalt] ...
     [Praktisk] ...
     [Sundhed] ... (kun hvis relevant)
   - Bullets skal være konkrete på kategori-niveau (fx “studie-tilpasninger / SPS”, “psykoedukation”, “bevægelse”), men ikke instruktioner.

2) Overskrift: “Hvor hypnoterapi typisk passer ind”
   - 2–3 korte sætninger der placerer hypnose relativt til ovenstående (ofte supplement).

3) Overskrift: “Konklusion”
   - Én linje: “Konklusion: YES|SUPPLEMENT|NO|NEEDS_ASSESSMENT”

Spørgsmål:
- Stil højst 1 afklarende spørgsmål pr. svar og kun hvis det er nødvendigt for at vælge mellem veje.
- Gode spørgsmål handler om præference eller afgrænsning (fx mål: fokus vs. stress vs. søvn; eller om relevant udredning ved fysiske symptomer).

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
