type NodeId = string

type Node = {
  id: NodeId
  kind: "MENU" | "DIALOG" | "TERMINAL"
  goal: string
  message: string
  allow_free_text: boolean
  allow_parentese: boolean
  allowed_exits: NodeId[]
  meta_domains_written: string[]
}

const QUICK_CONTACTS: NodeId[] = ["HOME", "MAIL", "TLF", "AKUT"]

const RAW_REGISTRY: Record<NodeId, Node> = {
  HOME: {
    id: "HOME",
    kind: "MENU",
    goal: "root",
    message: "Velkommen. Vælg et emne eller skriv frit.",
    allow_free_text: true,
    allow_parentese: false,
    allowed_exits: [
      "GEN_HYPNO",
      "TRIAGE",
      "BOOKING",
      "MAIL",
      "TLF",
      "AKUT",
    ],
    meta_domains_written: [],
  },

  GEN_HYPNO: {
    id: "GEN_HYPNO",
    kind: "DIALOG",
    goal: "Generelt om hypnoterapi",
    message: "Generel information om hypnoterapi.",
    allow_free_text: true,
    allow_parentese: true,
    allowed_exits: ["HOME", "MAIL", "TLF", "AKUT"],
    meta_domains_written: [],
  },

  TRIAGE: {
    id: "TRIAGE",
    kind: "DIALOG",
    goal: "Triage intro",
    message: "Kort triage: 3 hurtige spørgsmål for at finde næste skridt.",
    allow_free_text: true,
    allow_parentese: true,
    allowed_exits: ["TRIAGE_GOAL", "HOME", "MAIL", "TLF", "AKUT"],
    meta_domains_written: [],
  },

  TRIAGE_GOAL: {
    id: "TRIAGE_GOAL",
    kind: "DIALOG",
    goal: "Mål for forløb",
    message: "Er dit mål at arbejde med vaner, stress eller uro (ikke akut)?",
    allow_free_text: true,
    allow_parentese: true,
    allowed_exits: ["TRIAGE_READY", "TRIAGE_NEEDS_ASSESSMENT", ...QUICK_CONTACTS],
    meta_domains_written: ["triage.presenting_issue"],
  },

  TRIAGE_READY: {
    id: "TRIAGE_READY",
    kind: "DIALOG",
    goal: "Parathed",
    message: "Er du klar til et struktureret forløb over flere sessioner?",
    allow_free_text: true,
    allow_parentese: true,
    allowed_exits: ["TRIAGE_FIT_BOOKING", "TRIAGE_NEEDS_ASSESSMENT", ...QUICK_CONTACTS],
    meta_domains_written: ["triage.intensity"],
  },

  TRIAGE_FIT_BOOKING: {
    id: "TRIAGE_FIT_BOOKING",
    kind: "TERMINAL",
    goal: "Egnet til booking",
    message: "Foreløbig triage: det ser relevant ud. Næste skridt er booking.",
    allow_free_text: false,
    allow_parentese: false,
    allowed_exits: ["BOOKING", ...QUICK_CONTACTS],
    meta_domains_written: ["triage.outcome", "triage.next_step"],
  },

  TRIAGE_NEEDS_ASSESSMENT: {
    id: "TRIAGE_NEEDS_ASSESSMENT",
    kind: "TERMINAL",
    goal: "Kræver afklaringssamtale",
    message: "Foreløbig triage: start med en afklaringssamtale.",
    allow_free_text: false,
    allow_parentese: false,
    allowed_exits: QUICK_CONTACTS,
    meta_domains_written: ["triage.outcome", "triage.next_step"],
  },

  BOOKING: {
    id: "BOOKING",
    kind: "MENU",
    goal: "Booking",
    message: "Her kan du vælge kontaktvej for booking.",
    allow_free_text: false,
    allow_parentese: false,
    allowed_exits: ["MAIL", "TLF", "HOME", "AKUT"],
    meta_domains_written: [],
  },

  MAIL: {
    id: "MAIL",
    kind: "TERMINAL",
    goal: "Mail kontakt",
    message: "Du kan kontakte os via e-mail.",
    allow_free_text: false,
    allow_parentese: false,
    allowed_exits: QUICK_CONTACTS,
    meta_domains_written: [],
  },

  TLF: {
    id: "TLF",
    kind: "TERMINAL",
    goal: "Telefon kontakt",
    message: "Du kan kontakte os telefonisk.",
    allow_free_text: false,
    allow_parentese: false,
    allowed_exits: QUICK_CONTACTS,
    meta_domains_written: [],
  },

  AKUT: {
    id: "AKUT",
    kind: "TERMINAL",
    goal: "Akut",
    message: "Hvis det haster, skal du kontakte akut hjælp med det samme.",
    allow_free_text: false,
    allow_parentese: false,
    allowed_exits: QUICK_CONTACTS,
    meta_domains_written: [],
  },
}

const REGISTRY: Record<NodeId, Readonly<Node>> = Object.freeze(
  Object.fromEntries(
    Object.entries(RAW_REGISTRY).map(([k, v]) => [
      k,
      Object.freeze(v),
    ])
  )
)

export function getNode(id: NodeId): Readonly<Node> {
  const node = REGISTRY[id]
  if (!node) throw new Error(`unknown node: ${id}`)
  return node
}
