type NodeId = string

type RouteDecision = {
  chosen: NodeId
  confidence: number
  reason: string
}

function normalize(text: string): string {
  return text.toLowerCase().trim()
}

export function routeHome(userText: string): RouteDecision {
  const t = normalize(userText)

  if (!t) {
    return {
      chosen: "GEN_HYPNO",
      confidence: 0.6,
      reason: "empty input defaults to general conversation",
    }
  }

  if (
    t.includes("book") ||
    t.includes("booking") ||
    t.includes("bestille tid") ||
    t.includes("kontakt") ||
    t.includes("mail") ||
    t.includes("telefon") ||
    t.includes("ringe") ||
    t.includes("sms")
  ) {
    return {
      chosen: "BOOKING",
      confidence: 0.85,
      reason: "contact or booking intent",
    }
  }

  if (
    t.includes("passer hypnoterapi") ||
    t.includes("er hypnoterapi relevant") ||
    t.includes("god metode") ||
    t.includes("hvilken metode") ||
    t.includes("bedre alternativ")
  ) {
    return {
      chosen: "METHOD_FIT",
      confidence: 0.8,
      reason: "method-fit intent",
    }
  }

  if (
    t.includes("refleksion") ||
    t.includes("forstå mig selv") ||
    t.includes("mønster") ||
    t.includes("klarhed")
  ) {
    return {
      chosen: "REFLECTION",
      confidence: 0.7,
      reason: "reflection intent",
    }
  }

  return {
    chosen: "GEN_HYPNO",
    confidence: 0.7,
    reason: "default to general hypnotist conversation",
  }
}
