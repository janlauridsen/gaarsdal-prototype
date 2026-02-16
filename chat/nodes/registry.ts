// registry.ts
// NOTE: This version fixes two common runtime causes seen in your logs:
// 1) "meta domain not writable: triage.decision"  -> meta_domains_written must list DOMAINS, not keys.
// 2) "transition.to not allowed"                  -> TRIAGE can legitimately end in BOOKING (direct) in addition to TRIAGE_FIT_BOOKING,
//                                                    and we also keep explicit terminal exits.
//
// Assumption (explicit):
// - Your engine treats "meta domain" as the prefix before the first "." in a meta key
//   (e.g. "triage.decision" => domain "triage").
// - Your engine validates transition.to against node.allowed_exits.
//
// If your engine uses a different domain parsing rule (e.g. "triage.decision" as a domain itself),
// then you must change parseDomain(metaKey) server-side OR list exact domains accordingly.

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
  /**
   * IMPORTANT:
   * This must be a list of DOMAINS (e.g. "triage", "gen_hypno", "dialog", "memory_candidates").
   * Do NOT list individual meta keys here.
   */
  meta_domains_written: string[]
  capability_id?: string | null
  form?: FormSpec
  tool?: ToolSpec
  checkpoint?: CheckpointSpec
  router?: RouterSpec
}

const QUICK_CONTACTS: NodeId[] = ["HOME", "MAIL", "TLF", "CONTACT_FORM", "AKUT"]

/**
 * Shared meta domains used by multiple nodes.
 * Keep these aligned with whatever your server-side "writable meta domain" validator expects.
 */
const META_DOMAINS = {
  router: ["router"],
  genHypno: ["gen_hypno"],
  triage: ["triage", "dialog", "memory_candidates"],
  methodFit: ["method_fit"],
  form: ["form"],
  sandbox: ["sandbox", "checkpoint"],
} as const

const RAW_REGISTRY: Record<NodeId, Node> = Object.freeze({
  // ---------------- ROOT ----------------

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
      "ALCOHOL",
      "BOOKING",
      "DEV_SANDBOX_INTRO",
      "MAIL",
      "TLF",
      "AKUT",
      "CONTACT_FORM",
    ],
    router: {
      router_id: "home-router-v1",
      candidates: [
        "GEN_HYPNO",
        "TRIAGE",
        "METHOD_FIT",
        "ALCOHOL",
        "BOOKING",
        "DEV_SANDBOX_INTRO",
      ],
    },
    meta_domains_written: [...META_DOMAINS.router],
  },

  // ---------------- ALCOHOL DIALOG ----------------
  // Activation:
  // - From HOME: choose the alcohol icon/button (if you have one) or route via the HOME router.
  // - Or implement explicit transition chip "ALCOHOL" in UI and send EXPLICIT_TRANSITION:ALCOHOL.

  ALCOHOL: {
    id: "ALCOHOL",
    kind: "DIALOG",
    goal: "Alkohol - refleksion og støtte",
    message:
      "Fortæl kort om dit alkoholmønster (hvornår, hvor meget, hvad udløser det) og hvad du ønsker anderledes. " +
      "Jeg hjælper med refleksion, struktur og forslag til næste skridt—ikke behandling i chatten.",
    allow_free_text: true,
    allow_parentese: true,
    allowed_exits: ["ALCOHOL", "HOME", "BOOKING", ...QUICK_CONTACTS],
    capability_id: "alcohol-dialog-v1",
    // Adjust to what the capability writes (example domains)
    meta_domains_written: ["alcohol", "dialog", "memory_candidates"],
  },

  // ----------- DEV SANDBOX FLOW (FORM → TOOL → CHECKPOINT) -----------

  DEV_SANDBOX_INTRO: {
    id: "DEV_SANDBOX_INTRO",
    kind: "DIALOG",
    goal: "dev sandbox intro",
    message:
      "Sandbox-flow:\n\n" +
      "1) Udfyld en mini-form (key:value pr linje)\n" +
      "2) Systemet kører et TOOL (apply-form-to-track-v1)\n" +
      "3) Systemet kører CHECKPOINT\n\n" +
      "Skriv 'ok' for at gå videre til form.",
    allow_free_text: true,
    allow_parentese: false,
    allowed_exits: ["DEV_SANDBOX_FORM", "HOME"],
    capability_id: null,
    meta_domains_written: [],
  },

  DEV_SANDBOX_FORM: {
    id: "DEV_SANDBOX_FORM",
    kind: "FORM",
    goal: "dev sandbox form",
    message:
      "Udfyld form som key:value pr linje.\n\n" +
      "Eksempel:\n" +
      "topic: alkohol om aftenen\n" +
      "goal: drikke mindre\n" +
      "time_patterns: aftenen\n" +
      "situational_triggers: arbejdsstress\n" +
      "relational_patterns: familien\n" +
      "preferred_tone: rolig og direkte\n",
    allow_free_text: true,
    allow_parentese: false,
    allowed_exits: ["DEV_SANDBOX_FORM", "DEV_SANDBOX_TOOL_APPLY", "HOME"],
    form: {
      instructions: "Skriv key:value pr linje.",
      fields: [
        { id: "topic", label: "Topic", required: true, placeholder: "fx alkohol om aftenen" },
        { id: "goal", label: "Goal", required: true, placeholder: "fx drikke mindre" },
        { id: "time_patterns", label: "Time patterns", required: false, placeholder: "fx aftenen" },
        {
          id: "situational_triggers",
          label: "Situational triggers",
          required: false,
          placeholder: "fx arbejdsstress",
        },
        {
          id: "relational_patterns",
          label: "Relational patterns",
          required: false,
          placeholder: "fx familien",
        },
        { id: "preferred_tone", label: "Preferred tone", required: false, placeholder: "fx rolig og direkte" },
        { id: "support_direction", label: "Support direction", required: false, placeholder: "fx ro før jeg kommer hjem" },
        {
          id: "interest_in_methods",
          label: "Interest in methods",
          required: false,
          placeholder: "fx gåtur; pause; registrering",
        },
      ],
      on_submit_to: "DEV_SANDBOX_TOOL_APPLY",
      allow_partial: false,
    },
    meta_domains_written: [...META_DOMAINS.form],
  },

  DEV_SANDBOX_TOOL_APPLY: {
    id: "DEV_SANDBOX_TOOL_APPLY",
    kind: "TOOL",
    goal: "apply form to sandbox track",
    message: "System step: applying form to sandbox track…",
    allow_free_text: false,
    allow_parentese: false,
    allowed_exits: ["DEV_SANDBOX_CHECKPOINT", "DEV_SANDBOX_FORM", "HOME"],
    tool: {
      tool_id: "apply-form-to-track-v1",
      on_success_to: "DEV_SANDBOX_CHECKPOINT",
      on_error_to: "DEV_SANDBOX_FORM",
    },
    meta_domains_written: [...META_DOMAINS.sandbox],
  },

  DEV_SANDBOX_CHECKPOINT: {
    id: "DEV_SANDBOX_CHECKPOINT",
    kind: "CHECKPOINT",
    goal: "commit sandbox snapshot",
    message: "System step: checkpoint commit…",
    allow_free_text: false,
    allow_parentese: false,
    allowed_exits: ["DEV_SANDBOX_DONE", "HOME"],
    checkpoint: {
      on_done_to: "DEV_SANDBOX_DONE",
      commit_domains: [],
    },
    meta_domains_written: [...META_DOMAINS.sandbox],
  },

  DEV_SANDBOX_DONE: {
    id: "DEV_SANDBOX_DONE",
    kind: "TERMINAL",
    goal: "sandbox done",
    message:
      "Sandbox complete.\n\n" +
      "Du kan nu tjekke:\n" +
      "- /api/telemetry\n" +
      "- Redis profile (core + tracks)\n" +
      "- state.meta['form.last'] / state.meta['router.decision']\n\n" +
      "Vælg HOME for at fortsætte.",
    allow_free_text: false,
    allow_parentese: false,
    allowed_exits: ["HOME"],
    meta_domains_written: [],
  },

  // ---------------- EXISTING NODES ----------------

  GEN_HYPNO: {
    id: "GEN_HYPNO",
    kind: "DIALOG",
    goal: "Generelt om hypnoterapi",
    message:
      "Spørg mig om hypnoterapi: hvad det er, hvordan et forløb typisk foregår, hvad man ofte arbejder med, og hvad du kan forvente. Jeg deler viden og erfaring—ikke behandling i chatten.",
    allow_free_text: true,
    allow_parentese: true,
    allowed_exits: ["HOME", ...QUICK_CONTACTS],
    capability_id: "gen-hypno-v1",
    meta_domains_written: [...META_DOMAINS.genHypno],
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
      // allow staying
      "TRIAGE",
      // allow “result” nodes
      "TRIAGE_FIT_BOOKING",
      "TRIAGE_NOT_RELEVANT",
      "TRIAGE_NEEDS_ASSESSMENT",
      // IMPORTANT: allow direct booking too (prevents transition.to not allowed if model chooses BOOKING)
      "BOOKING",
      ...QUICK_CONTACTS,
    ],
    capability_id: "triage-relevance-v1",
    // DOMAINS (not keys)
    meta_domains_written: [...META_DOMAINS.triage],
  },

  METHOD_FIT: {
    id: "METHOD_FIT",
    kind: "DIALOG",
    goal: "Hypnoterapi eller et bedre alternativ?",
    message:
      "Fortæl kort hvad du vil opnå, og hvad der gør situationen svær lige nu. " +
      "Jeg kan hjælpe med at vurdere, om hypnoterapi er et godt match, eller om andre tilgange typisk passer bedre. " +
      "Jeg giver kun overblik—ikke behandling i chatten.",
    allow_free_text: true,
    allow_parentese: true,
    allowed_exits: ["HOME", "BOOKING", ...QUICK_CONTACTS],
    capability_id: "method-fit-v1",
    meta_domains_written: [...META_DOMAINS.methodFit],
  },

  TRIAGE_FIT_BOOKING: {
    id: "TRIAGE_FIT_BOOKING",
    kind: "TERMINAL",
    goal: "Egnet til booking",
    message: "Foreløbig triage: dit tema virker relevant for hypnoterapi. Næste skridt er booking.",
    allow_free_text: false,
    allow_parentese: false,
    allowed_exits: ["BOOKING", ...QUICK_CONTACTS],
    meta_domains_written: [...META_DOMAINS.triage],
  },

  TRIAGE_NOT_RELEVANT: {
    id: "TRIAGE_NOT_RELEVANT",
    kind: "TERMINAL",
    goal: "Ikke relevant",
    message:
      "Foreløbig triage: det lyder ikke som et klassisk hypnoterapi-spor. Vi anbefaler afklaring af anden støtte.",
    allow_free_text: false,
    allow_parentese: false,
    allowed_exits: [...QUICK_CONTACTS],
    meta_domains_written: [...META_DOMAINS.triage],
  },

  TRIAGE_NEEDS_ASSESSMENT: {
    id: "TRIAGE_NEEDS_ASSESSMENT",
    kind: "TERMINAL",
    goal: "Kræver afklaringssamtale",
    message: "Foreløbig triage: der er stadig uklarheder. Start med en afklaringssamtale.",
    allow_free_text: false,
    allow_parentese: false,
    allowed_exits: [...QUICK_CONTACTS],
    meta_domains_written: [...META_DOMAINS.triage],
  },

  BOOKING: {
    id: "BOOKING",
    kind: "MENU",
    goal: "Booking",
    message: "Der er ikke et bookingsystem. Du kan booke tid via telefon/sms, e-mail eller kontaktformular.",
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
    allowed_exits: [...QUICK_CONTACTS],
    meta_domains_written: [],
  },

  TLF: {
    id: "TLF",
    kind: "TERMINAL",
    goal: "Telefon kontakt",
    message: "Du kan ringe eller sende sms til 42 80 74 74. Jeg svarer, så snart jeg kan.",
    allow_free_text: false,
    allow_parentese: false,
    allowed_exits: [...QUICK_CONTACTS],
    meta_domains_written: [],
  },

  CONTACT_FORM: {
    id: "CONTACT_FORM",
    kind: "TERMINAL",
    goal: "Kontaktformular",
    message: "Du kan bruge kontaktformularen på /kontakt, hvis du ikke ønsker mail, telefon eller sms.",
    allow_free_text: false,
    allow_parentese: false,
    allowed_exits: [...QUICK_CONTACTS],
    meta_domains_written: [],
  },

  AKUT: {
    id: "AKUT",
    kind: "TERMINAL",
    goal: "Akut",
    message:
      "Akut hjælp i Danmark: Ring 112 ved livstruende situationer. Voksne: Livslinien 70 201 201 (døgnåben). " +
      "Børn og unge: BørneTelefonen 116 111. Psykiatrisk akutmodtagelse kan kontaktes via 1813 (Region Hovedstaden) eller din region.",
    allow_free_text: false,
    allow_parentese: false,
    allowed_exits: [...QUICK_CONTACTS],
    meta_domains_written: [],
  },
})

const REGISTRY: Record<NodeId, Readonly<Node>> = Object.freeze(
  Object.fromEntries(Object.entries(RAW_REGISTRY).map(([k, v]) => [k, Object.freeze(v)]))
)

export function getNode(id: NodeId): Readonly<Node> {
  const node = REGISTRY[id]
  if (!node) throw new Error(`unknown node: ${id}`)
  return node
}

/**
 * Optional: run once at startup in dev to catch registry mistakes early.
 * - Ensures exits refer to existing nodes
 * - Ensures meta_domains_written looks like domains (no dots)
 */
export function validateRegistry(): void {
  const ids = new Set(Object.keys(REGISTRY))

  for (const [id, node] of Object.entries(REGISTRY)) {
    for (const to of node.allowed_exits) {
      if (!ids.has(to)) {
        throw new Error(`Node ${id} has allowed_exit -> ${to}, but ${to} is not in registry`)
      }
    }
    for (const d of node.meta_domains_written) {
      if (d.includes(".")) {
        throw new Error(
          `Node ${id} meta_domains_written contains "${d}" (looks like a key). Use domains like "triage" not "triage.decision".`
        )
      }
    }
  }
}
