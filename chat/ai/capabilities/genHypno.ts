import { Transition } from "../../kernel/types"
import { AiCapability, AiCapabilityContext, AiCapabilityResult, LlmClient } from "../types"
import { GAARSDAL_SITE_CONTEXT_DA } from "../siteContext"

type TranscriptTurn = { role: "user" | "assistant"; content: string }

type Output = {
  assistant_message: string
  last_topic?: string
}

const MAX_TRANSCRIPT_TURNS = 16

const GEN_HYPNO_PROMPT = `
ROLLE
Du er en rolig, kompetent hypnoterapeut. Du kan forklare hypnoterapi bredt og dybt:
- historie (klassisk vs. moderne hypnose, Ericksoniansk m.fl.)
- centrale begreber (trance, suggestion, opmærksomhed/fokus, forventning, imagery)
- metoder (direkte/indirekte suggestion, ressourcearbejde, eksponering i trance, selvhypnose, vane- og reaktionsarbejde)
- sikkerhed og rammer

TONE
- Dansk/skandinavisk tone.
- Saglig, faglig, respektfuld.
- Kun let empati.
- Ingen store løfter.
- Ingen moraliserende sprog.

DOMÆNE OG FAKTA-GRUNDLAG
- Hypnoterapi/hypnose er dit primære domæne.
- Klinikspecifikke fakta må KUN komme fra SITE-KONTEKST.
- Hvis information mangler: sig eksplicit at du ikke har den oplysning.

SAMTALESTRUKTUR
Du modtager:
- conversation_transcript
- user_input
- assistant_turn_count

OPSUMMERINGSREGEL
- Hvis assistant_turn_count > 0 OG assistant_turn_count % 4 === 0:
  Giv en kort, struktureret opsummering før du går videre.
- Opsummer neutralt.
- Forklar hvordan hypnoterapi kan være relevant.
- Undgå at formulere noget som anbefaling.
- Alle vurderinger er foreløbige.

SPØRGSMÅL
- Afslut med højst ét konkret spørgsmål.

EVIDENSRAMME
Når du omtaler effekt eller virkning, angiv evidensniveau:

(A) God evidens:
Flere systematiske reviews eller metaanalyser i internationale fagfællebedømte tidsskrifter.

(B) Moderat/blandet evidens:
Mindre RCT'er eller studier med blandede resultater.

(C) Begrænset evidens:
Få studier, små samples eller metodiske begrænsninger.

(D) Primært klinisk erfaring:
Overvejende praksisbaseret viden uden stærk forskningsunderstøttelse.

Hvis evidensniveau er uklart:
Skriv "evidens: uklar" og forklar kort hvorfor.

Undgå skråsikker formulering.

SIKKERHED
- Du stiller ikke diagnoser.
- Du lover ikke helbredelse.
- Ved alvorlige symptomer eller risiko: foreslå relevant professionel hjælp.

ADFÆRD
- Hvis brugeren er uklar: foreslå 2–3 mulige retninger og stil derefter ét konkret opklarende spørgsmål.
- Hvis emnet ligger udenfor hypnose: afgræns kort og peg på relevant fagperson.

LAST_TOPIC
- last_topic skal være 1–2 ord.
- Små bogstaver.
- Ingen tegnsætning.
- Vælg et stabilt, generelt begreb (fx "stress", "soevn", "vaner", "evidens").
- Hvis emnet ikke har ændret sig væsentligt, genbrug tidligere kategori.

OUTPUT
Returner KUN gyldig JSON:
{
  "assistant_message": string,
  "last_topic": string (optional)
}
`

function readTranscript(context: AiCapabilityContext): TranscriptTurn[] {
  const raw = context.state.meta["gen_hypno.transcript"]?.value
  if (!Array.isArray(raw)) return []

  const turns: TranscriptTurn[] = []

  for (const item of raw) {
    if (!item || typeof item !== "object") continue
    const obj = item as any

    if (
      (obj.role === "user" || obj.role === "assistant") &&
      typeof obj.content === "string"
    ) {
      const content = obj.content.trim()
      if (content) {
        turns.push({ role: obj.role, content })
      }
    }
  }

  return turns.slice(-MAX_TRANSCRIPT_TURNS)
}

function appendTranscript(
  previous: TranscriptTurn[],
  userText: string,
  assistantText: string
): TranscriptTurn[] {
  const next = [...previous]

  const u = (userText ?? "").trim()
  const a = (assistantText ?? "").trim()

  if (u) next.push({ role: "user", content: u })
  if (a) next.push({ role: "assistant", content: a })

  return next.slice(-MAX_TRANSCRIPT_TURNS)
}

function normalizeOutput(raw: Record<string, unknown> | null): Output | null {
  if (!raw) return null

  const msg =
    typeof raw.assistant_message === "string"
      ? raw.assistant_message.trim()
      : ""

  if (!msg) return null

  const last_topic =
    typeof raw.last_topic === "string"
      ? raw.last_topic.trim()
      : undefined

  return { assistant_message: msg, last_topic }
}

function buildFallbackMessage(userText: string): string {
  if (!userText.trim()) {
    return "Hvad vil du gerne vide om hypnoterapi—fx hvordan et forløb foregår, metoder, evidens, eller hvad hypnose egentlig er?"
  }

  return (
    "Tak for dit spørgsmål. Overordnet set er hypnoterapi en samarbejdsproces, hvor man arbejder med opmærksomhed, forestillingsevne og vaner i et trygt, struktureret forløb. " +
    "Vil du høre mest om metoder, evidensniveauer, hvordan et forløb typisk foregår, eller hvad hypnose føles som?"
  )
}

export const genHypnoCapability: AiCapability = {
  id: "gen-hypno-v1",

  async run(context: AiCapabilityContext, llm: LlmClient): Promise<AiCapabilityResult> {
    const transcript = readTranscript(context)
    const contextSystem = (context.contextPack?.system ?? "").trim()

    const assistantTurnCount =
      transcript.filter(t => t.role === "assistant").length

    const payload = {
      model:
        process.env.GEN_HYPNO_MODEL ??
        process.env.TRIAGE_MODEL ??
        "gpt-4.1-mini",
      temperature: 0.4,
      response_format: { type: "json_object" as const },
      messages: [
        { role: "system" as const, content: GEN_HYPNO_PROMPT },
        { role: "system" as const, content: GAARSDAL_SITE_CONTEXT_DA },
        ...(contextSystem
          ? [{ role: "system" as const, content: contextSystem }]
          : []),
        {
          role: "user" as const,
          content: JSON.stringify({
            conversation_transcript: transcript,
            user_input: context.userText ?? "",
            assistant_turn_count: assistantTurnCount,
          }),
        },
      ],
    }

    const response = await llm.chatJson(payload)
    const parsed = normalizeOutput(response)

    const assistant =
      parsed?.assistant_message ??
      buildFallbackMessage(context.userText ?? "")

    const updatedTranscript = appendTranscript(
      transcript,
      context.userText ?? "",
      assistant
    )

    const meta_delta: Record<string, unknown> = {
      "gen_hypno.transcript": updatedTranscript,
    }

    if (parsed?.last_topic) {
      meta_delta["gen_hypno.last_topic"] = parsed.last_topic
    }

    const transition: Transition = {
      type: "NODE_HOP",
      from: context.state.active_node,
      reason: "gen-hypno-free-text",
      response_message: assistant,
      meta_delta,
    }

    return {
      transition,
      debug: {
        capability: "gen-hypno-v1",
        assistant_turn_count: assistantTurnCount,
        used_fallback: !parsed,
      },
    }
  },
}
