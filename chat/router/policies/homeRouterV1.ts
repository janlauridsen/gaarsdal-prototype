type RouteNodeId =
  | "GEN_HYPNO"
  | "METHOD_FIT"
  | "REFLECTION"
  | "BOOKING"
  | "DEV_SANDBOX_INTRO"
  | "AKUT"
  | "HOME"

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
  if (allowed.has("METHOD_FIT")) return "METHOD_FIT"
  if (allowed.has("REFLECTION")) return "REFLECTION"
  if (allowed.has("DEV_SANDBOX_INTRO")) return "DEV_SANDBOX_INTRO"
  if (allowed.has("AKUT")) return "AKUT"
  if (allowed.has("HOME")) return "HOME"

  return fallback
}

/**
 * HOME router policy
 *
 * TRIAGE bruges ikke længere fra HOME.
 * Default går til GEN_HYPNO.
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

  if (
    hasAny(t, [
      "passer hypnoterapi",
      "er hypnoterapi noget for mig",
      "er hypnose noget for mig",
      "vil hypnoterapi hjælpe",
      "hvilken metode",
      "bedste metode",
      "god metode",
      "alternativ til hypnoterapi",
      "hypnoterapi eller",
      "metode",
      "method fit",
      "match",
    ])
  ) {
    return {
      nextNodeId: pickIfAllowed(allowed, "METHOD_FIT", "GEN_HYPNO"),
      confidence: 0.84,
      reason: "clear method-fit intent",
    }
  }

  if (
    hasAny(t, [
      "refleksion",
      "reflektere",
      "forstå mig selv",
      "forstå mønster",
      "forstå mine mønstre",
      "klarhed",
      "meningsskabelse",
      "undersøge mønster",
    ])
  ) {
    return {
      nextNodeId: pickIfAllowed(allowed, "REFLECTION", "GEN_HYPNO"),
      confidence: 0.8,
      reason: "clear reflection intent",
    }
  }

  if (
    hasAny(t, [
      "sandbox",
      "dev sandbox",
      "test flow",
      "udviklerflow",
      "debug flow",
    ])
  ) {
    return {
      nextNodeId: pickIfAllowed(allowed, "DEV_SANDBOX_INTRO", "GEN_HYPNO"),
      confidence: 0.95,
      reason: "developer sandbox intent",
    }
  }

  return {
    nextNodeId: pickIfAllowed(allowed, "GEN_HYPNO"),
    confidence: 0.78,
    reason: "default to general hypnotherapy dialogue instead of triage",
  }
}

export default homeRouterV1
