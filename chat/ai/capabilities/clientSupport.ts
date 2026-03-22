import { AiCapability, AiCapabilityContext, AiCapabilityResult, LlmClient } from "../types"
import { Transition } from "../../kernel/types"

type Turn = { role: "user" | "assistant"; content: string }

const MAX_TRANSCRIPT_TURNS = 20
const MAX_TRANSCRIPT_CHARS = 4000

function readTranscript(context: AiCapabilityContext): Turn[] {
  const raw = context.state.meta["client_support.transcript"]?.value
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

function append(transcript: Turn[], userText: string, assistantText: string): Turn[] {
  const next = [...transcript]
  if (userText.trim()) next.push({ role: "user", content: userText.trim() })
  if (assistantText.trim()) next.push({ role: "assistant", content: assistantText.trim() })
  return next
}

function detectBookingIntent(text: string): boolean {
  const t = text.toLowerCase()
  return ["book", "bestil", "ny tid", "næste session", "aftale", "time", "kontakt jan"].some((x) => t.includes(x))
}

function detectHardExit(text: string): boolean {
  const t = text.toLowerCase().trim()
  return ["stop", "afslut", "slut", "tilbage", "hjem", "home", "menu"].includes(t)
}

const SYSTEM_PROMPT = `Du støtter en person, der allerede er i et hypnoterapiforløb hos Jan Gaarsdal.

Din rolle er at:
- give let, praktisk støtte mellem sessioner
- hjælpe personen med at holde opmærksomheden på det, de arbejder med
- svare kort og konkret på spørgsmål om processen
- minde dem om øvelser eller opmærksomhedspunkter de har nævnt

Du er IKKE terapeut og foretager INGEN behandling. Du er en rolig, neutral støtte.

Tone: varm men klar. Ingen store løfter. Ingen diagnose.

Eksempler på hvad du kan:
- "Hvordan gik det siden sidst?" → spørg konkret ind til hvad de lagde mærke til
- "Øvelsen virker ikke" → udforsk hvad der sker præcist, undgå at afvise oplevelsen
- "Hvornår er næste session?" → henvis til Jan for aftaler

Returnér JSON: { "assistant_message": "...", "suggest_booking": true|false }
suggest_booking: true hvis personen nævner ønske om ny session, eller du vurderer det ville hjælpe.`

async function runClientSupport(
  context: AiCapabilityContext,
  llm: LlmClient
): Promise<AiCapabilityResult> {
  const userText = context.userText ?? ""
  const transcript = readTranscript(context)
  const trimmed = trimTranscript(transcript)

  if (detectHardExit(userText)) {
    const msg = "Selv tak. Du kan vende tilbage her, når du har brug for det."
    const updated = append(transcript, userText, msg)
    const transition: Transition = {
      type: "NODE_HOP",
      from: context.state.active_node,
      to: "HOME",
      reason: "client-support:exit",
      response_message: msg,
      meta_delta: { "client_support.transcript": updated },
    }
    return { transition, debug: { capability: "client-support-v1", used_fallback: false } }
  }

  if (detectBookingIntent(userText)) {
    const msg =
      "For at booke en ny session kan du kontakte Jan direkte på +45 42 80 74 74 eller jan@gaarsdal.net — eller bruge kontaktformularen her."
    const updated = append(transcript, userText, msg)
    const transition: Transition = {
      type: "NODE_HOP",
      from: context.state.active_node,
      to: "HANDOFF_FORM",
      reason: "client-support:booking-intent",
      response_message: msg,
      meta_delta: { "client_support.transcript": updated },
    }
    return { transition, debug: { capability: "client-support-v1", used_fallback: false } }
  }

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: SYSTEM_PROMPT },
  ]

  for (const turn of trimmed) {
    messages.push({ role: turn.role, content: turn.content })
  }

  if (userText.trim()) {
    messages.push({ role: "user", content: userText })
  }

  let assistantText = ""
  let suggestBooking = false

  try {
    const raw = await llm.chatJson({
      model: process.env.HYPNO_MODEL ?? "gpt-4.1-mini",
      temperature: 0.35,
      response_format: { type: "json_object" },
      messages,
    })

    if (raw && typeof (raw as any).assistant_message === "string") {
      assistantText = String((raw as any).assistant_message).trim()
    }
    if ((raw as any).suggest_booking === true) {
      suggestBooking = true
    }
  } catch {
    assistantText = "Kan du beskrive hvad der sker for dig lige nu?"
  }

  if (!assistantText) {
    assistantText = "Hvad har du lagt mærke til siden sidst?"
  }

  const updatedTranscript = append(transcript, userText, assistantText)

  const nextNode = suggestBooking ? "HANDOFF_FORM" : "CLIENT_SUPPORT"

  const transition: Transition = {
    type: "NODE_HOP",
    from: context.state.active_node,
    to: nextNode,
    reason: "client-support:ongoing",
    response_message: assistantText,
    meta_delta: {
      "client_support.transcript": updatedTranscript,
      "client_support.last_topic": userText.slice(0, 120),
    },
  }

  return { transition, debug: { capability: "client-support-v1", used_fallback: !assistantText } }
}

export const clientSupportCapability: AiCapability = {
  id: "client-support-v1",
  run: runClientSupport,
}

export default clientSupportCapability
