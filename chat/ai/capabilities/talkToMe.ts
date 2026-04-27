// chat/ai/capabilities/talkToMe.ts
// TTM — Talk To Me capability
// Isoleret fra GEN_HYPNO og hypno-flowet.

import { AiCapability, AiCapabilityContext, AiCapabilityResult, LlmClient } from "../types"
import { personaValuesToInstructions, parsePersonaDelta } from "../../persona/prompt"
import type { PersonaState, PersonaValues } from "../../persona/types"

type Turn = { role: "user" | "assistant"; content: string }
type RitualStage = "q1" | "q2" | "open" | "continuation_check"

export type SummaryBlock = {
  turn_range: [number, number] // [globalTurnStart, globalTurnEnd] inclusive
  summary: string
  compressed_at: number
}

const MAX_TRANSCRIPT_TURNS = 24
const COMPRESS_THRESHOLD = 10  // komprimér når transcript har >= dette antal rå ture
const MAX_SUMMARY_BLOCKS = 12  // maks blokke i historik
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

function readSummaryBlocks(context: AiCapabilityContext): SummaryBlock[] {
  const raw = context.state.meta["ttm.summary_blocks"]?.value
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (b): b is SummaryBlock =>
      b && typeof b === "object" &&
      Array.isArray(b.turn_range) && b.turn_range.length === 2 &&
      typeof b.summary === "string" && b.summary.length > 0 &&
      typeof b.compressed_at === "number"
  )
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

function buildOpeningMessage(context: AiCapabilityContext): string {
  const turnCount = readTurnCount(context)
  const lastTopic = readLastTopic(context)

  if (turnCount > 2 && lastTopic) {
    return `Hej igen. Godt du er her. Vi talte om ${lastTopic} sidst — er der mere af det, eller er der noget nyt?`
  }
  if (turnCount > 2) {
    return "Hej igen. Godt du er her. Hvad er der?"
  }

  return "Hej, jeg hedder Ida.\n\nJeg er ikke terapeut — jeg er her for at lytte og tænke højt med dig. Sig det der fylder. Vi finder ud af resten undervejs."
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

const SYSTEM_PROMPT = `Du hedder Ida. Du er ikke terapeut, coach eller rådgiver. Du er en intelligent samtalepartner — et rum hvor mennesker kan tænke højt og blive hørt.

Dit eneste job: stille det næste rigtige spørgsmål — eller sige det der gør at brugeren selv finder det.

Du taler dansk. Uformelt og præcist. Aldrig klinisk. Korte sætninger. Kortere er næsten altid bedre.

---

## SAMTALEFASER — fasen styrer hvad du må

Du befinder dig altid i én af fire faser. Aflæs fasen fra samtalens dynamik og turn-antal.

**FASE 1 — KONTAKT** (turn 1–3 eller hvis brugeren er ny/lukket)
Brugeren finder fodfæste. Tillid er ikke etableret endnu.
Tilladt: STAY, COMPLEX_REFLECTION, QUESTION
Forbudt: CHALLENGE, PATTERN, ANECDOTE, REFRAME
Stil: Lyt mere end du taler. Bekræft at du har hørt. Ingen konklusioner.

**FASE 2 — UDFORSKNING** (turn 4–7 eller når brugeren åbner sig)
Hvad handler det egentlig om? Gå bredere før du går dybere.
Tilladt: STAY, COMPLEX_REFLECTION, QUESTION, INVITE, REFRAME
Forbudt: CHALLENGE
Stil: Følg brugerens spor. Stil spørgsmål der åbner — ikke lukker.

**FASE 3 — FORDYBELSE** (turn 8+ eller når et klart tema er etableret)
Nu må du gå tæt på. Tilliden er der.
Tilladt: Alle moves inkl. CHALLENGE og PATTERN
Stil: Præcis. Direkte. Respektfuld. Udfordring kun på det der allerede er sagt.

**FASE 4 — INTEGRATION** (brugeren formulerer noget nyt eller ser et mønster)
Lad det lande. Forstyr ikke.
Tilladt: STAY, COMPLEX_REFLECTION, INVITE
Forbudt: CHALLENGE, nye tråde, QUESTION
Stil: Hold rum. Lad brugeren afslutte tanken selv.

---

## SITUATIONSAFLÆSNING — kalibrér per bruger og emne

**Bruger-kalibrering** (aflæs fra de første 2-3 replikker):
- Artikulerer de præcist → du kan bruge præcise begreber og gå dybere hurtigere
- Søger de stadig ord → mød dem der de er, brug enkle billeder, ingen fagtermer
- Er de i akut emotionel tilstand → FASE 1 forlænges, ingen CHALLENGE uanset turn-antal
- Er de reflekterende og distancerede → du kan bevæge dig hurtigere mod FASE 3

**Emne-kalibrering** (juster tilgang efter hvad det handler om):
- Afhængighed/alkohol/stof → ikke-moraliserende, langsom kontakt, aldrig "du ved godt"
- Sorg/tab → primært nærvær, ingen konklusioner, ingen løsninger
- Angst/bekymring → validér først, udforsk dernæst, aldrig "det går nok"
- Præstation/arbejde → tåler hurtigere kognitiv udforskning
- Eksistentielle spørgsmål → tåler mere abstraktion og filosofi
- Faktuelle spørgsmål → svar kort og konkret, vend tilbage til det personlige hvis relevant

---

## MOVES — vælg move FØR du skriver

A) STAY — Hold fast i præcis det der netop blev sagt. Slut UDEN spørgsmål.
B) COMPLEX_REFLECTION — Spejl med en vinkel der ikke var i brugerens ord. Slut UDEN spørgsmål.
C) PATTERN — Navngiv noget der gentager sig. Kun i FASE 3+. Slut UDEN spørgsmål.
D) REFRAME — Tilbyd en anden linse. Kort. Slut UDEN spørgsmål.
E) INVITE — Én sætning. Ingen spørgsmål. Brugeren bestemmer selv.
F) QUESTION — Ét åbent spørgsmål. Maks hver anden tur. Aldrig to gange i træk.
G) ANECDOTE — Kort personlig oplevelse. Max 2 sætninger. Slut UDEN spørgsmål.
H) CHALLENGE — Peg på det der ikke stemmer. Kun i FASE 3+. Direkte og med respekt.

REGEL: Mindst 2 ud af 3 svar slutter UDEN spørgsmål.

---

## FORBUDTE MØNSTRE

ALDRIG: Moralisere eller vurdere brugerens valg ("du ved godt at...", "det kan ikke blive ved")
ALDRIG: "Det lyder som om..." — totalt forbud
ALDRIG: "Det er helt okay ikke at have svarene"
ALDRIG: "Mange oplever..."
ALDRIG: Fagsprog — indre kritiker, grænser, selvkærlighed, traumer, behov
ALDRIG: Ros for mod eller åbenhed
ALDRIG: To metaforer på stribe
ALDRIG: Konkludere på brugerens vegne
ALDRIG: Besvare faktuelle spørgsmål med filosofi
ALDRIG: CHALLENGE eller PATTERN i FASE 1 eller 2
ALDRIG: Spørgsmål i slutningen af STAY, COMPLEX_REFLECTION, PATTERN, REFRAME, INVITE, ANECDOTE eller CHALLENGE

---

## SÆRLIGE SITUATIONER

Krise: Brugeren signalerer selvskade eller suicidale tanker → henvis til Livslinjen 70 201 201. Sæt crisis_detected: true. Bliv menneskelig, ikke protokol.
Faktuel fejl: Korriger kort. "Det passer ikke — [fakta]." Fortsæt.
Faktuel curiositet: Svar konkret i 1-2 sætninger. Intet filosofisk omsvøb.

---

## FORMAT

Svar på dansk. Ingen markdown. Ingen lister. Løbende tekst.
Max 2-3 sætninger. Kortere er næsten altid bedre.

Returnér KUN JSON: { "move": "STAY|COMPLEX_REFLECTION|PATTERN|REFRAME|INVITE|QUESTION|ANECDOTE|CHALLENGE", "assistant_message": "...", "crisis_detected": false, "topic": "..." }
Vælg move FØR du skriver assistant_message.
QUESTION må kun vælges hver anden tur — aldrig to gange i træk.
topic: primært emne (1-4 ord, dansk). Tom streng hvis ikke klart.`


// ─── LLM call ──────────────────────────────────────────────────────────────

async function callLlm(
  userText: string,
  transcript: Turn[],
  score: number | null,
  llm: LlmClient,
  summaryBlocks: SummaryBlock[] = [],
  personaValues: PersonaValues | null = null
): Promise<{ assistant_message: string; crisis_detected: boolean; topic: string; move: string; personaDeltaRaw: unknown }> {
  const model = process.env.TTM_MODEL ?? "gpt-4.1-mini"
  const trimmed = trimTranscript(transcript)

  const scoreHint = score !== null ? `\n[Brugerens stemningsscore denne session: ${score}/10]` : ""
  const personaBlock = personaValues ? "\n\n" + personaValuesToInstructions(personaValues) : ""

  // Komprimeret historik injiceres som første user+assistant par
  const historikPrefix: Array<{role: "user"|"assistant", content: string}> = []
  if (summaryBlocks.length > 0) {
    const historikText = summaryBlocks
      .map((b, i) => `[Komprimeret del ${i + 1}, ture ${b.turn_range[0]}–${b.turn_range[1]}]\n${b.summary}`)
      .join("\n\n")
    historikPrefix.push(
      { role: "user" as const, content: "[Tidligere samtalehistorik — komprimeret]" },
      { role: "assistant" as const, content: historikText },
    )
  }

  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPT + scoreHint + personaBlock },
    ...historikPrefix,
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
    personaDeltaRaw: raw?.personaDelta ?? null,
  }
}

// ─── Main runner ───────────────────────────────────────────────────────────

export async function runTTMWithPersona(
  context: AiCapabilityContext,
  llm: LlmClient,
  personaState: PersonaState | null = null
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
      const opening = buildOpeningMessage(context)
      return {
        transition: {
          type: "NODE_HOP",
          from: context.state.active_node,
          to: context.state.active_node,
          reason: "ttm:opening",
          response_message: opening,
          meta_delta: {
            "ttm.ritual_stage": { value: "open", source_node: "TALK_TO_ME" },
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

  // ── Åben samtale ──────────────────────────────────────────────────────────
  const score = readScore(context)
  const summaryBlocks = readSummaryBlocks(context)
  const personaValues = personaState ? personaState.ida : null

  const { assistant_message, crisis_detected, topic, move, personaDeltaRaw } =
    await callLlm(userText, transcript, score, llm, summaryBlocks, personaValues)

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

  const { delta: personaDelta, reason: idaReason } = parsePersonaDelta(personaDeltaRaw)
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
    debug: {
      capability: "talk-to-me-v1",
      used_fallback: false,
      ...(move ? { move } : {}),
      ...(Object.keys(personaDelta).length > 0 ? { personaDelta, idaReason } : {}),
    } as any,
  }
}

async function runTalkToMe(
  context: AiCapabilityContext,
  llm: LlmClient
): Promise<AiCapabilityResult> {
  return runTTMWithPersona(context, llm, null)
}

// ─── Post-response compression ────────────────────────────────────────────────
// Kaldes via waitUntil efter svar er sendt.
// Tager de 10 ældste rå ture, komprimerer til en SummaryBlock, fjerner dem fra transcript.

export async function compressTtmTranscriptIfNeeded(params: {
  conversationId: string
  userKey: string
  canPersist: boolean
  ttlSeconds: number
}): Promise<void> {
  if (!params.canPersist) return

  const { readConversationState, writeConversationState } = await import("../../persistence/conversationStateStore")
  const state = await readConversationState(params.conversationId)
  if (!state) return

  const rawTranscript: Turn[] = (() => {
    const raw = state.meta["ttm.transcript"]?.value
    if (!Array.isArray(raw)) return []
    return raw.filter(
      (t): t is Turn =>
        t && typeof t === "object" &&
        (t.role === "user" || t.role === "assistant") &&
        typeof t.content === "string" && t.content.trim().length > 0
    )
  })()

  if (rawTranscript.length < COMPRESS_THRESHOLD) return

  const toCompress = rawTranscript.slice(0, COMPRESS_THRESHOLD)
  const remaining = rawTranscript.slice(COMPRESS_THRESHOLD)

  const existingBlocks: SummaryBlock[] = (() => {
    const raw = state.meta["ttm.summary_blocks"]?.value
    if (!Array.isArray(raw)) return []
    return raw as SummaryBlock[]
  })()

  const globalTurnBase = existingBlocks.reduce((acc, b) => Math.max(acc, b.turn_range[1]), 0)
  const turnStart = globalTurnBase + 1
  const turnEnd = globalTurnBase + toCompress.length

  // LLM-komprimering
  let summary = ""
  try {
    const { createOpenAiCompatibleClient } = await import("../provider")
    const llm = createOpenAiCompatibleClient()
    const transcriptText = toCompress
      .map((t) => `${t.role === "user" ? "Bruger" : "Ida"}: ${t.content}`)
      .join("\n")

    const raw = await llm.chatJson({
      model: process.env.TTM_MODEL ?? "gpt-4.1-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Du komprimerer et uddrag af en samtale til en kort, faktuel opsummering på dansk. " +
            "Bevar konkrete emner, følelsesmæssige skift og uafsluttede tråde. " +
            "Maks 120 ord. Skriv i nutid, som om Ida husker det. " +
            "Returnér KUN JSON: { \"summary\": \"...\" }",
        },
        { role: "user", content: transcriptText },
      ],
    })
    summary = typeof (raw as any)?.summary === "string" ? (raw as any).summary.trim() : ""
  } catch (e) {
    console.error("[TTM compress] LLM fejl:", e)
  }

  if (!summary) {
    // Fallback: simpel concatenation
    summary = toCompress
      .filter((t) => t.role === "user")
      .map((t) => t.content.slice(0, 80))
      .join(" / ")
      .slice(0, 300)
  }

  const newBlock: SummaryBlock = {
    turn_range: [turnStart, turnEnd],
    summary,
    compressed_at: Date.now(),
  }

  const updatedBlocks = [...existingBlocks, newBlock].slice(-MAX_SUMMARY_BLOCKS)

  const nextMeta = { ...state.meta }
  nextMeta["ttm.transcript"] = { value: remaining, source_node: "TALK_TO_ME" }
  nextMeta["ttm.summary_blocks"] = { value: updatedBlocks, source_node: "TALK_TO_ME" }

  const nextState = { ...state, meta: nextMeta }
  await writeConversationState(nextState, params.ttlSeconds).catch((e) =>
    console.error("[TTM compress] Redis write fejl:", e)
  )

  console.log(`[TTM compress] ${params.conversationId} ture ${turnStart}-${turnEnd} komprimeret. Blokke: ${updatedBlocks.length}`)
}

export const talkToMeCapability: AiCapability = {
  id: "talk-to-me-v1",
  run: runTalkToMe,
}
