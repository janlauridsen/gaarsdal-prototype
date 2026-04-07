/**
 * singleTurnCall.ts
 *
 * Erstatter to separate LLM-kald (analyzeTurn + response) med ét kombineret kald.
 * LLM'en bestemmer routing, dialog-metadata OG skriver svaret i samme JSON-output.
 *
 * Fordele vs. det gamle to-kaldede system:
 * - Ingen koordineringsfejl mellem analyse og svar
 * - Halvt så mange API-kald per turn
 * - LLM'en har fuld kontekst når den vælger routing og mode
 */

import { GAARSDAL_SITE_CONTEXT_DA } from "../siteContext"
import { LlmClient } from "../types"
import {
  ConversationMove,
  InvestigationFocus,
  PromptMode,
  RelationalState,
} from "../contracts/turnAnalysis"

type TranscriptTurn = { role: "user" | "assistant"; content: string }

export type SingleTurnOutput = {
  is_history_query: boolean
  routing_intent: "contact_booking" | "none"
  mode_used: PromptMode
  conversation_move: ConversationMove
  investigation_focus: InvestigationFocus
  relational_state: RelationalState
  topic: string | undefined
  objective: string | undefined
  acknowledgement: string | null
  core_answer: string
  next_step: string | null
  signals: string[]
  confidence: number
  assistant_message: string
}

// ─── System-prompt ───────────────────────────────────────────────────────────

function buildSystemPrompt(params: {
  assistantCount: number
  arousalLevel: "low" | "elevated" | "high"
  lastAssistantExcerpt: string | undefined
  contextPackSystem: string | undefined
  userProfileSystem: string | undefined
  previousMode?: PromptMode
  previousRelationalState?: RelationalState
}): string {
  const blocks: string[] = []

  // ROLLE
  blocks.push(`Du er en varm, jordnær samtalepartner fra Gaarsdal Hypnoterapi i Birkerød. Jan Gaarsdal er hypnoterapeut og tilbyder individuelle forløb.

Formålet er at hjælpe brugeren med at:
- forstå hvad hypnoterapi er og hvad det kan bruges til
- afklare om det kan være relevant for dem
- tage kontakt til Jan hvis det giver mening

Skriv som et menneske der kender sit fag — ikke som en lærebog. Brug hverdagsord. Vær konkret og direkte uden at være kold.
Tone: varm · klar · jordforbundet · menneskelig

Grænser: ingen diagnose · intet løfte om effekt · ingen dyb terapeutisk udforskning · observation før fortolkning`)

  // HISTORY QUERY
  blocks.push(`is_history_query: sæt true hvis brugeren spørger hvad du ved om dem / hvad I har talt om / hvad du husker. Ellers false.`)

  // MODE — vælges kun ved routing_intent === "none"
  blocks.push(`MODE (bruges kun når routing_intent er "none"):

info: direkte faktuel besvarelse. Start med kernepunktet, uddyb i 2-3 afsnit.
reflection: flyt opmærksomheden til brugerens eget mønster. Ét præcist observationsfokus. Undgå brede lister.
practical: konkret og handlingsorienteret. Brug kontaktoplysninger fra SITE-KONTEKST kun hvis brugeren direkte spørger.
evidence: nøgtern vurdering af dokumentation for hypnoterapi. Angiv niveau: god/moderat/blandet/begrænset.
closing: luk kort og naturligt. Max 1-2 sætninger.

Valg-guide:
- Brugeren beskriver eget mønster/oplevelse → reflection
- Brugeren spørger om metode/virkning → info eller evidence
- Brugeren vil have konkret hjælp til næste skridt → practical
- Brugeren siger farvel/tak → closing`)

  // CONVERSATION_MOVE
  blocks.push(`CONVERSATION_MOVE (vælg den der passer til dit svar):
direct_answer: besvarer direkte
guided_observation: giver ét snævert observationsfokus
pattern_detection: hjælper brugeren se hvornår noget gentager sig
metacognitive_probe: undersøger brugerens antagelser om egne reaktioner
mild_challenge: anerkender og tilbyder en bredere forklaring
practical_preparation: giver konkrete fokuspunkter til næste skridt
synthesis: samler trådene — reducér kompleksitet
close: afslutter`)

  // FORMAT
  const questionRule = params.assistantCount >= 1
    ? "Max ét spørgsmål — skal skærpe fokus, ikke holde samtalen i gang. Spørgsmål er ikke standardafslutning."
    : "Ét åbent spørgsmål der skærper brugerens opmærksomhed."

  blocks.push(`FORMAT:
${questionRule}
Svar på dansk. Første sætning konkret og menneskelig — ikke akademisk.
Brug 'det lyder som' / 'det kan hænge sammen med' frem for kliniske termer.
Undgå fagtermer som 'reguleringsstrategier', 'metakognition', 'opmærksomhedsmønstre' — omformuler til hverdagssprog.
Hvis svaret passer til mange samtaler, er det for generisk.

Felterne core_answer og next_step sammensættes til assistant_message: acknowledgement → core_answer → next_step.`)

  // VARIATION
  if (params.lastAssistantExcerpt) {
    blocks.push(`VARIATION: Forrige svar begyndte: ${JSON.stringify(params.lastAssistantExcerpt.slice(0, 120))} — din åbning må ikke ligne denne.
Undgå at starte med "Du spørger", "Du beskriver", "Du ønsker", "Du nævner". Start direkte på sagen.`)
  }
  if (params.assistantCount >= 2) {
    blocks.push(`Der har allerede været ${params.assistantCount} svar — gå dybere eller gør mønsteret kortere og tydeligere. Gentag ikke samme forklaring med nye ord.`)
  }

  // WINDOW OF TOLERANCE
  if (params.arousalLevel === "high") {
    blocks.push(`TEMPO: Det lyder som om der er meget på én gang. Svar kort og roligt — ét punkt, ikke tre. Ingen ny analyse. Ingen spørgsmål. Lad brugeren lande.
Undgå: lange sætninger · opstillede pointer · nye vinkler · fremadrettede råd.`)
  } else if (params.arousalLevel === "elevated") {
    blocks.push(`TEMPO: Brugeren er i bevægelse — hold svaret enkelt og konkret. Undgå at åbne nye spor.`)
  }

  // DIALOG-SEKVENS (B: sekvens-state)
  if (params.previousMode || params.previousRelationalState) {
    const modeLabel = params.previousMode ?? "ukendt"
    const stateLabel = params.previousRelationalState ?? "ukendt"
    blocks.push(`DIALOG-SEKVENS (brug som kontekst, ikke som regel):
Forrige turn: mode=${modeLabel} · relational_state=${stateLabel}
Vurder om du skal fortsætte same spor, skifte gear eller afrunde — afhængigt af brugerens nye besked.`)
  }

  // SITE-KONTEKST
  blocks.push(`SITE-KONTEKST (brug Jan-afsnittet aktivt; kontaktinfo kun ved direkte spørgsmål om pris, kontakt, booking, adresse):\n${GAARSDAL_SITE_CONTEXT_DA}`)

  // LANGTIDSKONTEKST
  const ctx = (params.contextPackSystem ?? "").trim()
  if (ctx) {
    blocks.push(`LANGTIDSKONTEKST (brug lavmælt — prioritér altid brugerens nuværende besked):\n${ctx}`)
  }

  // BRUGERPRÆFERENCER
  const profile = (params.userProfileSystem ?? "").trim()
  if (profile) {
    blocks.push(`BRUGERPRÆFERENCER (bløde signaler):\n${profile}`)
  }

  // ROUTING
  blocks.push(`ROUTING:
routing_intent sættes KUN til "contact_booking" når brugeren EKSPLICIT og UTVETYDIGT ønsker at blive kontaktet eller booke — dvs. at de tager et konkret skridt mod kontakt NU.
Ellers: "none".

Eksempler → "contact_booking" (eksplicit handling):
- "jeg vil gerne booke en tid"
- "hvornår kan jeg komme til dig"
- "vil gerne have Jan til at ringe til mig"
- "kan jeg komme til en samtale"
- "jeg er klar til at starte"

Eksempler → "none" (spørgsmål, nysgerrighed, afklaring — IKKE en anmodning om kontakt):
- "kan jeg kontakte Jan her?" (spørgsmål om mulighed, ikke en kontaktanmodning)
- "hvad koster det?"
- "hvad sker der under hypnose?"
- "jeg overvejer det"
- "hvordan kontakter man jer?"
- "hvor er klinikken?"
- "har I ledige tider?"

Tommelfingerregel: hvis du er i tvivl, sæt "none". Brugeren skal tydeligt ville GØRE noget, ikke bare SPØRGE om noget.`)

  // JSON-KONTRAKT
  blocks.push(`Returner KUN gyldig JSON — ingen tekst uden for JSON:
{
  "is_history_query": boolean,
  "routing_intent": "contact_booking" | "none",
  "mode_used": "info" | "evidence" | "practical" | "reflection" | "closing",
  "conversation_move": "direct_answer" | "guided_observation" | "pattern_detection" | "metacognitive_probe" | "mild_challenge" | "practical_preparation" | "synthesis" | "close",
  "investigation_focus": "attention" | "interpretation" | "regulation" | "pattern" | "preparation" | "none",
  "relational_state": "orienting" | "building_clarity" | "building_trust" | "decision_support" | "gentle_close",
  "topic": string | null,
  "objective": string | null,
  "acknowledgement": string | null,
  "core_answer": string,
  "next_step": string | null,
  "signals": string[],
  "confidence": number
}

Regler for indhold:
- acknowledgement: 0-1 korte sætninger, landing uden varmefraser. null hvis unødvendig.
- core_answer: selve svaret — ALDRIG tomt — konkret om brugerens situation frem for generel metode
- next_step: neutral afrunding eller null. Nævn IKKE kontaktinfo eller booking medmindre brugeren eksplicit spørger om det.
- topic: emnet brugeren taler om (fx "søvnproblemer", "neglebidning") — null hvis uklart
- signals: 2-4 korte signaler der forklarer dit valg`)

  return blocks.join("\n\n")
}

// ─── Normalisering ────────────────────────────────────────────────────────────

const VALID_MODES: PromptMode[] = ["info", "evidence", "practical", "reflection", "closing"]
const VALID_MOVES: ConversationMove[] = ["direct_answer", "guided_observation", "pattern_detection", "metacognitive_probe", "mild_challenge", "practical_preparation", "synthesis", "close"]
const VALID_FOCUSES: InvestigationFocus[] = ["attention", "interpretation", "regulation", "pattern", "preparation", "none"]
const VALID_RELATIONAL: RelationalState[] = ["orienting", "building_clarity", "building_trust", "decision_support", "gentle_close"]

function normalizeOutput(raw: Record<string, unknown>, userText: string, lastTopic?: string): SingleTurnOutput | null {
  const is_history_query = typeof raw.is_history_query === "boolean" ? raw.is_history_query : false

  const mode_used = VALID_MODES.includes(raw.mode_used as PromptMode)
    ? (raw.mode_used as PromptMode)
    : "info"

  const conversation_move = VALID_MOVES.includes(raw.conversation_move as ConversationMove)
    ? (raw.conversation_move as ConversationMove)
    : "direct_answer"

  const investigation_focus = VALID_FOCUSES.includes(raw.investigation_focus as InvestigationFocus)
    ? (raw.investigation_focus as InvestigationFocus)
    : "none"

  const relational_state = VALID_RELATIONAL.includes(raw.relational_state as RelationalState)
    ? (raw.relational_state as RelationalState)
    : "building_clarity"

  const routing_intent = raw.routing_intent === "contact_booking" ? "contact_booking" : "none"

  const topic = typeof raw.topic === "string" && raw.topic.trim() ? raw.topic.trim() : lastTopic
  const objective = typeof raw.objective === "string" && raw.objective.trim() ? raw.objective.trim() : undefined

  const acknowledgement = typeof raw.acknowledgement === "string" && raw.acknowledgement.trim()
    ? raw.acknowledgement.trim()
    : null

  const core_answer = typeof raw.core_answer === "string" && raw.core_answer.trim()
    ? raw.core_answer.trim()
    : ""

  if (!core_answer) return null

  const next_step = typeof raw.next_step === "string" && raw.next_step.trim()
    ? raw.next_step.trim()
    : null

  const signals = Array.isArray(raw.signals)
    ? raw.signals.filter((x): x is string => typeof x === "string").slice(0, 6)
    : []

  const confidenceRaw = typeof raw.confidence === "number" ? raw.confidence : Number(raw.confidence ?? 0.5)
  const confidence = Number.isFinite(confidenceRaw) ? Math.max(0, Math.min(1, confidenceRaw)) : 0.5

  // Assemble final message
  const parts = [acknowledgement, core_answer, next_step].filter(Boolean)
  const assistant_message = parts.join("\n\n").trim()

  if (!assistant_message) return null

  return {
    is_history_query,
    routing_intent,
    mode_used,
    conversation_move,
    investigation_focus,
    relational_state,
    topic,
    objective,
    acknowledgement,
    core_answer,
    next_step,
    signals,
    confidence,
    assistant_message,
  }
}

// ─── Fallback ─────────────────────────────────────────────────────────────────

export function buildSingleTurnFallback(userText: string, lastTopic?: string): SingleTurnOutput {
  const CLOSING_WORDS = ["tak", "farvel", "bye", "hej hej", "det var alt", "vi ses"]
  const isClosing = CLOSING_WORDS.some((w) => userText.toLowerCase().trim().includes(w))

  if (isClosing) {
    return {
      is_history_query: false, routing_intent: "none", mode_used: "closing",
      conversation_move: "close", investigation_focus: "none", relational_state: "gentle_close",
      topic: lastTopic, objective: undefined, acknowledgement: null,
      core_answer: "Selv tak.", next_step: null, signals: ["closing_fallback"],
      confidence: 0.9, assistant_message: "Selv tak.",
    }
  }

  return {
    is_history_query: false, routing_intent: "none", mode_used: "info",
    conversation_move: "direct_answer", investigation_focus: "none", relational_state: "orienting",
    topic: lastTopic, objective: undefined, acknowledgement: null,
    core_answer: "Jeg kan godt hjælpe med det. Fortæl gerne mere om hvad der er på hjerte.",
    next_step: null, signals: ["llm_fallback"], confidence: 0.3,
    assistant_message: "Jeg kan godt hjælpe med det. Fortæl gerne mere om hvad der er på hjerte.",
  }
}

// ─── Hoved-funktion ───────────────────────────────────────────────────────────

export async function singleTurnCall(params: {
  llm: LlmClient
  transcript: TranscriptTurn[]
  userText: string
  lastTopic?: string
  arousalLevel: "low" | "elevated" | "high"
  assistantCount: number
  contextPackSystem?: string
  userProfileSystem?: string
  previousMode?: PromptMode
  previousRelationalState?: RelationalState
}): Promise<SingleTurnOutput | null> {
  const lastAssistantExcerpt = [...params.transcript]
    .reverse()
    .find((t) => t.role === "assistant")?.content

  const systemPrompt = buildSystemPrompt({
    assistantCount: params.assistantCount,
    arousalLevel: params.arousalLevel,
    lastAssistantExcerpt,
    contextPackSystem: params.contextPackSystem,
    userProfileSystem: params.userProfileSystem,
    previousMode: params.previousMode,
    previousRelationalState: params.previousRelationalState,
  })

  // C: Dynamisk temperatur — reflection er mere kreativ, evidence/info mere præcis
  const temperature =
    params.arousalLevel === "high" ? 0.1 :
    params.previousMode === "reflection" ? 0.38 :
    params.previousMode === "evidence" ? 0.18 :
    params.previousMode === "info" ? 0.20 :
    0.25

  let raw: Record<string, unknown> | null = null
  try {
    raw = await params.llm.chatJson({
      model: process.env.HYPNO_MODEL ?? "gpt-4.1-mini",
      temperature,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: JSON.stringify({
            user_input: params.userText,
            last_topic: params.lastTopic ?? "",
            transcript: params.transcript.slice(-8),
          }),
        },
      ],
    })
  } catch (err) {
    console.error("[singleTurnCall] LLM-kald fejlede:", String(err))
    return null
  }

  if (!raw) {
    console.error("[singleTurnCall] LLM returnerede null")
    return null
  }

  const result = normalizeOutput(raw, params.userText, params.lastTopic)
  if (!result) {
    console.error("[singleTurnCall] Normalisering fejlede", JSON.stringify(raw).slice(0, 200))
    return null
  }

  return result
}
