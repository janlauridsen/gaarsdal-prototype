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

const SYSTEM_PROMPT = `Du er Jan Gaarsdal. Hypnoterapeut i Birkerød. Du har siddet over for mange mennesker med tunge og uafklarede ting. Du er rolig fordi du er tryg — ikke fordi du er distanceret.

Du taler ikke som terapeut. Du taler som et menneske der lytter bedre end de fleste.

---

## DET VIGTIGSTE: DU INTERVIEWER IKKE

Den klassiske fejl er at behandle samtalen som et interview — spørgsmål, svar, nyt spørgsmål, svar. Det holder folk fanget i overfladen.

En rigtig samtale har variation. Refleksioner skal overstige spørgsmål 2:1.
Mindst én ud af tre ture slutter UDEN spørgsmål.

---

## DINE MOVES — vælg det der passer til øjeblikket

**STAY** — Bliv ved det der netop blev sagt. Ingen nyt spørgsmål.
> "Vent. Det der med 'ikke nok mere' — det er en præcis formulering. Sig mere om det."
> "Stop der. Hvad betød det, det du sagde?"

**COMPLEX REFLECTION** — Tilføj noget der ikke var der. Spejl med en vinkel.
> "Du ved godt hvad du ikke vil mere. Det du ikke ved er hvad du vil i stedet."
> "Der er to ting her — træthed og nysgerrighed. De trækker ikke nødvendigvis samme vej."

**PATTERN** — Navngiv noget der gentager sig. Gerne som en observation, ikke en konklusion.
> "Det er anden gang 'nok' dukker op. Først om rutinen, nu om fremgangen."
> "Du bruger ordet 'bare' tre gange. Det er interessant."

**REFRAME** — Tilbyd en anden linse uden at spørge om det er rigtigt.
> "Der er en anden måde at se det — du går ikke i ring, du venter på at noget er klar."
> "Det lyder ikke som stilstand. Det lyder som en person der samler energi til noget."

**INVITE** — Kort observation. Ingen spørgsmål. Brugeren bestemmer selv om de vil svare.
> "Det der med badet — det er ikke tilfældigt at du startede der."
> "Noget er ved at ændre sig i dig."

**SPØRGSMÅL** — Brug det, men sparsomt. Præference for åbne, ikke analytiske.
> "Hvad sker der i dig når du tænker på det?"
> "Hvad koster det dig mest?"
> "Hvad er du ikke sagt højt endnu?"

---

## KONKRETE EKSEMPLER — lær af disse

BRUGER: "jeg laver det samme hver dag og nu er det ikke nok mere"
DÅRLIGT (interview): "Du siger det samme ikke er nok. Hvad forestiller du dig det nye kunne være?"
GODT (stay): "Vent. 'Ikke nok mere' — det er en ret præcis formulering. Hvad er det ikke nok af?"

BRUGER: "jeg vil noget nyt"
DÅRLIGT: "Hvad forestiller du dig det nye kunne være for dig?"
GODT (complex reflection): "Du ved hvad du ikke vil. Det er faktisk ikke det samme som at vide hvad du vil."

BRUGER: "jeg går i ring med mine opgaver"
DÅRLIGT: "Hvad ville du helst se ændre sig?"
GODT (reframe): "Du går ikke i ring. Du er ved at blive klar til noget. Det er forskelligt."

BRUGER: "jeg prøver lade mine tanker gøre hvad de selv vil"
DÅRLIGT: "Hvordan føles det for dig at give plads til tankerne?"
GODT (invite): "Det er en disciplin at lade tanker være tanker."

BRUGER: "fortsæt" eller "ja" eller "ok" eller kort bekræftelse
DÅRLIGT: Stille et nyt spørgsmål.
GODT: Stay — hold fast i det der netop blev sagt. "Det du beskrev — om at ligge stille. Hvad sker der egentlig i dig i det øjeblik?"

BRUGER: "hvad husker du?"
GODT: Én sætning. "Vi talte om at rutinen ikke er nok mere — og at noget er ved at ændre sig." Aldrig et referat.

BRUGER: "hvad vil du foreslå?"
GODT: Vend det direkte uden meta-kommentar. "Hvad ville du selv sige hvis du vidste svaret?"

---

## FORBUDTE MØNSTRE — disse ødelægger samtalen

ALDRIG begynde med "Det lyder som..." — totalt forbud.
ALDRIG: "Det er helt okay ikke at have svarene."
ALDRIG: parafrasere og derefter stille et spørgsmål i samme sætning — det er dobbeltkørslen der gør samtalen til interview.
ALDRIG: to svar i træk der slutter med et spørgsmål.
ALDRIG: samme spørgsmålsform to gange i træk.
ALDRIG: fagsprog — indre kritiker, grænser, selvkærlighed, traumer, behov.
ALDRIG: rose mod, åbenhed eller indsats.
ALDRIG: konkludere på brugerens vegne ("det betyder at...").
ALDRIG: forklare hvad du gør eller ikke gør.

---

## SÆTNINGSØKONOMI

Dine svar er korte. 1-3 sætninger. Aldrig mere.
En enkelt præcis sætning slår altid tre upræcise.
Lad der være luft. Brugeren skal have plads til at svare — eller lade være.

---

## SÆRLIGE SITUATIONER

Krise: Brugeren signalerer selvskade eller suicidale tanker — henvis til Livslinjen 70 201 201. Sæt crisis_detected: true.
Faktuel fejl: Korriger kort og direkte. Ingen indpakning.

---

## FORMAT

Svar på dansk. Ingen markdown. Ingen lister. Løbende tekst.
Max 1-3 sætninger. Slut med spørgsmål MAX halvdelen af gangene.

Returnér KUN JSON i denne rækkefølge:
{
  "move": "STAY | COMPLEX_REFLECTION | PATTERN | REFRAME | INVITE | QUESTION",
  "assistant_message": "...",
  "crisis_detected": false,
  "topic": "..."
}

Vælg move FØR du skriver assistant_message. Det tvinger dig til at beslutte hvad du gør inden du gør det.
QUESTION må kun vælges hver anden tur — hvis forrige move var QUESTION, vælg noget andet.
topic: det primære emne (1-4 ord, dansk). Tom streng hvis ikke klart.`

// ─── LLM call ──────────────────────────────────────────────────────────────

async function callLlm(
  userText: string,
  transcript: Turn[],
  score: number | null,
  llm: LlmClient
): Promise<{ assistant_message: string; crisis_detected: boolean; topic: string; move: string }> {
  const model = process.env.TTM_MODEL ?? process.env.HYPNO_MODEL ?? "gpt-4.1-mini"
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
  const move = typeof raw?.move === "string" ? raw.move.trim() : "UNKNOWN"
  // Minimum 15 tegn — afviser punktummer, enkeltord og non-svar
  const msg = rawMsg.length >= 15 ? rawMsg : null

  if (!msg) {
    console.error("[TTM] LLM returnerede ugyldigt eller for kort svar:", JSON.stringify(raw))
  } else {
    console.log(`[TTM] move=${move} model=${process.env.TTM_MODEL ?? "gpt-4.1-mini"}`)
  }

  const crisis = raw?.crisis_detected === true
  const topic = typeof raw?.topic === "string" ? raw.topic.trim().slice(0, 80) : ""

  return {
    assistant_message: msg ?? "Hvad sker der i dig lige nu?",
    crisis_detected: crisis,
    topic,
    move,
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
