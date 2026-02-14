export type HomeRouterDecision = {
  nextNodeId: string
  confidence: number
  reason: string
}

function norm(s: string): string {
  return s.toLowerCase().trim()
}

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((n) => haystack.includes(n))
}

/**
 * Deterministic, low-risk router for the "HOME" node.
 * Uses simple keyword matching. No LLM in PR2 foundation router.
 *
 * Candidates expected (typical):
 * - GEN_HYPNO
 * - TRIAGE
 * - METHOD_FIT
 * - BOOKING
 *
 * If no match: defaults to TRIAGE (screening) when present.
 */
export function homeRouterV1(params: {
  userText: string
  candidates: string[]
}): HomeRouterDecision {
  const text = norm(params.userText)
  const candidates = params.candidates

  if (!text) {
    return {
      nextNodeId: candidates[0] ?? "HOME",
      confidence: 0,
      reason: "empty input",
    }
  }

  // Booking/contact intent
  if (
    includesAny(text, [
      "booking",
      "book",
      "tid",
      "aftale",
      "pris",
      "kontakt",
      "mail",
      "e-mail",
      "email",
      "telefon",
      "sms",
    ])
  ) {
    if (candidates.includes("BOOKING")) {
      return { nextNodeId: "BOOKING", confidence: 0.7, reason: "booking/contact keywords" }
    }
  }

  // Hypno info intent
  if (includesAny(text, ["hypnose", "hypno", "hypnoterapi", "trance"])) {
    if (candidates.includes("GEN_HYPNO")) {
      return { nextNodeId: "GEN_HYPNO", confidence: 0.7, reason: "hypno keywords" }
    }
  }

  // Method fit intent
  if (includesAny(text, ["passer", "relevant", "metode", "alternativ", "hvilken tilgang", "hvad bør jeg"])) {
    if (candidates.includes("METHOD_FIT")) {
      return { nextNodeId: "METHOD_FIT", confidence: 0.6, reason: "method-fit keywords" }
    }
  }

  // Default to screening/triage if present
  if (candidates.includes("TRIAGE")) {
    return { nextNodeId: "TRIAGE", confidence: 0.45, reason: "default to screening" }
  }

  // Fallback to first candidate
  return {
    nextNodeId: candidates[0] ?? "HOME",
    confidence: 0.2,
    reason: "fallback to first candidate",
  }
}
