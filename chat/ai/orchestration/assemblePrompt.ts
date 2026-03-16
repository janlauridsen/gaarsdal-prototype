import { PromptMode, RelationalState, TurnAnalysis } from "../contracts/turnAnalysis"
import { BASE_ROLE_PROMPT } from "../prompts/baseRole"
import { DOMAIN_BOUNDARY_PROMPT } from "../prompts/domainBoundary"
import { FORMAT_ANSWER_PLUS_ONE_QUESTION_PROMPT } from "../prompts/formats/answerPlusOneQuestion"
import { FORMAT_BRIEF_CLOSE_PROMPT } from "../prompts/formats/briefClose"
import { FORMAT_DIRECT_ANSWER_PROMPT } from "../prompts/formats/directAnswer"
import { MODE_CLOSING_PROMPT } from "../prompts/modes/closing"
import { MODE_EVIDENCE_PROMPT } from "../prompts/modes/evidence"
import { MODE_INFO_PROMPT } from "../prompts/modes/info"
import { MODE_PRACTICAL_PROMPT } from "../prompts/modes/practical"
import { MODE_REFLECTION_PROMPT } from "../prompts/modes/reflection"
import { SAFETY_PROMPT } from "../prompts/safety"
import { TONE_CALM_NEUTRAL_PROMPT } from "../prompts/tones/calmNeutral"
import { GAARSDAL_SITE_CONTEXT_DA } from "../siteContext"
import { PolicyDecision } from "./applyPolicy"

type TranscriptTurn = {
  role: "user" | "assistant"
  content: string
}

function getModePrompt(mode: PromptMode): string {
  switch (mode) {
    case "evidence":
      return MODE_EVIDENCE_PROMPT
    case "practical":
      return MODE_PRACTICAL_PROMPT
    case "reflection":
      return MODE_REFLECTION_PROMPT
    case "closing":
      return MODE_CLOSING_PROMPT
    case "info":
    default:
      return MODE_INFO_PROMPT
  }
}

function getFormatPrompt(policy: PolicyDecision): string {
  if (policy.allow_mode === "closing") return FORMAT_BRIEF_CLOSE_PROMPT
  if (policy.max_questions === 1) return FORMAT_ANSWER_PLUS_ONE_QUESTION_PROMPT
  return FORMAT_DIRECT_ANSWER_PROMPT
}

function buildPolicyInstruction(policy: PolicyDecision): string {
  const lines: string[] = [
    "POLICY BESLUTNING",
    `- allow_mode: ${policy.allow_mode}`,
    `- allow_question: ${policy.allow_question}`,
    `- max_questions: ${policy.max_questions}`,
    `- response_length: ${policy.response_length}`,
    `- require_redirect: ${policy.require_redirect ?? "none"}`,
    "",
    "HÅRDE REGLER",
    "- Følg policy-beslutningen over alt andet.",
    "- Returner kun gyldig JSON.",
    "- Svar på dansk.",
  ]

  if (!policy.allow_question || policy.max_questions === 0) {
    lines.push(
      "- Du må ikke stille spørgsmål.",
      "- Brug ikke formuleringer som implicit fungerer som spørgsmål."
    )
  }

  if (policy.max_questions === 1) {
    lines.push(
      "- Du må højst stille ét spørgsmål i hele svaret.",
      "- Ét spørgsmål betyder præcis én afsluttende spørgesætning.",
      "- Du må ikke stille en serie af delspørgsmål.",
      "- Du må ikke stille flere spørgsmål i samme sætning.",
      "- Vælg ét fokuseret spørgsmål, som bedst hjælper videre.",
      "- Resten af svaret skal være forklaring eller struktur, ikke spørgsmål."
    )
  }

  if (policy.allow_mode === "reflection") {
    lines.push(
      "",
      "EKSTRA REGLER FOR REFLECTION",
      "- Hold refleksionen enkel, rolig og observerende.",
      "- Brug observation før fortolkning.",
      "- Giv højst 1-2 observationsvinkler, men formuler dem som udsagn, ikke som flere spørgsmål.",
      "- Afslut med ét enkelt fokuseret spørgsmål, hvis policy tillader det.",
      "- Undgå spørgebarrager som 'hvad sker der før, under og efter' i spørgsmålform.",
      "- Lad svaret lyde som en samtale, ikke som en metodebeskrivelse."
    )
  }

  if (policy.allow_mode === "info") {
    lines.push(
      "",
      "EKSTRA REGLER FOR INFO",
      "- Besvar brugerens aktuelle spørgsmål direkte.",
      "- Tilføj ikke pris, kontakt eller bookinginformation, medmindre brugeren spørger om det eller policy kræver det.",
      "- Brug kun praktiske oplysninger, hvis de er direkte relevante for denne turn."
    )
  }

  if (policy.allow_mode === "evidence") {
    lines.push(
      "",
      "EKSTRA REGLER FOR EVIDENCE",
      "- Hold fokus på dokumentation, effekt og begrænsninger.",
      "- Tilføj ikke pris, kontakt eller bookinginformation, medmindre brugeren spørger om det."
    )
  }

  if (policy.allow_mode === "practical") {
    lines.push(
      "",
      "EKSTRA REGLER FOR PRACTICAL",
      "- Svar konkret og handlingsrettet.",
      "- Brug praktiske fakta fra SITE-KONTEKST som kilde.",
      "- Undgå generiske formuleringer som 'besøg hjemmesiden' hvis konkrete oplysninger findes.",
      "- Hvis brugeren spørger om kontakt, så giv konkret telefon, e-mail og adresse.",
      "- Hvis brugeren spørger om pris, så giv konkret prisinformation fra SITE-KONTEKST."
    )
  }

  if (policy.require_redirect === "contact") {
    lines.push(
      "",
      "KRITISKE KONTAKTREGLER",
      "- Brug direkte kontaktoplysninger fra SITE-KONTEKST.",
      "- Skriv ikke 'brug kontaktinformationen der er angivet der'.",
      "- Skriv ikke 'besøg den officielle hjemmeside' som erstatning for konkrete data."
    )
  }

  return lines.join("\n")
}

function buildSiteContextInstruction(mode: PromptMode): string {
  if (mode === "practical") {
    return [
      "SITE-KONTEKST",
      "Brug disse oplysninger aktivt i practical-svar, når de er relevante.",
      GAARSDAL_SITE_CONTEXT_DA,
    ].join("\n")
  }

  return [
    "SITE-KONTEKST",
    "Dette er baggrundskontekst. Brug den kun hvis brugeren direkte spørger om pris, kontakt, booking, adresse, telefon eller e-mail.",
    "Ved info-, evidence- og reflection-svar må du ikke frivilligt tilføje pris eller kontaktoplysninger.",
    GAARSDAL_SITE_CONTEXT_DA,
  ].join("\n")
}

function buildResponseContractInstruction(): string {
  return `Returner kun gyldig JSON:
{
  "acknowledgement": string | null,
  "core_answer": string,
  "next_step": string | null,
  "topic": string | null,
  "objective": string | null,
  "mode_used": "info" | "evidence" | "practical" | "reflection" | "closing"
}

Regler for felterne:
- acknowledgement: 0-1 korte sætninger som lander brugerens situation menneskeligt uden varmefraser eller overinvolvering
- core_answer: selve det faglige eller praktiske svar
- next_step: kun hvis det naturligt hjælper videre; ellers null
- core_answer må ikke være tom
- svar skal lyde naturligt og sammenhængende når felterne læses i rækkefølgen acknowledgement -> core_answer -> next_step`
}

function buildRelationalInstruction(relationalState: RelationalState): string {
  const lines: string[] = [
    "RELATIONEL STYRING",
    `- relational_state: ${relationalState}`,
  ]

  switch (relationalState) {
    case "building_clarity":
      lines.push(
        "- Hjælp brugeren med afgrænsning og enkel struktur.",
        "- Skær overflødig tekst væk.",
        "- Gør forskelle og næste forståelige skridt tydelige."
      )
      break
    case "building_trust":
      lines.push(
        "- Land svaret roligt og nøgternt.",
        "- Gør det tydeligt hvad der er typisk, hvad der er muligt, og hvad der afhænger af personen.",
        "- Undgå push, oversalg eller for hurtig fortolkning."
      )
      break
    case "decision_support":
      lines.push(
        "- Hjælp brugeren med vurdering, relevans eller næste skridt.",
        "- Vær konkret om hvad man normalt kan gøre herfra.",
        "- Hold fokus på det valg eller den afklaring, brugeren står i."
      )
      break
    case "gentle_close":
      lines.push(
        "- Luk venligt og kort.",
        "- Lad svaret føles afsluttet uden at skubbe videre."
      )
      break
    case "orienting":
    default:
      lines.push(
        "- Hjælp brugeren med overblik og tryg orientering.",
        "- Start med det vigtigste først.",
        "- Lad svaret føles jordnært og ukompliceret."
      )
      break
  }

  return lines.join("\n")
}

function buildContextPackInstruction(contextPackSystem?: string): string {
  const trimmed = (contextPackSystem ?? "").trim()
  if (!trimmed) return ""

  return [
    "LANGTIDSKONTEKST",
    "Brug denne kontekst lavmælt og kun hvis den hjælper den aktuelle turn.",
    "Prioritér altid brugerens nuværende besked over ældre kontekst.",
    trimmed,
  ].join("\n")
}

function buildUserProfileInstruction(userProfileSystem?: string): string {
  const trimmed = (userProfileSystem ?? "").trim()
  if (!trimmed) return ""

  return [
    "BRUGERPRÆFERENCER",
    "Brug dette som bløde signaler, ikke som hårde regler.",
    trimmed,
  ].join("\n")
}

function buildUserPayload(params: {
  analysis: TurnAnalysis
  policy: PolicyDecision
  transcript: TranscriptTurn[]
  userText: string
  lastTopic?: string
}): string {
  return JSON.stringify({
    analysis: params.analysis,
    policy: params.policy,
    last_topic: params.lastTopic ?? "",
    transcript: params.transcript,
    user_input: params.userText,
    execution_notes: {
      practical_site_context_allowed: params.policy.allow_mode === "practical",
      price_contact_only_if_relevant: params.policy.allow_mode !== "practical",
      max_questions: params.policy.max_questions,
      reflection_single_question_only: params.policy.allow_mode === "reflection",
      natural_dialogue_goal: true,
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
  const systemBlocks = [
    BASE_ROLE_PROMPT,
    DOMAIN_BOUNDARY_PROMPT,
    SAFETY_PROMPT,
    getModePrompt(params.policy.allow_mode),
    TONE_CALM_NEUTRAL_PROMPT,
    getFormatPrompt(params.policy),
    buildRelationalInstruction(params.analysis.relational_state),
    buildPolicyInstruction(params.policy),
    buildContextPackInstruction(params.contextPackSystem),
    buildUserProfileInstruction(params.userProfileSystem),
    buildSiteContextInstruction(params.policy.allow_mode),
    buildResponseContractInstruction(),
  ].filter(Boolean)

  return [
    {
      role: "system",
      content: systemBlocks.join("\n\n"),
    },
    {
      role: "user",
      content: buildUserPayload(params),
    },
  ]
}
