type NodeId = string

type Node = {
  id: NodeId
  kind: "MENU" | "DIALOG" | "TERMINAL"
  goal: string
  allowed_exits: NodeId[]
  meta_domains_written: string[]
}

const QUICK_CONTACTS: NodeId[] = ["HOME", "MAIL", "TLF", "AKUT"]

const RAW_REGISTRY: Record<NodeId, Node> = {
  HOME: {
    id: "HOME",
    kind: "MENU",
    goal: "root",
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
    allowed_exits: ["HOME", "MAIL", "TLF", "AKUT"],
    meta_domains_written: [],
  },

  TRIAGE: {
    id: "TRIAGE",
    kind: "DIALOG",
    goal: "Triage",
    allowed_exits: ["HOME", "MAIL", "TLF", "AKUT"],
    meta_domains_written: [],
  },

  BOOKING: {
    id: "BOOKING",
    kind: "MENU",
    goal: "Booking",
    allowed_exits: ["MAIL", "TLF", "HOME", "AKUT"],
    meta_domains_written: [],
  },

  MAIL: {
    id: "MAIL",
    kind: "TERMINAL",
    goal: "Mail kontakt",
    allowed_exits: QUICK_CONTACTS,
    meta_domains_written: [],
  },

  TLF: {
    id: "TLF",
    kind: "TERMINAL",
    goal: "Telefon kontakt",
    allowed_exits: QUICK_CONTACTS,
    meta_domains_written: [],
  },

  AKUT: {
    id: "AKUT",
    kind: "TERMINAL",
    goal: "Akut",
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
