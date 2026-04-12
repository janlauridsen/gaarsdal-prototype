export type RouteNodeId = "GEN_HYPNO" | "BOOKING" | "AKUT" | "HOME" | "CLIENT_SUPPORT" | "HANDOFF_FORM" | "LEAD_CAPTURE" | "PREQUALIFY"

export type RouteDecision = {
  nextNodeId: RouteNodeId
  confidence: number
  reason: string
  detected_topic?: string
}

export type HomeRouterInput = {
  userText?: string
  candidates?: string[]
}

function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, " ")
}

function hasAny(text: string, needles: string[]): boolean {
  return needles.some((needle) => text.includes(needle))
}

function candidateSet(candidates?: string[]): Set<string> {
  return new Set(Array.isArray(candidates) ? candidates : [])
}

function pickIfAllowed(
  allowed: Set<string>,
  preferred: RouteNodeId,
  fallback: RouteNodeId = "GEN_HYPNO"
): RouteNodeId {
  if (allowed.size === 0) return preferred
  if (allowed.has(preferred)) return preferred
  if (allowed.has(fallback)) return fallback
  if (allowed.has("GEN_HYPNO")) return "GEN_HYPNO"
  if (allowed.has("BOOKING")) return "BOOKING"
  if (allowed.has("AKUT")) return "AKUT"
  if (allowed.has("HOME")) return "HOME"
  return fallback
}

export function homeRouterV1(params: HomeRouterInput): RouteDecision {
  const raw = params.userText ?? ""
  const t = normalize(raw)
  const allowed = candidateSet(params.candidates)

  if (!t) {
    return {
      nextNodeId: pickIfAllowed(allowed, "GEN_HYPNO"),
      confidence: 0.7,
      reason: "empty input defaults to general hypnotherapy dialogue",
    }
  }

  // Akut / krise
  if (
    hasAny(t, [
      "akut", "krise", "fare", "selvmord", "selvskade", "112", "lægevagt", "psykiatrisk akut",
      "gøre mig selv ondt", "slå mig selv", "skade mig selv", "vil ikke leve",
      "ingen udvej", "ingen vej ud", "ikke leve mere", "ikke her mere",
      "tage mit eget liv", "ende det hele", "give op på livet",
    ])
  ) {
    return {
      nextNodeId: pickIfAllowed(allowed, "AKUT", "GEN_HYPNO"),
      confidence: 0.95,
      reason: "acute help intent",
    }
  }

  // Eksisterende klient
  if (
    hasAny(t, [
      "eksisterende klient", "været hos jan", "var hos jan", "har haft session",
      "min session", "vende tilbage", "forrige session", "siden sidst",
      "øvelse", "øvelser fra", "vi arbejdede med", "jan sagde",
    ])
  ) {
    return {
      nextNodeId: pickIfAllowed(allowed, "CLIENT_SUPPORT", "GEN_HYPNO"),
      confidence: 0.88,
      reason: "existing client returning",
    }
  }

  // Direkte booking / kontakt
  if (
    hasAny(t, [
      "book", "booking", "bestil", "bestille", "booke",
      "kontakt jan", "kontakt mig", "mail", "email", "e-mail",
      "telefon", "telefonnummer", "ring til jan", "ringe til jan", "sms",
      "skriv til jan", "jeg vil tale med jan", "jeg vil gerne ringe",
      "kan jeg kontakte jan", "hvordan kontakter jeg jan", "ledige tider",
    ])
  ) {
    return {
      nextNodeId: pickIfAllowed(allowed, "HANDOFF_FORM", "GEN_HYPNO"),
      confidence: 0.92,
      reason: "direct contact or booking intent",
    }
  }

  // Ikke klar / blot info
  if (
    hasAny(t, [
      "ikke klar", "tænker over det", "bare info", "blot info", "overvejer",
      "send mig", "hør mere", "mere info", "holder mig opdateret",
      "skriv til mig", "mail mig", "email mig",
    ])
  ) {
    return {
      nextNodeId: pickIfAllowed(allowed, "LEAD_CAPTURE", "GEN_HYPNO"),
      confidence: 0.82,
      reason: "not ready — lead capture",
    }
  }

  // Passer det til mig / afklaring
  if (
    hasAny(t, [
      "passer det til mig", "er jeg det rigtige", "virker det for mig",
      "er jeg klar", "ved ikke om", "usikker på om", "kan det hjælpe mig",
      "hvad passer", "afklare om",
    ])
  ) {
    return {
      nextNodeId: pickIfAllowed(allowed, "PREQUALIFY", "GEN_HYPNO"),
      confidence: 0.80,
      reason: "fit-check request",
    }
  }

  return {
    nextNodeId: pickIfAllowed(allowed, "GEN_HYPNO"),
    confidence: 0.78,
    reason: "default to general hypnotherapy dialogue",
  }
}

export default homeRouterV1
