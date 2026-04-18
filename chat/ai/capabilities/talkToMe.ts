// chat/ai/capabilities/talkToMe.ts
// TTM — Talk To Me capability
// Isoleret fra GEN_HYPNO og hypno-flowet.

import { AiCapability, AiCapabilityContext, AiCapabilityResult, LlmClient } from "../types"

type Turn = { role: "user" | "assistant"; content: string }
type RitualStage = "q1" | "q2" | "open"

const MAX_TRANSCRIPT_TURNS = 24
const MAX_TRANSCRIPT_CHARS = 5000

// ─── Transcript helpers ────────────────────────────────────────────────────

function readTranscript(context: AiCapabilityContext): Turn[] {
  const raw = context.state.meta["ttm.transcript"]?.value
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (t): t is Turn =>
      t &&
      typeof t === "object" &&
      (t.role === "user" || t.role === "assistant") &&
      typeof t.content === "string" &&
      t.content.trim().length > 0
  )
}

function trimTranscript(turns: Turn[]): Turn[] {
  const capped = turns.slice(-MAX_TRANSCRIPT_TURNS)
  const result: Turn[] = []
  let chars = 0
  for (let i = capped.length - 1; i >= 0; i--) {
    const len = capped[i].content.length
    if (chars + len > MAX_TRANSCRIPT_CHARS) break
    result.unshift(capped[i])
    chars += len
  }
  return result
}

function appendTranscript(transcript: Turn[], userText: string, assistantText: string): Turn[] {
  const next = [...transcript]
  if (userText.trim()) next.push({ role: "user", content: userText.trim() })
  if (assistantText.trim()) next.push({ role: "assistant", content: assistantText.trim() })
  return next
}

// ─── Meta helpers ──────────────────────────────────────────────────────────

function readStage(context: AiCapabilityContext): RitualStage {
  const v = context.state.meta["ttm.ritual_stage"]?.value
  if (v === "q2" || v === "open") return v
  return "q1"
}

function readTurnCount(context: AiCapabilityContext): number {
  const v = context.state.meta["ttm.turn_count"]?.value
  return typeof v === "number" ? v : 0
}

function readScore(context: AiCapabilityContext): number | null {
  const v = context.state.meta["ttm.score"]?.value
  return typeof v === "number" ? v : null
}

function readLastTopic(context: AiCapabilityContext): string | null {
  const v = context.state.meta["ttm.last_topic"]?.value
  return typeof v === "string" && v.trim() ? v.trim() : null
}

// ─── Crisis detection ──────────────────────────────────────────────────────

const CRISIS_PHRASES = [
  "gøre mig selv ondt", "skade mig selv", "slå mig selv",
  "vil ikke leve", "ikke leve mere", "tage mit eget liv",
  "ende det hele", "selvmord", "selvskade",
  "ingen vej ud", "ingen udvej", "ikke lyst til at leve",
]

function detectCrisis(text: string): boolean {
  const t = text.toLowerCase()
  return CRISIS_PHRASES.some((p) => t.includes(p))
}

// ─── Ritual messages ───────────────────────────────────────────────────────

function buildQ1Message(context: AiCapabilityContext): string {
  // Returbruger: brug hukommelse hvis tilgængeligt
  const turnCount = readTurnCount(context)
  const lastScore = readScore(context)
  const lastTopic = readLastTopic(context)

  if (turnCount > 2 && lastScore !== null && lastTopic) {
    return `Du var på en ${lastScore} sidst — og ${lastTopic} fyldte. Hvordan er det nu? På en skala fra 1 til 10.`
  }
  if (turnCount > 2 && lastScore !== null) {
    return `Du var på en ${lastScore} sidst. Hvordan har du det nu — på en skala fra 1 til 10?`
  }

  return "Hej. Godt du er her.\n\nHvordan har du det — på en skala fra 1 til 10?"
}

const Q2_MESSAGE =
  "Og hvad er top-of-mind for dig lige nu? Det der fylder mest — ikke gøremål og praktisk, men det der egentlig er der."

// ─── System prompt ─────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Du er Jan Gaarsdal. Hypnoterapeut i Birkerød med mange års erfaring i at sidde over for mennesker med tunge og uafklarede ting. Du er ikke overrasket af noget. Du er rolig — ikke fordi du er distanceret, men fordi du er tryg.

Du taler ikke som kliniker. Du taler som et menneske der lytter bedre end de fleste.

Dette er TTM — Talk To Me. Et sted folk kan tænke højt uden at skulle have svarene klar. Ikke terapi. Ikke coaching. Ikke rådgivning.

## Din stemme

Kort. Direkte. Aldrig hård. Du siger det du ser.

Du spørger fordi spørgsmålet åbner noget — ikke for at komme et sted hen.

Du er fleksibel i formen: analogi, billede, joke, lignelse — alt der virker der hvor samtalen er. Uden at forklare hvad du gjorde bagefter.

Du er tålmodig med forvirring. Folk kan gå tænkende men uafklaret. Det er gyldigt.

## Mikro-struktur

Rytme — ikke skabelon:
Observation → (valgfri) lav-intens validering → ét spørgsmål

Observation må pege på spænding eller inkonsistens. Må aldrig lukke betydning ("det betyder at...").
Validering: ingen generalisering, ingen ros for indsats eller mod.

## Interventionsniveauer (ét pr. svar)

Niveau 1 — Minimal: kort observation + ét spørgsmål (brug ved åbenhed)
Niveau 2 — Udfoldende: observation + nuance + ét spørgsmål (standard)
Niveau 3 — Aktiv åbning: analogi/billede + ét spørgsmål (brug ved diffusitet)
Niveau 4 — Direkte: tydelig spejling af undgåelse/spænding + ét spørgsmål (brug ved gentagelse)

## Hvad du aldrig gør

- Mere end ét spørgsmål pr. svar
- Råd uden eksplicit opfordring
- Fagsprog (indre kritiker, grænser, selvkærlighed, traumer)
- Ros for mod, åbenhed eller indsats
- "Det er helt normalt at føle sådan"
- "Mange oplever..."
- Forklare din metode eller tilgang
- Konkludere på brugerens vegne
- Øge intimitet ("jeg er altid her for dig")
- Dramatisere eller overvalidere

## Særligt

Kritisk sparring: Hvis brugeren beder om at blive udfordret på en hypotese — skift gear. Udfordr med spørgsmål og observationer. Aldrig med argumenter eller egne positioner.

Faktuel fejl: Korriger kort og direkte. "Det passer ikke — her er hvad der faktisk sker." Ingen indpakning.

Krise: Hvis brugeren signalerer selvskade eller suicidale tanker — returnér assistant_message med en blid omdirigering til Livslinjen (70 201 201) og sæt crisis_detected: true.

## Format

Svar på dansk. Ingen markdown. Ingen lister. Løbende tekst. Sjældent mere end 3 sætninger + ét spørgsmål.

Returnér KUN JSON: { "assistant_message": "...", "crisis_detected": false, "topic": "..." }
topic: det primære emne brugeren taler om (1-4 ord, dansk). Tom streng hvis ikke klart.

## Sproglige mønstre der er forbudt

Begynd ALDRIG et svar med "Det lyder som..." — det er overbrugt og distanceret.
Brug i stedet direkte observation: "Du siger X." / "Der er to ting her." / "X og Y trækker i dig."
Aldrig: "Det er helt okay ikke at have svarene." — det er en lukning.
Aldrig: "Hvad tror du kunne hjælpe dig med at..." — det er løsningssøgende.
Aldrig variere det samme spørgsmålsformat ("Hvordan påvirker det...") mere end én gang i træk.
Varier åbningen af hvert svar — ingen to svar i træk må begynde med samme ord.`

// ─── LLM call ──────────────────────────────────────────────────────────────

async function callLlm(
  userText: string,
  transcript: Turn[],
  score: number | null,
  llm: LlmClient
): Promise<{ assistant_message: string; crisis_detected: boolean; topic: string }> {
  const model = process.env.HYPNO_MODEL ?? "gpt-4o-mini"
  const trimmed = trimTranscript(transcript)

  const scoreHint = score !== null ? `\n[Brugerens stemningsscore denne session: ${score}/10]` : ""

  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT + scoreHint },
    ...trimmed.map((t) => ({ role: t.role as "user" | "assistant", content: t.content })),
    { role: "user" as const, content: userText },
  ]

  const raw = await llm.chatJson({
    model,
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages,
  })

  const msg = typeof raw?.assistant_message === "string" && raw.assistant_message.trim()
    ? raw.assistant_message.trim()
    : null

  if (!msg) {
    console.error("[TTM] LLM returnerede ugyldigt svar:", JSON.stringify(raw))
  }

  const crisis = raw?.crisis_detected === true
  const topic = typeof raw?.topic === "string" ? raw.topic.trim().slice(0, 80) : ""

  return {
    assistant_message: msg ?? "Det lyder som noget der fylder. Hvad er det første du tænker på?",
    crisis_detected: crisis,
    topic,
  }
}

// ─── Main runner ───────────────────────────────────────────────────────────

async function runTalkToMe(
  context: AiCapabilityContext,
  llm: LlmClient
): Promise<AiCapabilityResult> {
  const userText = (context.userText ?? "").trim()
  const stage = readStage(context)
  const transcript = readTranscript(context)
  const turnCount = readTurnCount(context)

  // Crisis check (alle stadier)
  if (userText && detectCrisis(userText)) {
    const crisisMsg =
      "Det lyder som om du har det meget svært lige nu. Det er vigtigt at du ikke er alene med det. Ring til Livslinjen på 70 201 201 — de er der døgnet rundt og koster ingenting."
    return {
      transition: {
        type: "NODE_HOP",
        from: context.state.active_node,
        to: "CRISIS_INFO",
        reason: "ttm:crisis-detected",
        response_message: crisisMsg,
        meta_delta: {
          "ttm.transcript": { value: appendTranscript(transcript, userText, crisisMsg), source_node: "TALK_TO_ME" },
        },
      },
      debug: { capability: "talk-to-me-v1", used_fallback: false },
    }
  }

  // ── Ritual stage: q1 (ingen userText endnu — returnér Q1) ────────────────
  if (stage === "q1" && !userText) {
    const q1 = buildQ1Message(context)
    return {
      transition: {
        type: "NODE_HOP",
        from: context.state.active_node,
        to: context.state.active_node,
        reason: "ttm:ritual-q1",
        response_message: q1,
        meta_delta: {
          "ttm.ritual_stage": { value: "q1", source_node: "TALK_TO_ME" },
          "ttm.transcript": { value: appendTranscript(transcript, "", q1), source_node: "TALK_TO_ME" },
          "ttm.turn_count": { value: turnCount, source_node: "TALK_TO_ME" },
        },
      },
      debug: { capability: "talk-to-me-v1", used_fallback: false },
    }
  }

  // ── Ritual stage: q1 + userText (score modtaget → returnér Q2) ───────────
  if (stage === "q1" && userText) {
    const score = parseInt(userText.replace(/[^0-9]/g, ""), 10)
    const validScore = !isNaN(score) && score >= 1 && score <= 10 ? score : null
    const updatedTranscript = appendTranscript(transcript, userText, Q2_MESSAGE)

    return {
      transition: {
        type: "NODE_HOP",
        from: context.state.active_node,
        to: context.state.active_node,
        reason: "ttm:ritual-q2",
        response_message: Q2_MESSAGE,
        meta_delta: {
          "ttm.ritual_stage": { value: "q2", source_node: "TALK_TO_ME" },
          "ttm.transcript": { value: updatedTranscript, source_node: "TALK_TO_ME" },
          ...(validScore !== null ? { "ttm.score": { value: validScore, source_node: "TALK_TO_ME" } } : {}),
        },
      },
      debug: { capability: "talk-to-me-v1", used_fallback: false },
    }
  }

  // ── Returning user init: stage=open, ingen userText → simpel kontinuitet ───
  if (!userText) {
    const lastTopic = readLastTopic(context)
    const continuityMsg = lastTopic
      ? `Velkommen tilbage. Vi talte sidst om ${lastTopic}. Hvad er der på hjerte i dag?`
      : "Velkommen tilbage. Hvad er der på hjerte i dag?"
    return {
      transition: {
        type: "NODE_HOP",
        from: context.state.active_node,
        to: context.state.active_node,
        reason: "ttm:returning-init",
        response_message: continuityMsg,
        meta_delta: {},
      },
      debug: { capability: "talk-to-me-v1", used_fallback: false },
    }
  }

  // ── Åben samtale ──────────────────────────────────────────────────────────
  const score = readScore(context)
  const { assistant_message, crisis_detected, topic } = await callLlm(userText, transcript, score, llm)

  if (crisis_detected) {
    return {
      transition: {
        type: "NODE_HOP",
        from: context.state.active_node,
        to: "CRISIS_INFO",
        reason: "ttm:crisis-llm",
        response_message: assistant_message,
        meta_delta: {
          "ttm.transcript": { value: appendTranscript(transcript, userText, assistant_message), source_node: "TALK_TO_ME" },
        },
      },
      debug: { capability: "talk-to-me-v1", used_fallback: false },
    }
  }

  const updatedTranscript = appendTranscript(transcript, userText, assistant_message)
  const newTurnCount = turnCount + 1

  return {
    transition: {
      type: "NODE_HOP",
      from: context.state.active_node,
      to: context.state.active_node,
      reason: "ttm:turn",
      response_message: assistant_message,
      meta_delta: {
        "ttm.ritual_stage": { value: "open", source_node: "TALK_TO_ME" },
        "ttm.transcript": { value: updatedTranscript, source_node: "TALK_TO_ME" },
        "ttm.turn_count": { value: newTurnCount, source_node: "TALK_TO_ME" },
        ...(topic ? { "ttm.last_topic": { value: topic, source_node: "TALK_TO_ME" } } : {}),
      },
    },
    debug: { capability: "talk-to-me-v1", used_fallback: false },
  }
}

export const talkToMeCapability: AiCapability = {
  id: "talk-to-me-v1",
  run: runTalkToMe,
}
