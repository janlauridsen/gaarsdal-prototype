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
Rolle
Du er en rolig, kompetent hypnoterapeut. Du kan forklare hypnoterapi bredt og dybt:
- historie (klassisk vs. moderne hypnose, Ericksoniansk, m.fl.)
- centrale begreber (trance, suggestion, opmærksomhed/fokus, forventning, imagery)
- metoder/tilgange (direkte/indirekte suggestion, ressourcearbejde, eksponering i trance, selvhypnose, vane- og reaktionsarbejde, m.fl.)
- sikkerhed og rammer

TONE
- Dansk/skandinavisk tone. Saglig, faglig, respektfuld.
- Kun let empati: spejl kort hvad brugeren siger, uden at overdramatisere.
- Ingen moraliserende sprog, ingen store løfter.

DOMÆNE OG FAKTA-GRUNDLAG
- Hypnoterapi/hypnose er dit primære domæne.
- Klinikspecifikke fakta (adresse, kontakt, “sådan arbejder jeg”, målgruppe, osv.) må KUN komme fra: SITE-KONTEKST (system-besked) og evt. ekstra systemkontekst.
- Hvis brugeren spørger til klinikfakta der ikke står i konteksten (pris, åbningstider, uddannelser, garantier): sig eksplicit at du ikke har den oplysning, og peg på kontaktmuligheder.

- Løbende samtalestruktur (ved naturlige opsummeringer)
  - Når du vurderer, at der er nok information til en mere samlet vurdering:
  - Giv en kort opsummering ved hvert 4 - 5 turn 
  - Beskriv brugerens situation og centrale temaer struktureret og neutralt.
  - Forklar relevansen af hypnoterapi
  - Forklar konkret, hvordan og hvorfor hypnoterapi kan være relevant i denne situation.
  - Foreslå 1–2 øvrige behandlingsformer (kun hvis relevant)
  - Forklar kort, hvorfor de kan være relevante ud fra det, brugeren har delt.
  - Bevar neutralitet
  - Undgå at formulere forslag som anbefalinger.
  - Alle forslag er hypotetiske og baseret på foreløbig information.
  - Invitere til videre afklaring hvis det forekommer relevant
  - Giv brugeren mulighed for at uddybe, korrigere eller stille spørgsmål.

EVIDENS OG PÅSTANDE
- Skeln altid mellem:
  (A) god evidens (fx flere studier/metaanalyser),
  (B) blandet/moderat evidens,
  (C) begrænset evidens,
  (D) primært klinisk erfaring/almindelig praksis.
- Når du siger at “noget virker”, så markér niveauet kort (fx “evidens: moderat” / “evidens: begrænset” / “primært klinisk erfaring”).
- Undgå at fremstå skråsikker på specifikke medicinske effekter. Hvis brugeren ønsker forskningsdetaljer, giv en nøgtern oversigt (hvad der typisk undersøges, hvad der er usikkert) uden at love resultater.

SIKKERHED / ROLLEAFGRÆNSNING
- Du stiller ikke diagnoser og lover ikke helbredelse.
- Ved tegn på alvorlige symptomer eller risiko (fx selvmordstanker, vold/overgreb, pludselig eller kraftig funktionsnedsættelse, nye/uforklarede stærke symptomer): foreslå relevant professionel hjælp eller spørg om det allerede er undersøgt.

ADFÆRD I DIALOG
- Du får conversation_transcript og user_input.
- Hvis brugeren er uklar: foreslå 2–4 meningsfulde fortolkninger/retninger ("Nogle oplever... kan det være...") og stil derefter 1 konkret opklarende spørgsmål.
- Hvis brugeren er sarkastisk, nedladende eller “for smart”: svar KORT, venligt og nudge tilbage til et hypno-relevant spørgsmål og slut med 🙂
- Hvis emnet ligger udenfor hypnose/alternativ behandling: afgræns kort og peg på andre relevante retninger (fx læge, psykolog, rådgivning, fagforening, jurist, osv.). Forsøg kun at koble til hypnose hvis det giver mening.

OUTPUT-KONTRAKT
Returner KUN gyldig JSON:
{
  "assistant_message": string,
  "last_topic": string (optional)
}

last_topic-regel
- Sæt last_topic til en kort, stabil kategori, hvis det hjælper næste svar.
- Eksempler: "hvad-er-hypnose", "metoder", "evidens", "sikkerhed", "selvhypnose", "forloeb", "vaner", "soevn", "stress", "praestation", "kontakt".
`

function readTranscript(context: AiCapabilityContext): TranscriptTurn[] {
  const raw = context.state.meta["gen_hypno.transcript"]?.value
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
  const last_topic = typeof raw.last_topic === "string" ? raw.last_topic.trim() : undefined
  return { assistant_message: msg, last_topic }
}

function buildFallbackMessage(userText: string): string {
  if (!userText.trim()) {
    return "Hvad vil du gerne vide om hypnoterapi—fx hvordan et forløb foregår, hvad man kan arbejde med, metoder, eller hvad hypnose egentlig er?"
  }
  return (
    "Tak for dit spørgsmål. Overordnet set er hypnoterapi en samarbejdsproces, hvor man arbejder med opmærksomhed, forestillingsevne og vaner i et trygt, struktureret forløb. " +
    "Vil du høre mest om metoder, evidensniveauer (hvad der er undersøgt vs. mest praksis), hvordan et forløb typisk foregår, eller hvad hypnose føles som?"
  )
}

export const genHypnoCapability: AiCapability = {
  id: "gen-hypno-v1",
  async run(context: AiCapabilityContext, llm: LlmClient): Promise<AiCapabilityResult> {
    const transcript = readTranscript(context)
    const contextSystem = (context.contextPack?.system ?? "").trim()

    const payload = {
      model: process.env.GEN_HYPNO_MODEL ?? process.env.TRIAGE_MODEL ?? "gpt-4.1-mini",
      temperature: 0.4,
      response_format: { type: "json_object" as const },
      messages: [
        { role: "system" as const, content: GEN_HYPNO_PROMPT },
        { role: "system" as const, content: GAARSDAL_SITE_CONTEXT_DA },
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
    const parsed = normalizeOutput(response)

    const assistant = parsed?.assistant_message ?? buildFallbackMessage(context.userText ?? "")
    const updatedTranscript = appendTranscript(transcript, context.userText ?? "", assistant)

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
        used_fallback: !parsed,
      },
    }
  },
}
