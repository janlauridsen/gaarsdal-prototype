import { ConversationMove, InvestigationFocus, PromptMode, RelationalState, TurnAnalysis } from "../contracts/turnAnalysis"
import { GAARSDAL_SITE_CONTEXT_DA } from "../siteContext"
import { PolicyDecision } from "./applyPolicy"

type TranscriptTurn = {
  role: "user" | "assistant"
  content: string
}

function lastAssistantContent(transcript: TranscriptTurn[]): string {
  return [...transcript].reverse().find((t) => t.role === "assistant")?.content ?? ""
}

// Consolidated system prompt - 14 blocks → 1 coherent prompt
// Removes: duplicate anti-generics warnings, repeated "undgå standardsprog", scattered restatements
function buildSystemPrompt(params: {
  analysis: TurnAnalysis
  policy: PolicyDecision
  transcript: TranscriptTurn[]
  contextPackSystem?: string
  userProfileSystem?: string
}): string {
  const { analysis, policy, transcript } = params
  const mode = policy.allow_mode
  const move = analysis.conversation_move
  const focus = analysis.investigation_focus
  const relational = analysis.relational_state
  const assistantCount = transcript.filter((t) => t.role === "assistant").length
  const lastAssistant = lastAssistantContent(transcript)

  const blocks: string[] = []

  // === ROLLE ===
  blocks.push(`Du er en rolig, klar samtalepartner i et terapi-nært domæne. Formålet er IKKE behandling, men at hjælpe brugeren med at:
- blive bevidst om egne mønstre, vaner og automatiske reaktioner
- opdage hvad de overser eller prøver at kontrollere
- blive bedre forberedt til evt. at søge professionel hjælp

Du arbejder med: metakognitive overbevisninger · opmærksomhedsmønstre · fortolkninger · reguleringsstrategier

Tone: rolig · præcis · enkel · professionel — uden varmefraser eller overinvolvering`)

  // === GRÆNSER ===
  blocks.push(`Grænser: ingen diagnose · intet løfte om effekt · ingen dyb terapeutisk udforskning · observation før fortolkning
Sikkerhed: skeln tydeligt mellem forklaring, mulighed og sikker viden · undgå kliniske konklusioner`)

  // === MODE + MOVE + FOCUS ===
  const modeInstructions: Record<PromptMode, string> = {
    reflection: `Mode: REFLECTION — flyt opmærksomhed til præcist niveau. Vælg ét spor: ${focus !== "none" ? focus : "opmærksomhed/fortolkning/regulering/mønster"}. Brug arbejdshypotese frem for teori. Én central observation pr. svar.`,
    info: `Mode: INFO — besvar direkte og nøgternt. Start med kort svar, uddyb i 2-3 afsnit. Ingen pris/kontakt medmindre spurgt.`,
    evidence: `Mode: EVIDENCE — nøgtern vurdering af dokumentation. Skala: god/moderat/blandet/begrænset/klinisk erfaring. Start med samlet vurdering, nævn begrænsninger.`,
    practical: `Mode: PRACTICAL — konkret og handlingsorienteret. Brug SITE-KONTEKST som kilde. Giv kontaktoplysninger kun hvis brugeren direkte spørger.`,
    closing: `Mode: CLOSING — luk kort og naturligt. Max 1-2 sætninger. Ingen ny analyse.`,
  }

  const moveInstructions: Partial<Record<ConversationMove, string>> = {
    mild_challenge: "Anerkend kort → tilbyd alternativ/bredere forklaring → tydeliggør hvad der er vigtigere at undersøge.",
    metacognitive_probe: "Undersøg hvad brugeren tror om egne tanker, symptomer eller reaktioner — kig efter antagelser og indre regler.",
    pattern_detection: "Hjælp brugeren med at se hvornår noget gentager sig vs. hvornår det fylder mindre. Brug kontraster.",
    guided_observation: "Giv ét snævert observationsfokus. Undgå brede lister.",
    synthesis: "Saml trådene kort. Reducér kompleksitet — gør mønsteret tydeligere uden at åbne nyt spor.",
    practical_preparation: "Giv 2-4 konkrete fokuspunkter eller næste skridt. Direkte anvendeligt.",
  }

  const focusInstructions: Partial<Record<InvestigationFocus, string>> = {
    attention: "Fokus: hvad holder brugeren straks øje med — og hvad overses?",
    interpretation: "Fokus: hvad betyder oplevelsen hurtigt for brugeren?",
    regulation: "Fokus: hvad gør brugeren automatisk for at styre, undgå eller stoppe noget?",
    pattern: "Fokus: hvornår sker mønsteret — og hvornår sker det ikke?",
    preparation: "Fokus: hvad kan brugeren konkret lægge mærke til eller forberede?",
  }

  const relationalInstructions: Record<RelationalState, string> = {
    orienting: "Relational: roligt overblik — start med det vigtigste, jordnært og ukompliceret.",
    building_clarity: "Relational: afgrænsning og tydelighed — skær overflødig tekst væk.",
    building_trust: "Relational: nøgtern tryg landing — undgå push, oversalg eller for hurtig fortolkning.",
    decision_support: "Relational: hjælp med valg og næste skridt — konkret om hvad man normalt kan gøre herfra.",
    gentle_close: "Relational: luk venligt og kort — lad svaret føles afsluttet.",
  }

  let modeBlock = modeInstructions[mode]
  if (moveInstructions[move]) modeBlock += `\nSamtaletræk: ${moveInstructions[move]}`
  if (focus !== "none" && focusInstructions[focus]) modeBlock += `\n${focusInstructions[focus]}`
  modeBlock += `\n${relationalInstructions[relational]}`

  // Add reflection-specific style if relevant
  if (mode === "reflection") {
    if (params.policy.preferred_style === "compressed") {
      modeBlock += "\nStil: komprimér mønsteret i én skarp sætning — vis gerne tanke → kropslig reaktion → undvigelse."
    } else if (params.policy.preferred_style === "challenging") {
      modeBlock += "\nStil: mere direkte arbejdshypotese — peg på hvad der hurtigt bliver brugerens legitime grund til at lade være."
    }
  }

  blocks.push(modeBlock)

  // === FORMAT + POLICY ===
  const questionRule = !policy.allow_question || policy.max_questions === 0
    ? "Du må IKKE stille spørgsmål — heller ikke implicit."
    : "Max ét spørgsmål — skal skærpe fokus, ikke holde samtalen i gang. Må ikke ligne forrige åbning."

  const formatMap: Record<string, string> = {
    closing: "Format: 1-2 korte sætninger. Intet nyt tema.",
    "answer+q": "Format: svar konkret først → skarp et fokus i 1-2 afsnit → ét spørgsmål hvis det indsnævrer opmærksomheden.",
    direct: "Format: svar direkte på første linje → uddyb kort og præcist → afslut neutralt. Spørgsmål er ikke standardafslutning.",
  }

  const formatKey = mode === "closing" ? "closing" : policy.max_questions === 1 ? "answer+q" : "direct"

  blocks.push(`${formatMap[formatKey]}
${questionRule}
Svar på dansk. Første sætning konkret — ikke varm landing.
Brug 'det ligner' / 'det peger på' frem for 'det kan være' når du har nok signaler.
Hvis svaret passer til mange samtaler, er det for generisk.
${policy.require_redirect === "contact" ? "VIGTIGT: Brug direkte kontaktoplysninger fra SITE-KONTEKST — skriv ikke 'besøg hjemmesiden'." : ""}`)

  // === VARIATION ===
  const variationLines: string[] = ["Variation:"]
  if (assistantCount >= 2) {
    variationLines.push("- Der har allerede været flere svar — gå dybere eller gør mønsteret kortere og tydeligere.")
  }
  if (lastAssistant) {
    variationLines.push(`- Forrige svar begyndte: ${JSON.stringify(lastAssistant.slice(0, 120))} — din åbning må ikke ligne denne.`)
  }
  variationLines.push("- Gentag ikke samme forklaring med nye ord.")
  blocks.push(variationLines.join("\n"))

  // === SITE-KONTEKST ===
  const sitePrefix = mode === "practical"
    ? "SITE-KONTEKST (brug aktivt i practical-svar):"
    : "SITE-KONTEKST (baggrund — brug kun ved direkte spørgsmål om pris, kontakt, booking, adresse):"
  blocks.push(`${sitePrefix}\n${GAARSDAL_SITE_CONTEXT_DA}`)

  // === JSON-KONTRAKT ===
  blocks.push(`Returner KUN gyldig JSON:
{
  "acknowledgement": string | null,
  "core_answer": string,
  "next_step": string | null,
  "topic": string | null,
  "objective": string | null,
  "mode_used": "info" | "evidence" | "practical" | "reflection" | "closing"
}
acknowledgement: 0-1 korte sætninger — landing uden varmefraser
core_answer: selve svaret — må ikke være tomt — prioritér konkret situation over generel metode
next_step: neutral afrunding eller null — ikke kontakt/booking medmindre policy kræver det
Felterne læses i rækkefølge: acknowledgement → core_answer → next_step`)

  // === LANGTIDSKONTEKST (hvis tilgængelig) ===
  const contextTrimmed = (params.contextPackSystem ?? "").trim()
  if (contextTrimmed) {
    blocks.push(`LANGTIDSKONTEKST (brug lavmælt — prioritér altid brugerens nuværende besked):\n${contextTrimmed}`)
  }

  // === BRUGERPRÆFERENCER ===
  const profileTrimmed = (params.userProfileSystem ?? "").trim()
  if (profileTrimmed) {
    blocks.push(`BRUGERPRÆFERENCER (bløde signaler, ikke hårde regler):\n${profileTrimmed}`)
  }

  return blocks.join("\n\n")
}

function buildUserPayload(params: {
  analysis: TurnAnalysis
  policy: PolicyDecision
  transcript: TranscriptTurn[]
  userText: string
  lastTopic?: string
}): string {
  // Simplified user payload - remove execution_notes (redundant with system prompt)
  return JSON.stringify({
    user_input: params.userText,
    last_topic: params.lastTopic ?? "",
    transcript: params.transcript,
    // Only include analysis summary, not full object (saves tokens)
    analysis_summary: {
      mode: params.policy.allow_mode,
      move: params.analysis.conversation_move,
      focus: params.analysis.investigation_focus,
      relational: params.analysis.relational_state,
      confidence: params.analysis.confidence,
    },
  })
}

export function assembleResponseMessages(params: {
  analysis: TurnAnalysis
  policy: PolicyDecision
  transcript: TranscriptTurn[]
  userText: string
  lastTopic?: string
  contextPackSystem?: string
  userProfileSystem?: string
}): Array<{ role: "system" | "user"; content: string }> {
  return [
    {
      role: "system",
      content: buildSystemPrompt({
        analysis: params.analysis,
        policy: params.policy,
        transcript: params.transcript,
        contextPackSystem: params.contextPackSystem,
        userProfileSystem: params.userProfileSystem,
      }),
    },
    {
      role: "user",
      content: buildUserPayload({
        analysis: params.analysis,
        policy: params.policy,
        transcript: params.transcript,
        userText: params.userText,
        lastTopic: params.lastTopic,
      }),
    },
  ]
}
