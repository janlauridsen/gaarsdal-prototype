// registry.ts
// Version: 2026-02-16T00:00:00Z
// Notes:
// - Fix: allow TRIAGE to write meta keys used by triage-relevance-v1 (triage.decision, triage.render, triage.relevance).
// - Fix: widen TRIAGE allowed exits to include nodes the capability may choose (METHOD_FIT, GEN_HYPNO, BOOKING)
//        to avoid "transition.to not allowed" when the model routes to a non-listed node.
// Global actions are available from anywhere via engine-level global exits.
// Only HOME should show them as visible chips by default.

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
  // NOTE: repo currently uses a navigation field on some MENU nodes.
  // Keep it as 'any' here to avoid registry typing drift if present elsewhere.
  navigation?: any
}

// Chips shown on HOME (menu).
const QUICK_CONTACTS: NodeId[] = ["MAIL", "TLF", "CONTACT_FORM", "AKUT"]

// Exits shown inside a parentese overlay.
const PARENTESE_EXITS: NodeId[] = ["RESUME", "HOME"]

const RAW_REGISTRY: Record<NodeId, Node> = Object.freeze({
  // ----------- LOBBY / PROFILE / THREADS (V23.1) -----------

  PROFILE_BOOTSTRAP: {
    id: "PROFILE_BOOTSTRAP",
    kind: "TOOL",
    goal: "bootstrap profile + thread index",
    message: "System step: loader profil og tråde…",
    allow_free_text: false,
    allow_parentese: false,
    allowed_exits: ["THREAD_CHOOSER"],
    tool: {
      tool_id: "profile-bootstrap-v1",
      on_success_to: "THREAD_CHOOSER",
      on_error_to: "THREAD_CHOOSER",
    },
    meta_domains_written: ["ux", "profile.status",
      "profile.last_seen_at",
      "threads.count",
      "threads.active",
      "threads.choices",],
  },

  THREAD_CHOOSER: {
    id: "THREAD_CHOOSER",
    kind: "TOOL",
    goal: "choose thread or start new",
    message:
      "Vælg en tråd:\n" +
      "- Tryk 'Fortsæt' for at fortsætte seneste\n" +
      "- Tryk 'Start ny tråd' for at starte på en frisk\n" +
      "- Eller vælg en eksisterende tråd\n\n" +
      "Du kan også skrive: continue / new.",
    allow_free_text: true,
    allow_parentese: false,
    allowed_exits: ["THREAD_CHOOSER", "HOME"],
    tool: {
      tool_id: "thread-switch-v1",
      on_success_to: "HOME",
      on_error_to: "THREAD_CHOOSER",
    },
    meta_domains_written: ["ux", "threads.choices", "threads.count", "threads.active"],
  },

  POSTPROC_STEP_1_SCAN: {
    id: "POSTPROC_STEP_1_SCAN",
    kind: "TOOL",
    goal: "post processing step 1 (scan)",
    message: "System step: post processing (1/3) — scan…",
    allow_free_text: false,
    allow_parentese: false,
    allowed_exits: ["POSTPROC_STEP_2_BUILD", "HOME"],
    tool: {
      tool_id: "postproc-step-1-v1",
      on_success_to: "POSTPROC_STEP_2_BUILD",
      on_error_to: "HOME",
    },
    meta_domains_written: ["ux", "postproc.last"],
  },

  POSTPROC_STEP_2_BUILD: {
    id: "POSTPROC_STEP_2_BUILD",
    kind: "TOOL",
    goal: "post processing step 2 (build)",
    message: "System step: post processing (2/3) — build…",
    allow_free_text: false,
    allow_parentese: false,
    allowed_exits: ["POSTPROC_STEP_3_PUBLISH", "HOME"],
    tool: {
      tool_id: "postproc-step-2-v1",
      on_success_to: "POSTPROC_STEP_3_PUBLISH",
      on_error_to: "HOME",
    },
    meta_domains_written: ["ux", "postproc.last"],
  },

  POSTPROC_STEP_3_PUBLISH: {
    id: "POSTPROC_STEP_3_PUBLISH",
    kind: "TOOL",
    goal: "post processing step 3 (publish)",
    message: "System step: post processing (3/3) — publish…",
    allow_free_text: false,
    allow_parentese: false,
    allowed_exits: ["HOME"],
    tool: {
      tool_id: "postproc-step-3-v1",
      on_success_to: "HOME",
      on_error_to: "HOME",
    },
    meta_domains_written: ["ux", "postproc.last"],
  },

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
      "REFLECTION",
      "BOOKING",
      "DEV_SANDBOX_INTRO",
      "POSTPROC_STEP_1_SCAN",
      "MAIL",
      "TLF",
      "CONTACT_FORM",
      "AKUT",
    ],
    router: {
      router_id: "home-router-v1",
      candidates: ["GEN_HYPNO", "TRIAGE", "METHOD_FIT", "REFLECTION", "BOOKING", "DEV_SANDBOX_INTRO"],
    },
    meta_domains_written: ["ux", "router.decision"],
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
    meta_domains_written: ["ux"],
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
        { id: "relational_patterns", label: "Relational patterns", required: false, placeholder: "fx familien" },
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
    meta_domains_written: ["ux", "form.last"],
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
    meta_domains_written: ["ux", "sandbox.apply_result"],
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
    meta_domains_written: ["ux", "checkpoint.last"],
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
    meta_domains_written: ["ux"],
  },

  // ----------- EXISTING NODES -----------

  GEN_HYPNO: {
    id: "GEN_HYPNO",
    kind: "DIALOG",
    goal: "Generelt om hypnoterapi",
    message:
      "Velkommen. Du er i dialog med hypnoterapeuten. Fortæl kort hvad du ønsker hjælp eller indsigt i. Jeg kan forklare hypnoterapi og hjælpe dig med refleksion—ikke behandling i chatten.",
    allow_free_text: true,
    allow_parentese: true,
    allowed_exits: ["HOME"],
    capability_id: "gen-hypno-v1",
    meta_domains_written: ["ux", "gen_hypno.transcript", "gen_hypno.last_topic"],
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
      "BOOKING",
      "METHOD_FIT",
      "GEN_HYPNO",
      "HOME",
    ],
    capability_id: "triage-relevance-v1",
    meta_domains_written: ["ux", "triage.question_count",
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
      "triage.close_signal",
      "triage.decision",
      "triage.render",
      "triage.relevance",
      "dialog.triage.transcript",
      "dialog.triage.used_chip_ids",
      "dialog.triage.post_close_chips_shown",
      "dialog.triage.post_close_chips_consumed",
      "memory_candidates.theme",
      "memory_candidates.goal",
      "memory_candidates.triggers",
      "memory_candidates.patterns",
      "memory_candidates.summary",],
  },

  METHOD_FIT: {
    id: "METHOD_FIT",
    kind: "DIALOG",
    goal: "Hypnoterapi eller et bedre alternativ?",
    message:
      "Fortæl kort hvad du vil opnå, og hvad der gør situationen svær lige nu. Jeg kan hjælpe med at vurdere, om hypnoterapi er et godt match, eller om andre tilgange typisk passer bedre. Jeg giver kun overblik—ikke behandling i chatten.",
    allow_free_text: true,
    allow_parentese: true,
    // Allow self-hop so the capability can stay in METHOD_FIT without dead-ends.
    allowed_exits: ["METHOD_FIT", "HOME", "BOOKING"],
    capability_id: "method-fit-v1",
    meta_domains_written: ["ux", "method_fit.transcript",
      "method_fit.summary",

      // v3: schema-backed profile fields used by the capability
      "method_fit.profile",
      "method_fit.scope",

      // v3: schema-backed recommendations (deterministic selection)
      "method_fit.case_id",
      "method_fit.problem_tags",
      "method_fit.constraints",
      "method_fit.red_flags",
      "method_fit.hypnosis_fit",
      "method_fit.recommendations",
      "method_fit.unknown_candidates",
      "method_fit.focus_plan",

      // v2: triage-like discipline + outputs
      "method_fit.question_count",
      "method_fit.questions_remaining",
      "method_fit.close_signal",
      "method_fit.relevance",
      "method_fit.confidence",
      "method_fit.tags",
      "method_fit.next_question",
      "method_fit.chips",],
  },

  REFLECTION: {
    id: "REFLECTION",
    kind: "DIALOG",
    goal: "Refleksionsdialog (intake + meningsskabelse)",
    message:
      "Vi kan tage en rolig refleksionsdialog for at skabe klarhed: hvad problemet er, hvad du ønsker, og hvordan det typisk udfolder sig. " +
      "Jeg spørger kun 1–2 spørgsmål ad gangen. Ingen øvelser eller behandling i chatten.",
    allow_free_text: true,
    allow_parentese: true,
    allowed_exits: ["HOME"],
    capability_id: "reflection-v1",
    meta_domains_written: ["ux", "reflection.transcript"],
  },

  DAGBOG: {
    id: "DAGBOG",
    kind: "DIALOG",
    goal: "Dagbog (alkohol) — observation",
    message:
      "Dagbog: skriv et kort notat. Du kan også angive drinks og urge (0–10). Fokus er observation, ikke behandling.",
    allow_free_text: true,
    allow_parentese: false,
    allowed_exits: ["HOME"],
    capability_id: "diary-alcohol-v1",
    meta_domains_written: ["ux", "journal.entries", "journal.kind", "journal.phase"],
  },

  TRIAGE_FIT_BOOKING: {
    id: "TRIAGE_FIT_BOOKING",
    kind: "TERMINAL",
    goal: "Egnet til booking",
    message: "Foreløbig triage: dit tema virker relevant for hypnoterapi. Næste skridt er booking.",
    allow_free_text: false,
    allow_parentese: false,
    allowed_exits: QUICK_CONTACTS,
    meta_domains_written: ["ux", "triage.outcome", "triage.summary", "triage.unclear_points"],
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
    meta_domains_written: ["ux", "triage.outcome", "triage.summary", "triage.unclear_points"],
  },

  TRIAGE_NEEDS_ASSESSMENT: {
    id: "TRIAGE_NEEDS_ASSESSMENT",
    kind: "TERMINAL",
    goal: "Kræver afklaringssamtale",
    message: "Foreløbig triage: der er stadig uklarheder. Start med en afklaringssamtale.",
    allow_free_text: false,
    allow_parentese: false,
    allowed_exits: QUICK_CONTACTS,
    meta_domains_written: ["ux", "triage.outcome", "triage.summary", "triage.unclear_points"],
  },

  BOOKING: {
    id: "BOOKING",
    kind: "MENU",
    goal: "Booking",
    message: "Her kan du vælge kontaktvej for booking.",
    allow_free_text: false,
    allow_parentese: false,
    allowed_exits: ["MAIL", "TLF", "CONTACT_FORM", "HOME", "AKUT"],
    meta_domains_written: ["ux"],
  },

  MAIL: {
    id: "MAIL",
    kind: "MENU",
    goal: "Mail kontakt",
    message: "Du kan kontakte mig via e-mail på jan@gaarsdal.net.",
    allow_free_text: false,
    allow_parentese: false,
    navigation: {
      show_default_chips: false,
    },
    allowed_exits: PARENTESE_EXITS,
    meta_domains_written: ["ux"],
  },

  TLF: {
    id: "TLF",
    kind: "MENU",
    goal: "Telefon kontakt",
    message: "Du kan ringe eller sende sms til 42 80 74 74. Jeg svarer, så snart jeg kan.",
    allow_free_text: false,
    allow_parentese: false,
    navigation: {
      show_default_chips: false,
    },
    allowed_exits: PARENTESE_EXITS,
    meta_domains_written: ["ux"],
  },

  CONTACT_FORM: {
    id: "CONTACT_FORM",
    kind: "MENU",
    goal: "Kontaktformular",
    message:
      "Vil du åbne kontaktsiden, eller blive her i chatten?\n\nE-mail: jan@gaarsdal.net\nTelefon/SMS: 42 80 74 74\nKontaktformular: /kontakt",
    allow_free_text: false,
    allow_parentese: false,
    navigation: {
      show_default_chips: false,
    },
    allowed_exits: PARENTESE_EXITS,
    meta_domains_written: ["ux"],
  },

  AKUT: {
    id: "AKUT",
    kind: "MENU",
    goal: "Akut",
    message:
      "Akut hjælp i Danmark: Ring 112 ved livstruende situationer. Voksne: Livslinien 70 201 201 (døgnåben). Børn og unge: BørneTelefonen 116 111. Psykiatrisk akutmodtagelse kan kontaktes via 1813 (Region Hovedstaden) eller din region.",
    allow_free_text: false,
    allow_parentese: false,
    navigation: {
      show_default_chips: false,
    },
    allowed_exits: PARENTESE_EXITS,
    meta_domains_written: ["ux"],
  },
})

const REGISTRY: Record<NodeId, Readonly<Node>> = Object.freeze(
  Object.fromEntries(Object.entries(RAW_REGISTRY).map(([k, v]) => [k, Object.freeze(v)]))
)

function getNode(id: NodeId): Readonly<Node> {
  const node = REGISTRY[id]
  if (!node) throw new Error(`unknown node: ${id}`)
  return node
}

export { getNode }
export default getNode
