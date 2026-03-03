// chat/methodFit/methodRegistry.ts
// Version: 2026-02-23
// Purpose: Node-local seed list of known methods (DK-available). Not shared state.

import type { EvidenceTier, MethodFormat, ProblemTag, RiskTier } from "./taxonomy"

export type KnownMethod = {
  id: string
  label: string
  formats: MethodFormat[]
  targets: ProblemTag[]
  evidence_tier: EvidenceTier
  risk_tier: RiskTier
  // Optional synonyms used to resolve user/LLM naming into known ids.
  synonyms?: string[]
}

// IMPORTANT:
// - This is a seed list only.
// - It is not persisted globally.
// - It is safe under the "thread purity" principle.
export const KNOWN_METHODS: KnownMethod[] = [
  {
    id: "acupuncture",
    label: "Akupunktur",
    formats: ["needles"],
    targets: ["pain_msk", "stress", "sleep"],
    evidence_tier: "mixed",
    risk_tier: "low",
    synonyms: ["akupunktur", "nåle", "acupuncture"],
  },
  {
    id: "reflexology",
    label: "Zoneterapi",
    formats: ["touch"],
    targets: ["stress", "sleep", "pain_msk"],
    evidence_tier: "limited",
    risk_tier: "low",
    synonyms: ["zoneterapi", "refleksologi", "reflexology"],
  },
  {
    id: "massage",
    label: "Massage / manuel kropsbehandling",
    formats: ["touch"],
    targets: ["pain_msk", "stress", "sleep"],
    evidence_tier: "moderate",
    risk_tier: "low",
    synonyms: ["massage", "massør", "manuel", "kropsbehandling", "bodywork"],
  },
  {
    id: "craniosacral",
    label: "Kraniosakral terapi",
    formats: ["touch"],
    targets: ["stress", "sleep", "pain_msk"],
    evidence_tier: "limited",
    risk_tier: "low",
    synonyms: ["kranio", "kraniosakral", "craniosacral"],
  },
  {
    id: "osteopathy",
    label: "Osteopati",
    formats: ["touch"],
    targets: ["pain_msk"],
    evidence_tier: "mixed",
    risk_tier: "low",
    synonyms: ["osteopati", "osteopathy"],
  },
  {
    id: "herbal",
    label: "Urtemedicin / naturopati (kosttilskud)",
    formats: ["ingestible"],
    targets: ["stress", "sleep", "digestive", "energy_fatigue"],
    evidence_tier: "mixed",
    risk_tier: "medium",
    synonyms: ["urter", "urtemedicin", "naturopati", "kosttilskud", "herbal"],
  },
  {
    id: "mindfulness",
    label: "Mindfulness / meditation",
    formats: ["self_practice"],
    targets: ["stress", "sleep", "anxiety"],
    evidence_tier: "moderate",
    risk_tier: "low",
    synonyms: ["mindfulness", "meditation", "meditere"],
  },
  {
    id: "yoga_breath",
    label: "Yoga / åndedrætspraksis",
    formats: ["self_practice"],
    targets: ["stress", "sleep", "pain_msk", "anxiety"],
    evidence_tier: "moderate",
    risk_tier: "low",
    synonyms: ["yoga", "åndedræt", "vejrtrækning", "breathwork"],
  },
  {
    id: "reiki",
    label: "Reiki / healing",
    formats: ["energy"],
    targets: ["stress", "sleep", "grief_loss"],
    evidence_tier: "experiential",
    risk_tier: "low",
    synonyms: ["reiki", "healing"],
  },
  {
    id: "eft",
    label: "EFT / tapping",
    formats: ["self_practice"],
    targets: ["stress", "anxiety", "habit"],
    evidence_tier: "mixed",
    risk_tier: "low",
    synonyms: ["eft", "tapping", "bankeøvelser"],
  },

  // A few additional, common DK-available non-spiritual options (still node-local seed)
  {
    id: "breath_therapy",
    label: "Åndedrætstræning (breath coaching)",
    formats: ["self_practice", "talk"],
    targets: ["stress", "anxiety", "sleep"],
    evidence_tier: "mixed",
    risk_tier: "low",
    synonyms: ["åndedrætstræning", "breath coaching", "respiration"],
  },
  {
    id: "somatic",
    label: "Somatisk samtale/kropsorienteret terapi",
    formats: ["talk"],
    targets: ["stress", "trauma", "anxiety"],
    evidence_tier: "mixed",
    risk_tier: "low",
    synonyms: ["somatisk", "kropsorienteret", "somatic"],
  },
]

export const KNOWN_METHODS_BY_ID: Record<string, KnownMethod> = Object.fromEntries(
  KNOWN_METHODS.map((m) => [m.id, m])
)

export function normalizeMethodName(name: string): string {
  return String(name ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9æøå\s-]/g, "")
}

export function resolveKnownMethodId(raw: string): string | null {
  const n = normalizeMethodName(raw)
  if (!n) return null

  // direct id hit
  if (KNOWN_METHODS_BY_ID[n]) return n

  // synonym hit
  for (const m of KNOWN_METHODS) {
    const syns = m.synonyms ?? []
    for (const s of syns) {
      if (normalizeMethodName(s) === n) return m.id
    }
  }
  return null
}
