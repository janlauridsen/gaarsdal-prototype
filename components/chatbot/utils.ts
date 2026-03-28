export function safeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function trimDuplicateTitle(s: string) {
  const parts = s
    .split("—")
    .map((p) => p.trim())
    .filter(Boolean)
  if (parts.length === 2 && parts[0] === parts[1]) return parts[0]
  return s.trim()
}

export function splitThreadLabel(label: string): { title: string; preview: string } {
  const cleaned = trimDuplicateTitle(label || "").trim()
  if (!cleaned) return { title: "", preview: "" }

  const idx = cleaned.indexOf("—")
  if (idx < 0) return { title: cleaned, preview: "" }

  const title = cleaned.slice(0, idx).trim()
  const preview = cleaned.slice(idx + 1).trim()
  if (!title) return { title: cleaned, preview: "" }
  return { title, preview }
}

export function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`
}

/**
 * Samtalens tre faser — afledt fra dialog-meta.
 *
 * Fase 1: Brugerens behov er ved at blive forstået (få turns)
 * Fase 2: Problemet er etableret, afklarer relevans for hypnoterapi
 * Fase 3: Relevans afklaret — hvad søger brugeren nu? (dynamisk label)
 */
export type ConversationPhase = 1 | 2 | 3

export interface PhaseResult {
  phase: ConversationPhase
  label: string
}

export function derivePhase(meta: Record<string, any> | null | undefined): PhaseResult {
  if (!meta) return { phase: 1, label: "Forstår dit behov" }

  function readValue(key: string): unknown {
    const entry = meta[key]
    if (entry && typeof entry === "object" && "value" in entry) return (entry as any).value
    return entry
  }

  const turns = typeof readValue("gen_hypno.assistant_turn_count") === "number"
    ? readValue("gen_hypno.assistant_turn_count") as number
    : 0
  const stage = String(readValue("dialog.stage") ?? "")
  const relationalState = String(readValue("dialog.relational_state") ?? "")
  const routingIntent = String(readValue("gen_hypno.analysis")
    ? (readValue("gen_hypno.analysis") as any)?.routing_intent ?? ""
    : "")
  const ctaShown = Boolean(readValue("gen_hypno.cta_shown"))
  const objective = String(readValue("dialog.objective") ?? "")

  // Fase 3-genvej: booking-intent, decision_support eller cta uanset turn count
  if (
    routingIntent === "contact_booking" ||
    objective === "booking" ||
    ctaShown ||
    relationalState === "decision_support"
  ) {
    if (routingIntent === "contact_booking" || objective === "booking" || ctaShown) {
      return { phase: 3, label: "Klar til næste skridt?" }
    }
    return { phase: 3, label: "Overvejer muligheder" }
  }

  // Returbruger: hvis last_topic er sat af SYSTEM_THREAD_CREATE er det en ny tråd
  // fra en returbruger — systemet kender dem allerede, så vi springer fase 1 over
  const lastTopicSource = meta["gen_hypno.last_topic"]
  const isReturningUser = lastTopicSource &&
    typeof lastTopicSource === "object" &&
    (lastTopicSource as any).source_node === "SYSTEM_THREAD_CREATE"

  // Fase 1: de første 1-2 turns — men kun for nye brugere
  if (turns <= 2 && !isReturningUser) return { phase: 1, label: "Forstår dit behov" }

  // Fase 2: afklarer om hypnoterapi er relevant (turns 3-5, ingen klar mønster-fase endnu)
  if (turns <= 5 && stage !== "explore_patterns") return { phase: 2, label: "Afklarer relevans" }

  // Fase 3: mønsterfasen er i gang — dynamisk label baseret på samtalens retning
  if (relationalState === "building_clarity" || relationalState === "building_trust") {
    return { phase: 3, label: "Udforsker mønstre" }
  }
  if (stage === "explore_patterns") return { phase: 3, label: "Udforsker mønstre" }

  // Fallback fase 3
  return { phase: 3, label: "I dialog" }
}

// Bagudkompatibel wrapper til eksisterende kode der forventer ConversationPhase
export function deriveConversationPhase(meta: Record<string, any> | null | undefined): ConversationPhase {
  return derivePhase(meta).phase
}

export const PHASE_LABELS: Record<ConversationPhase, string> = {
  1: "Forstår dit behov",
  2: "Afklarer relevans",
  3: "Udforsker mønstre",
}
