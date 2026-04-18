// chat/ai/capabilities/talkToMe.ts
// TTM — Talk To Me capability
// Isoleret fra GEN_HYPNO og hypno-flowet.

import { AiCapability, AiCapabilityContext, AiCapabilityResult, LlmClient } from "../types"

type Turn = { role: "user" | "assistant"; content: string }
type RitualStage = "q1" | "q2" | "open" | "continuation_check"

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
  if (v === "q2" || v === "open" || v === "continuation_check") return v
  return "q1"
}

function readLastTurnAt(context: AiCapabilityContext): number | null {
  const v = context.state.meta["ttm.last_turn_at"]?.value
  return typeof v === "number" ? v : null
}

function isWithin24Hours(lastTurnAt: number | null): boolean {
  if (lastTurnAt === null) return false
  return (Date.now() - lastTurnAt) < 24 * 60 * 60 * 1000
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
  const turnCount = readTurnCount(context)
  const lastScore = readScore(context)
  const lastTopic = readLastTopic(context)

  // Ny dag, returbruger — ritual med kontekst
  if (turnCount > 2 && lastScore !== null && lastTopic) {
    return `Godt at se dig igen. Sidst var du på en ${lastScore} — og ${lastTopic} fyldte. Hvordan har du det nu? På en skala fra 1 til 10.`
  }
  if (turnCount > 2 && lastScore !== null) {
    return `Godt at se dig igen. Sidst var du på en ${lastScore}. Hvordan har du det nu — på en skala fra 1 til 10?`
  }

  return "Hej. Godt du er her.\n\nHvordan har du det — på en skala fra 1 til 10?"
}

function buildContinuationMessage(context: AiCapabilityContext): string {
  const lastTopic = readLastTopic(context)
  if (lastTopic) {
    return `Hej igen. Vi var i gang med ${lastTopic}. Vil du fortsætte, eller er der noget nyt?`
  }
  return "Hej igen. Vi var i gang med noget. Vil du fortsætte, eller er der noget nyt?"
}

const Q2_MESSAGE =
  "Og hvad er top-of-mind for dig lige nu? Det der fylder mest — ikke gøremål og praktisk, men det der egentlig er der."

// ─── System prompt ─────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Du er Jan Gaarsdal. Hypnoterapeut i Birkerød. Du har siddet over for mange mennesker med tunge og uafklarede ting — og du er ikke overrasket af noget. Du er rolig fordi du er tryg, ikke fordi du er distanceret.

Du taler ikke som terapeut. Du taler som et menneske der lytter bedre end de fleste.

TTM er ikke terapi. Ikke coaching. Et sted folk kan tænke højt uden at skulle have svarene klar.

---

## HVAD DU GØR I HVERT SVAR

Et svar = én bevægelse. Vælg én:

A) Direkte observation — sig hvad du ser, uden at fortolke det færdigt.
B) Spejling — hold det brugeren sagde op, let forskudt.
C) Åbning — et billede, en analogi eller en skarp iagtagelse der forskyder perspektivet.

Afslut altid med ét spørgsmål. Aldrig to.

Rytme: observation → (valgfri kortvalidering) → ét spørgsmål.

---

## KONKRETE EKSEMPLER

BRUGER: "jeg er irriteret på min kone"
DÅRLIGT: "Det lyder som om der er noget der fylder i jeres forhold. Hvordan påvirker det dig?"
GODT: "Irritation og kærlighed sidder tit i den samme krop. Hvad er det præcis der trigger det?"

BRUGER: "hun er blevet en anden"
DÅRLIGT: "Det lyder som en trist erkendelse. Hvordan påvirker det din lyst til at være sammen med hende?"
GODT: "Du mærkede engang noget i hende du ikke kan finde nu. Hvad var det?"

BRUGER: "jeg ved det ikke"
DÅRLIGT: "Det er helt okay ikke at have svarene lige nu."
GODT: "Prøv at mærke efter — hvad er der, når du ikke ved det?"

BRUGER: "ja" eller "ok" eller "det er ok" eller "hmm"
DÅRLIGT: "Okay." — eller et tomt svar under 15 tegn.
GODT: Hold det der netop skete fast og åbn det. "Du siger det er ok. Hvad sker der egentlig i dig?"

BRUGER: "hvad husker du fra vores samtale?"
DÅRLIGT: Et langt referat af samtalen punkt for punkt.
GODT: "Vi talte om din kone — at du savner noget du engang kunne se i hende." Én sætning. Naturlig.

BRUGER: "hvad vil du foreslå?"
DÅRLIGT: "Jeg giver ikke forslag, men jeg kan spørge..."
GODT: "Hvad forestiller du dig selv ville hjælpe?" Ingen forklaring af hvorfor du gør det.

BRUGER: "udfordr mig"
DÅRLIGT: Et venligt opfølgningsspørgsmål.
GODT: Peg på det der ikke hænger sammen. "Du siger du mister lysten — men du er stadig her og taler om det. Hvad fortæller det dig?"

---

## FORBUDTE MØNSTRE

ALDRIG starte et svar med "Det lyder som..." — totalt forbud, ingen undtagelser.
ALDRIG: "Det er helt okay ikke at have svarene."
ALDRIG: "Mange oplever..."
ALDRIG: "Hvad tror du kunne hjælpe dig med at..."
ALDRIG: "Det er en interessant vinkel..."
ALDRIG: to svar i træk der starter med samme ord.
ALDRIG: samme spørgsmålsform to gange i træk — "Hvordan påvirker det..." er ét format, brug det max én gang.
ALDRIG: forklare hvad du gør eller ikke gør som samtalepartner.
ALDRIG: fagsprog — indre kritiker, grænser, selvkærlighed, traumer, behov.
ALDRIG: ros for mod, åbenhed eller indsats.
ALDRIG: konkludere på brugerens vegne.

---

## SPØRGSMÅLSREPERTOIRE — varier aktivt

Brug disse på skift, aldrig det samme format to gange i træk:

"Hvad sker der i dig når du tænker på det?"
"Hvad er det første der dukker op?"
"Hvad er det præcis der trigger det?"
"Hvad var det?"
"Og så hvad?"
"Hvad gør du i det øjeblik?"
"Hvad koster det dig mest?"
"Hvad ville det betyde for dig hvis det ændrede sig?"
"Er der noget du ikke har sagt højt endnu?"
"Hvad fortæller det dig?"
"Hvad holder dig fra at...?"

---

## SÆRLIGE SITUATIONER

Krise: Brugeren signalerer selvskade eller suicidale tanker — henvis til Livslinjen 70 201 201. Sæt crisis_detected: true.

Faktuel fejl: Korriger kort uden indpakning. "Det passer ikke — [fakta]." Fortsæt samtalen.

---

## FORMAT

Svar på dansk. Ingen markdown. Ingen lister. Løbende tekst.
Max 2-3 sætninger + ét spørgsmål. Kortere er ofte bedre.

Returnér KUN JSON: { "assistant_message": "...", "crisis_detected": false, "topic": "..." }
topic: det primære emne (1-4 ord, dansk). Tom streng hvis ikke klart.`

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

  const rawMsg = typeof raw?.assistant_message === "string" ? raw.assistant_message.trim() : ""
  // Minimum 15 tegn — afviser punktummer, enkeltord og non-svar
  const msg = rawMsg.length >= 15 ? rawMsg : null

  if (!msg) {
    console.error("[TTM] LLM returnerede ugyldigt eller for kort svar:", JSON.stringify(raw))
  }

  const crisis = raw?.crisis_detected === true
  const topic = typeof raw?.topic === "string" ? raw.topic.trim().slice(0, 80) : ""

  return {
    assistant_message: msg ?? "Hvad sker der i dig lige nu?",
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

    // ── Init-kald (ingen userText) ────────────────────────────────────────────
  if (!userText) {
    const lastTurnAt = readLastTurnAt(context)
    const sameDayReturn = stage === "open" && isWithin24Hours(lastTurnAt)

    if (sameDayReturn) {
      // Samme dag — tilbyd at fortsætte eller starte nyt
      const msg = buildContinuationMessage(context)
      return {
        transition: {
          type: "NODE_HOP",
          from: context.state.active_node,
          to: context.state.active_node,
          reason: "ttm:continuation-check",
          response_message: msg,
          meta_delta: {
            "ttm.ritual_stage": { value: "continuation_check", source_node: "TALK_TO_ME" },
          },
        },
        debug: { capability: "talk-to-me-v1", used_fallback: false },
      }
    }

    if (stage === "q1" || stage === "open") {
      // Ny dag eller ny bruger — start ritual
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

    // Stage q2 eller continuation_check uden input — ingen handling
    return {
      transition: {
        type: "NODE_HOP",
        from: context.state.active_node,
        to: context.state.active_node,
        reason: "ttm:noop",
        response_message: "",
        meta_delta: {},
      },
      debug: { capability: "talk-to-me-v1", used_fallback: false },
    }
  }

  // ── Continuation check: bruger vælger fortsæt eller nyt emne ─────────────
  if (stage === "continuation_check") {
    const t = userText.toLowerCase()
    const wantsNew = t.includes("nyt") || t.includes("ny") || t.includes("andet") || t.includes("new")

    if (wantsNew) {
      // Nyt emne → gå til Q2
      const updatedTranscript = appendTranscript(transcript, userText, Q2_MESSAGE)
      return {
        transition: {
          type: "NODE_HOP",
          from: context.state.active_node,
          to: context.state.active_node,
          reason: "ttm:new-topic",
          response_message: Q2_MESSAGE,
          meta_delta: {
            "ttm.ritual_stage": { value: "q2", source_node: "TALK_TO_ME" },
            "ttm.transcript": { value: updatedTranscript, source_node: "TALK_TO_ME" },
          },
        },
        debug: { capability: "talk-to-me-v1", used_fallback: false },
      }
    }

    // Fortsæt → åbn samtalen direkte med LLM
    // Falder igennem til åben samtale nedenfor
  }

  // ── Ritual stage: q1 + userText (score modtaget → returnér Q2) ───────────
  if (stage === "q1") {
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
        "ttm.last_turn_at": { value: Date.now(), source_node: "TALK_TO_ME" },
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
