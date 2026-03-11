import type { NodeId } from "../../nodes/registry"

export type RouteDecision = {
  chosen: NodeId
  confidence: number
  reason: string
}

type HomeRouterInput =
  | string
  | {
      userText?: string | null
    }

function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, " ")
}

function readUserText(input: HomeRouterInput): string {
  if (typeof input === "string") return input
  return input?.userText ?? ""
}

function hasAny(text: string, needles: string[]): boolean {
  return needles.some((needle) => text.includes(needle))
}

/**
 * HOME router policy
 *
 * Design:
 * - TRIAGE bruges ikke længere fra HOME.
 * - Default går til GEN_HYPNO.
 * - BOOKING vælges kun ved tydelig kontakt-/bookingsignal.
 * - METHOD_FIT vælges kun ved tydeligt metode-/matchsignal.
 * - REFLECTION vælges kun ved tydeligt refleksionssignal.
 */
export function homeRouterV1(input: HomeRouterInput): RouteDecision {
  const raw = readUserText(input)
  const t = normalize(raw)

  if (!t) {
    return {
      chosen: "GEN_HYPNO",
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
      chosen: "AKUT",
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
      chosen: "BOOKING",
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
      chosen: "METHOD_FIT",
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
      chosen: "REFLECTION",
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
      chosen: "DEV_SANDBOX_INTRO",
      confidence: 0.95,
      reason: "developer sandbox intent",
    }
  }

  return {
    chosen: "GEN_HYPNO",
    confidence: 0.78,
    reason: "default to general hypnotherapy dialogue instead of triage",
  }
}

export const routeHome = homeRouterV1
export default homeRouterV1
