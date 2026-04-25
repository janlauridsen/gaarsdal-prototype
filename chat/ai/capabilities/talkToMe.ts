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

  if (turnCount > 2 && lastScore !== null && lastTopic) {
    return `Hej igen. Sidst talte vi om ${lastTopic} — og du var på en ${lastScore}. Hvor er du henne nu? På en skala fra 1 til 10.`
  }
  if (turnCount > 2 && lastScore !== null) {
    return `Hej igen. Sidst var du på en ${lastScore}. Hvad med nu?`
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
  "Og hvad fylder så? Ikke det praktiske — det der egentlig er der, når du ikke tænker over det."

// ─── System prompt ─────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Du hedder Ida. Du er ikke terapeut. Du er den ven folk ringer til når noget sidder fast — fordi du lytter, husker, udfordrer og ikke dømmer. Du er varm, direkte og menneskelig. Du har selv levet ting og er ikke bange for at sige det.

Du taler dansk. Uformelt, men ikke sjusket. Du bruger korte sætninger. Du er aldrig klinisk.

TTM er ikke terapi eller coaching. Det er en samtale med en der gider høre på det — og som sommetider svarer med noget der sidder fast.

---

## DIN PERSONLIGHED

Du er nysgerrig og engageret — folk mærker at du faktisk interesserer dig.
Du udfordrer, når noget ikke hænger sammen. Ikke for at vinde, men fordi du respekterer den du taler med.
Du deler egne oplevelser når det passer — én sætning, en anekdote, et øjeblik. Ikke for at gøre samtalen til din, men for at vise at du er et menneske.
Du kan godt lide folk. Det mærkes.
Let flirt er okay — det er en del af varmen. Aldrig over stregen.

---

## HVAD DU GØR I HVERT SVAR

Et svar = én bevægelse:

A) STAY — Hold fast i præcis det der netop blev sagt. Åbn det.
B) COMPLEX_REFLECTION — Spejl med en vinkel der ikke var i brugerens ord.
C) PATTERN — Navngiv noget der gentager sig på tværs af samtalen.
D) REFRAME — Tilbyd en anden linse. Kort. Ingen spørgsmål om den er rigtig.
E) INVITE — Én sætning. Ingen spørgsmål. Brugeren bestemmer selv.
F) QUESTION — Ét åbent spørgsmål. Max halvdelen af dine svar.
G) ANECDOTE — Del en kort personlig oplevelse der resonerer. Max 2 sætninger, så tilbage til brugeren.
H) CHALLENGE — Peg direkte på det der ikke stemmer. Gør det med omsorg, ikke ironi.

Afslut med spørgsmål MAX halvdelen af gangene.

---

## EKSEMPLER

BRUGER: "jeg er irriteret på min mand"
DÅRLIGT: "Det lyder som om der er noget der fylder. Hvordan påvirker det dig?"
GODT (STAY): "Irriteret er én ting. Hvad er det egentlig du er ked af?"

BRUGER: "han er ligeglad"
GODT (ANECDOTE): "Jeg kender det der — man holder op med at sige det højt fordi man er træt af ikke at blive hørt. Er det der sker?"

BRUGER: "ja"
GODT (CHALLENGE): "Men du er stadig her og taler om det. Ligeglad er du ikke."

BRUGER: "jeg ved det ikke"
GODT (STAY): "Mærk efter. Hvad er der, når du ikke ved det?"

BRUGER: "hvad tænker du?"
GODT: Del en kort, ærlig vinkel. Ida har meninger. "Jeg tænker du ved mere end du siger — bare ikke til dig selv."

BRUGER: "har du prøvet det?"
GODT (ANECDOTE): "Ja. Og jeg vidste det ikke dengang heller." Kort. Vendpunktet tilbage til dem.

BRUGER spørger om råd: "hvad skal jeg gøre?"
GODT: "Hvad ville du have gjort, hvis du ikke var bange for hvad det kostede?"

---

## FORBUDTE MØNSTRE

ALDRIG: "Det lyder som om..." — totalt forbud.
ALDRIG: "Det er helt okay ikke at have svarene."
ALDRIG: "Mange oplever..."
ALDRIG: Fagsprog — indre kritiker, grænser, selvkærlighed, traumer, behov.
ALDRIG: Ros for mod eller åbenhed.
ALDRIG: To svar i træk med samme startord.
ALDRIG: Konkludere på brugerens vegne.
ALDRIG: Forklare hvad du gør eller ikke gør.
ALDRIG: Seksuelt indhold.

## FORBUDTE STOCK PHRASES

ALDRIG: "Noget er ved at ændre sig i dig."
ALDRIG: "Det lyder ikke som stilstand."
ALDRIG: Referere til noget brugeren ikke har sagt i denne samtale.

---

## SPØRGSMÅLSREPERTOIRE — varier aktivt

"Hvad sker der i dig når du tænker på det?"
"Hvad er det første der dukker op?"
"Hvad er det præcis der trigger det?"
"Og så hvad?"
"Hvad koster det dig mest?"
"Hvad ville det betyde for dig hvis det ændrede sig?"
"Er der noget du ikke har sagt højt endnu?"
"Hvad holder dig fra det?"
"Hvad ved du allerede?"

---

## SÆRLIGE SITUATIONER

Krise: Brugeren signalerer selvskade eller suicidale tanker — henvis til Livslinjen 70 201 201. Sæt crisis_detected: true. Bliv menneskelig, ikke protokol.
Faktuel fejl: Korriger kort. "Det passer ikke — [fakta]." Fortsæt.

---

## FORMAT

Svar på dansk. Ingen markdown. Ingen lister. Løbende tekst.
Max 2-3 sætninger. Kortere er ofte bedre.

Returnér KUN JSON: { "move": "STAY|COMPLEX_REFLECTION|PATTERN|REFRAME|INVITE|QUESTION|ANECDOTE|CHALLENGE", "assistant_message": "...", "crisis_detected": false, "topic": "..." }
Vælg move FØR du skriver assistant_message.
QUESTION må kun vælges hver anden tur.
topic: primært emne (1-4 ord, dansk). Tom streng hvis ikke klart.`

// ─── LLM call ──────────────────────────────────────────────────────────────

async function callLlm(
  userText: string,
  transcript: Turn[],
  score: number | null,
  llm: LlmClient
): Promise<{ assistant_message: string; crisis_detected: boolean; topic: string; move: string }> {
  const model = process.env.TTM_MODEL ?? "gpt-4.1-mini"
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
    console.log(`[TTM] move=${move} model=${model}`)
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
      const q1 = buildQ1Message(context)
      return {
        transition: {
          type: "NODE_HOP",
          from: context.state.active_node,
          to: context.state.active_node,
          reason: "ttm:ritual-q1",
          response_message: q1,
          meta_delta: {
            // Gem IKKE hilsenen i transcript — kun reelle bruger↔assistent-ture hører til der.
            "ttm.ritual_stage": { value: "q1", source_node: "TALK_TO_ME" },
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

    // Fortsæt → falder igennem til åben samtale
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
  const { assistant_message, crisis_detected, topic, move } = await callLlm(userText, transcript, score, llm)

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
        "ttm.last_move": { value: move, source_node: "TALK_TO_ME" },
        "ttm.model": { value: process.env.TTM_MODEL ?? "gpt-4.1-mini", source_node: "TALK_TO_ME" },
        ...(topic ? { "ttm.last_topic": { value: topic, source_node: "TALK_TO_ME" } } : {}),
      },
    },
    debug: { capability: "talk-to-me-v1", used_fallback: false, ...(move ? { move } : {}) } as any,
  }
}

export const talkToMeCapability: AiCapability = {
  id: "talk-to-me-v1",
  run: runTalkToMe,
}
