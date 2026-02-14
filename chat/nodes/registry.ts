type NodeId = string

export type NodeKind =
  | "MENU"
  | "DIALOG"
  | "FORM"
  | "TOOL"
  | "CHECKPOINT"
  | "ROUTER"
  | "TERMINAL"

export type FormField = {
  id: string
  label: string
  required?: boolean
  kind?: "text" | "number" | "choice"
  choices?: string[]
  placeholder?: string
}

export type FormSpec = {
  instructions?: string
  fields: FormField[]
  on_submit_to: NodeId
  allow_partial?: boolean
}

export type ToolSpec = {
  tool_id: string
  on_success_to: NodeId
  on_error_to?: NodeId
}

export type CheckpointSpec = {
  on_done_to: NodeId
  commit_domains?: string[]
}

export type RouterSpec = {
  router_id: string
  candidates?: NodeId[]
}

export type Node = {
  id: NodeId
  kind: NodeKind
  goal: string
  message: string
  allow_free_text: boolean
  allow_parentese: boolean
  allowed_exits: NodeId[]
  meta_domains_written: string[]
  capability_id?: string | null
  form?: FormSpec
  tool?: ToolSpec
  checkpoint?: CheckpointSpec
  router?: RouterSpec
}

const QUICK_CONTACTS: NodeId[] = [
  "HOME",
  "MAIL",
  "TLF",
  "CONTACT_FORM",
  "AKUT",
]

const RAW_REGISTRY: Record<NodeId, Node> = {
  HOME: {
    id: "HOME",
    kind: "ROUTER",
    goal: "root",
    message: "Velkommen. Vælg et emne eller skriv frit.",
    allow_free_text: true,
    allow_parentese: false,
    allowed_exits: [
      "GEN_HYPNO",
      "TRIAGE",
      "METHOD_FIT",
      "BOOKING",
      "MAIL",
      "TLF",
      "AKUT",
    ],
    router: {
      router_id: "home-router-v1",
      candidates: ["GEN_HYPNO", "TRIAGE", "METHOD_FIT", "BOOKING"],
    },
    meta_domains_written: ["router.decision"],
  },

  GEN_HYPNO: {
    id: "GEN_HYPNO",
    kind: "DIALOG",
    goal: "Generelt om hypnoterapi",
    message:
      "Spørg mig om hypnoterapi: hvad det er, hvordan et forløb typisk foregår, hvad man ofte arbejder med, og hvad du kan forvente. Jeg deler viden og erfaring—ikke behandling i chatten.",
    allow_free_text: true,
    allow_parentese: true,
    allowed_exits: ["HOME", "MAIL", "TLF", "AKUT"],
    capability_id: "gen-hypno-v1",
    meta_domains_written: ["gen_hypno.transcript", "gen_hypno.last_topic"],
  },

  TRIAGE: {
    id: "TRIAGE",
    kind: "DIALOG",
    goal: "Passer hypnoterapi til min situation?",
    message:
      "Fortæl kort om din situation og hvad du ønsker anderledes. Jeg stiller få opklarende spørgsmål og vurderer, om hypnoterapi typisk vil være relevant.",
    allow_free_text: true,
    allow_parentese: true,
    allowed_exits: [
      "TRIAGE",
      "TRIAGE_FIT_BOOKING",
      "TRIAGE_NOT_RELEVANT",
      "TRIAGE_NEEDS_ASSESSMENT",
      ...QUICK_CONTACTS,
    ],
    capability_id: "triage-relevance-v1",
    meta_domains_written: [
      "triage.question_count",
      "triage.outcome",
      "triage.summary",
      "triage.unclear_points",
      "triage.topic_tags",
      "triage.user_goal",
      "triage.key_triggers",
      "triage.time_horizon",
      "triage.confidence",
      "triage.next_state",
      "triage.notes_for_context",
      "triage.next_question",
      "triage.chips",
      "triage.transcript",
    ],
  },

  METHOD_FIT: {
    id: "METHOD_FIT",
    kind: "DIALOG",
    goal: "Hypnoterapi eller et bedre alternativ?",
    message:
      "Fortæl kort hvad du vil opnå, og hvad der gør situationen svær lige nu. Jeg kan hjælpe med at vurdere, om hypnoterapi er et godt match, eller om andre tilgange typisk passer bedre. Jeg giver kun overblik—ikke behandling i chatten.",
    allow_free_text: true,
    allow_parentese: true,
    allowed_exits: ["HOME", "BOOKING", ...QUICK_CONTACTS],
    capability_id: "method-fit-v1",
    meta_domains_written: ["method_fit.transcript", "method_fit.summary"],
  },

  TRIAGE_FIT_BOOKING: {
    id: "TRIAGE_FIT_BOOKING",
    kind: "TERMINAL",
    goal: "Egnet til booking",
    message:
      "Foreløbig triage: dit tema virker relevant for hypnoterapi. Næste skridt er booking.",
    allow_free_text: false,
    allow_parentese: false,
    allowed_exits: ["BOOKING", ...QUICK_CONTACTS],
    meta_domains_written: ["triage.outcome", "triage.summary", "triage.unclear_points"],
  },

  TRIAGE_NOT_RELEVANT: {
    id: "TRIAGE_NOT_RELEVANT",
    kind: "TERMINAL",
    goal: "Ikke relevant",
    message:
      "Foreløbig triage: det lyder ikke som et klassisk hypnoterapi-spor. Vi anbefaler afklaring af anden støtte.",
    allow_free_text: false,
    allow_parentese: false,
    allowed_exits: QUICK_CONTACTS,
    meta_domains_written: ["triage.outcome", "triage.summary", "triage.unclear_points"],
  },

  TRIAGE_NEEDS_ASSESSMENT: {
    id: "TRIAGE_NEEDS_ASSESSMENT",
    kind: "TERMINAL",
    goal: "Kræver afklaringssamtale",
    message:
      "Foreløbig triage: der er stadig uklarheder. Start med en afklaringssamtale.",
    allow_free_text: false,
    allow_parentese: false,
    allowed_exits: QUICK_CONTACTS,
    meta_domains_written: ["triage.outcome", "triage.summary", "triage.unclear_points"],
  },

  BOOKING: {
    id: "BOOKING",
    kind: "MENU",
    goal: "Booking",
    message: "Her kan du vælge kontaktvej for booking.",
    allow_free_text: false,
    allow_parentese: false,
    allowed_exits: ["MAIL", "TLF", "CONTACT_FORM", "HOME", "AKUT"],
    meta_domains_written: [],
  },

  MAIL: {
    id: "MAIL",
    kind: "TERMINAL",
    goal: "Mail kontakt",
    message: "Du kan kontakte mig via e-mail på jan@gaarsdal.net.",
    allow_free_text: false,
    allow_parentese: false,
    allowed_exits: QUICK_CONTACTS,
    meta_domains_written: [],
  },

  TLF: {
    id: "TLF",
    kind: "TERMINAL",
    goal: "Telefon kontakt",
    message:
      "Du kan ringe eller sende sms til 42 80 74 74. Jeg svarer, så snart jeg kan.",
    allow_free_text: false,
    allow_parentese: false,
    allowed_exits: QUICK_CONTACTS,
    meta_domains_written: [],
  },

  CONTACT_FORM: {
    id: "CONTACT_FORM",
    kind: "TERMINAL",
    goal: "Kontaktformular",
    message:
      "Du kan bruge kontaktformularen på /kontakt, hvis du ikke ønsker mail, telefon eller sms.",
    allow_free_text: false,
    allow_parentese: false,
    allowed_exits: QUICK_CONTACTS,
    meta_domains_written: [],
  },

  AKUT: {
    id: "AKUT",
    kind: "TERMINAL",
    goal: "Akut",
    message:
      "Akut hjælp i Danmark: Ring 112 ved livstruende situationer. Voksne: Livslinien 70 201 201 (døgnåben). Børn og unge: BørneTelefonen 116 111. Psykiatrisk akutmodtagelse kan kontaktes via 1813 (Region Hovedstaden) eller din region.",
    allow_free_text: false,
    allow_parentese: false,
    allowed_exits: QUICK_CONTACTS,
    meta_domains_written: [],
  },
}

const REGISTRY: Record<NodeId, Readonly<Node>> = Object.freeze(
  Object.fromEntries(
    Object.entries(RAW_REGISTRY).map(([k, v]) => [k, Object.freeze(v)])
  )
)

export function getNode(id: NodeId): Readonly<Node> {
  const node = REGISTRY[id]
  if (!node) throw new Error(`unknown node: ${id}`)
  return node
}
