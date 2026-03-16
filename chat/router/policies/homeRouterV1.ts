type RouteNodeId = "GEN_HYPNO" | "BOOKING" | "AKUT" | "HOME"

export type RouteDecision = {
  nextNodeId: RouteNodeId
  confidence: number
  reason: string
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

/**
 * HOME router policy for the current narrow runtime.
 *
 * Allowed runtime targets:
 * - GEN_HYPNO
 * - BOOKING
 * - AKUT (UI utility label only; if not allowed it falls back safely)
 * - HOME
 */
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

  if (
    hasAny(t, [
      "akut",
      "krise",
      "fare",
      "selvmord",
      "selvskade",
      "112",
      "lægevagt",
      "psykiatrisk akut",
    ])
  ) {
    return {
      nextNodeId: pickIfAllowed(allowed, "AKUT", "GEN_HYPNO"),
      confidence: 0.95,
      reason: "acute help intent",
    }
  }

  if (
    hasAny(t, [
      "book",
      "booking",
      "bestil",
      "bestille",
      "booke",
      "tid",
      "kontakt",
      "kontakt mig",
      "kontakt jan",
      "mail",
      "email",
      "e-mail",
      "telefon",
      "telefonnummer",
      "ring",
      "ringe",
      "sms",
      "skriv til jan",
      "jeg vil tale med jan",
      "jeg vil i dialog med jan",
      "jeg vil gerne tale med jan",
      "jeg vil gerne i dialog med jan",
      "jeg vil gerne ringe til jan",
      "kan jeg kontakte jan",
      "hvordan kontakter jeg jan",
    ])
  ) {
    return {
      nextNodeId: pickIfAllowed(allowed, "BOOKING", "GEN_HYPNO"),
      confidence: 0.92,
      reason: "clear contact or booking intent",
    }
  }

  return {
    nextNodeId: pickIfAllowed(allowed, "GEN_HYPNO"),
    confidence: 0.78,
    reason: "default to general hypnotherapy dialogue",
  }
}

export default homeRouterV1
