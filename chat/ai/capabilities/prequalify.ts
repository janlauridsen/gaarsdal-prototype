import { AiCapability, AiCapabilityContext, AiCapabilityResult, LlmClient } from "../types"
import { Transition } from "../../kernel/types"

type Turn = { role: "user" | "assistant"; content: string }

const MAX_TURNS = 6

function readTranscript(context: AiCapabilityContext): Turn[] {
  const raw = context.state.meta["prequalify.transcript"]?.value
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

function assistantTurns(transcript: Turn[]): number {
  return transcript.filter((t) => t.role === "assistant").length
}

function append(transcript: Turn[], userText: string, assistantText: string): Turn[] {
  const next = [...transcript]
  if (userText.trim()) next.push({ role: "user", content: userText.trim() })
  if (assistantText.trim()) next.push({ role: "assistant", content: assistantText.trim() })
  return next
}

function isFitSignal(text: string): boolean {
  const t = text.toLowerCase()
  return ["book", "ja", "gerne", "bestil", "tid", "ringe", "kontakt", "møde", "start", "ja tak"].some((x) => t.includes(x))
}

function isExploreSignal(text: string): boolean {
  const t = text.toLowerCase()
  return ["mere", "mere info", "ved ikke", "usikker", "forstå", "tænke", "overveje", "fortæl"].some((x) => t.includes(x))
}

const SYSTEM_PROMPT = `Du er en rolig, præcis samtalepartner hos Gaarsdal Hypnoterapi.

Din opgave er at hjælpe den besøgende med at afklare om hypnoterapi er det rigtige næste skridt for dem.

Stil ét spørgsmål ad gangen. Brug max 2 sætninger pr. svar. Vær konkret og nøgtern — ikke sælgende.

Du stiller typisk disse spørgsmål (men tilpas rækkefølge og formulering til samtalen):
1. Hvad er det primære, du ønsker at arbejde med?
2. Har du prøvet at ændre det på andre måder? Hvad skete der?
3. Er der noget der gør dig usikker på om hypnoterapi er det rigtige?

Efter 2-3 svar fra brugeren: giv en ærlig vurdering af om hypnoterapi sandsynligvis er relevant, og foreslå enten booking eller mere afklarende samtale.

Returnér JSON: { "assistant_message": "...", "fit": "good" | "explore" | "unknown", "reason": "kort begrundelse" }

"good" = klar, relevant problemstilling + noget motivation — sæt "good" når du har nok til at anbefale en samtale med Jan
"explore" = emnet er relevant men du mangler stadig vigtig information om situation eller motivation
"unknown" = for tidligt at vurdere`

async function runPrequalify(
  context: AiCapabilityContext,
  llm: LlmClient
): Promise<AiCapabilityResult> {
  const userText = context.userText ?? ""
  const transcript = readTranscript(context)
  const turnCount = assistantTurns(transcript)

  // Build messages for LLM
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: SYSTEM_PROMPT },
  ]

  // Inject transcript history
  for (const turn of transcript.slice(-MAX_TURNS)) {
    messages.push({ role: turn.role, content: turn.content })
  }

  // Current user message
  if (userText.trim()) {
    messages.push({ role: "user", content: userText })
  }

  let assistantText = ""
  let fit: "good" | "explore" | "unknown" = "unknown"
  let reason = ""

  try {
    const raw = await llm.chatJson({
      model: context.modelOverride ?? process.env.HYPNO_MODEL ?? "gpt-4.1-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages,
    })

    if (raw && typeof (raw as any).assistant_message === "string") {
      assistantText = String((raw as any).assistant_message).trim()
    }
    if ((raw as any).fit === "good" || (raw as any).fit === "explore") {
      fit = (raw as any).fit
    }
    if (typeof (raw as any).reason === "string") {
      reason = String((raw as any).reason).trim()
    }
  } catch {
    assistantText = "Hvad er det primære, du ønsker at arbejde med?"
    fit = "unknown"
  }

  if (!assistantText) {
    assistantText =
      turnCount === 0
        ? "Hvad er det primære, du ønsker at arbejde med?"
        : "Kan du fortælle lidt mere om hvad der holder dig tilbage fra at søge hjælp?"
  }

  // Check if we already showed the booking offer last turn
  const offerShown = context.state.meta["prequalify.offer_shown"]?.value === true

  // Detect if user is accepting the booking offer
  const acceptKeywords = ["ja", "gerne", "ok", "okay", "ja tak", "bestil", "book", "udfyld", "send", "kontakt"]
  const declineKeywords = ["nej", "ikke nu", "ikke endnu", "måske", "senere", "tænke"]
  const normalizedUser = userText.trim().toLowerCase()
  const isAccepting = offerShown && acceptKeywords.some(k => normalizedUser === k || normalizedUser.startsWith(k + " "))
  const isDeclining = offerShown && declineKeywords.some(k => normalizedUser.includes(k))

  const updatedTranscript = append(transcript, userText, assistantText)

  // Determine routing
  let nextNode = "PREQUALIFY"
  let transitionReason = "prequalify:ongoing"
  let offerShownNext = offerShown

  const forceFit = isFitSignal(userText) && turnCount >= 1
  const forceExplore = isExploreSignal(userText) && turnCount >= 2

  if (isAccepting) {
    // User confirmed they want to book
    nextNode = "HANDOFF_FORM"
    transitionReason = "prequalify:confirmed-booking"
    assistantText = "Godt. Udfyld formularen — Jan kontakter dig inden for 24 timer."
    offerShownNext = false
  } else if (isDeclining) {
    // User declined, go back to open dialog
    nextNode = "GEN_HYPNO"
    transitionReason = "prequalify:declined-booking"
    assistantText = "Ingen stress. Du er velkommen til at stille spørgsmål eller vende tilbage når du er klar."
    offerShownNext = false
  } else if (!offerShown && (fit === "good" || forceFit)) {
    // Good fit detected — show offer but stay on PREQUALIFY
    assistantText = assistantText
      ? assistantText + "\n\nBaseret på det du fortæller, lyder det som om hypnoterapi kan være relevant for dig. Vil du tage kontakt til Jan for en afklarende samtale?"
      : "Det lyder som om hypnoterapi kan være relevant for dig. Vil du tage kontakt til Jan for en afklarende samtale?"
    offerShownNext = true
  } else if (turnCount >= 4 || forceExplore || (turnCount >= 3 && fit === "explore")) {
    // After enough turns without clear fit, send back to open dialog
    nextNode = "GEN_HYPNO"
    transitionReason = "prequalify:explore-more"
  }

  const transition: Transition = {
    type: "NODE_HOP",
    from: context.state.active_node,
    to: nextNode,
    reason: transitionReason,
    response_message: assistantText,
    meta_delta: {
      "prequalify.transcript": updatedTranscript,
      "prequalify.fit": fit,
      "prequalify.reason": reason,
      "prequalify.turn_count": turnCount + 1,
      "prequalify.offer_shown": offerShownNext,
    },
  }

  return {
    transition,
    debug: { capability: "prequalify-v1", used_fallback: !assistantText },
  }
}

export const prequalifyCapability: AiCapability = {
  id: "prequalify-v1",
  run: runPrequalify,
}

export default prequalifyCapability
