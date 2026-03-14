import { PromptMode, TurnAnalysis } from "../contracts/turnAnalysis"
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

type TranscriptTurn = { role: "user" | "assistant"; content: string }

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
  const lines = [
    "POLICY BESLUTNING",
    `- allow_mode: ${policy.allow_mode}`,
    `- allow_question: ${policy.allow_question}`,
    `- max_questions: ${policy.max_questions}`,
    `- response_length: ${policy.response_length}`,
    `- require_redirect: ${policy.require_redirect ?? "none"}`,
  ]

  if (policy.require_redirect === "contact") {
    lines.push(
      "",
      "KRITISK REGLER FOR KONTAKT-SVAR:",
      "- Brug den konkrete kontaktinformation fra SITE-KONTEKST.",
      "- Skriv ikke generiske formuleringer som 'besøg den officielle hjemmeside' eller 'brug kontaktinformation der er angivet der'.",
      "- Hvis brugeren vil tale med Jan eller spørger om kontakt, så giv direkte telefon, e-mail og adresse kort og præcist.",
      "- Hvis brugeren spørger om pris, så brug prisoplysningerne fra SITE-KONTEKST.",
      "- Opfind ikke nye priser eller kontaktveje."
    )
  }

  if (policy.allow_mode === "practical") {
    lines.push(
      "",
      "KRITISK REGLER FOR PRACTICAL:",
      "- Svar konkret og handlingsrettet.",
      "- Brug SITE-KONTEKST som faktakilde.",
      "- Undgå generiske sikkerheds- eller hjemmesideformuleringer, når konkrete fakta findes i SITE-KONTEKST."
    )
  }

  return lines.join("\n")
}

export function assembleResponseMessages(params: {
  analysis: TurnAnalysis
  policy: PolicyDecision
  transcript: TranscriptTurn[]
  userText: string
  lastTopic?: string
}): Array<{ role: "system" | "user"; content: string }> {
  const systemPrompt = [
    BASE_ROLE_PROMPT,
    DOMAIN_BOUNDARY_PROMPT,
    SAFETY_PROMPT,
    getModePrompt(params.policy.allow_mode),
    TONE_CALM_NEUTRAL_PROMPT,
    getFormatPrompt(params.policy),
    buildPolicyInstruction(params.policy),
    `SITE-KONTEKST\n${GAARSDAL_SITE_CONTEXT_DA}`,
    `Returner kun gyldig JSON:
{
  "assistant_message": string,
  "topic": string | null,
  "objective": string | null,
  "mode_used": "info" | "evidence" | "practical" | "reflection" | "closing"
}`,
  ].join("\n\n")

  return [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: JSON.stringify({
        analysis: params.analysis,
        policy: params.policy,
        last_topic: params.lastTopic ?? "",
        transcript: params.transcript,
        user_input: params.userText,
      }),
    },
  ]
}
