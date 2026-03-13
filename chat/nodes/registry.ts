// chat/nodes/registry.ts

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
  on_submit_to: string
  allow_partial?: boolean
}

export type ToolSpec = {
  tool_id: string
  on_success_to: string
  on_error_to?: string
}

export type CheckpointSpec = {
  on_done_to: string
  commit_domains?: string[]
}

export type RouterSpec = {
  router_id: string
  candidates?: string[]
}

export type ChatNode = {
  id: string
  kind: NodeKind
  goal: string
  message: string
  allow_free_text: boolean
  allow_parentese: boolean
  allowed_exits: string[]
  meta_domains_written: string[]
  capability_id?: string | null
  form?: FormSpec
  tool?: ToolSpec
  checkpoint?: CheckpointSpec
  router?: RouterSpec
}

export const NODE_REGISTRY: Record<string, ChatNode> = {
  HOME: {
    id: "HOME",
    kind: "MENU",
    goal: "Start og overblik",
    message:
      "Velkommen.\n\n" +
      "Jeg kan hjælpe dig med:\n\n" +
      "1) Generelt om hypnoterapi\n" +
      "2) Metode og anvendelse\n" +
      "3) Praktisk info og booking\n\n" +
      "Du kan også bare skrive frit.",
    allow_free_text: true,
    allow_parentese: true,
    allowed_exits: [
      "GEN_HYPNO",
      "METHOD_FIT",
      "BOOKING",
      "DEV_SANDBOX_INTRO",
      "POSTPROC_STEP_1_SCAN",
    ],
    meta_domains_written: ["ux", "router.decision"],
  },

  METHOD_FIT: {
    id: "METHOD_FIT",
    kind: "DIALOG",
    goal: "Forstå metode og anvendelse",
    message:
      "Her kan du få et overblik over, hvad hypnoterapi typisk bruges til, og hvornår det giver mening at overveje det.",
    allow_free_text: true,
    allow_parentese: true,
    allowed_exits: ["METHOD_FIT", "GEN_HYPNO", "BOOKING", "HOME"],
    capability_id: "method-fit-v1",
    meta_domains_written: [
      "ux",
      "method_fit.summary",
      "method_fit.tags",
      "method_fit.last_topic",
    ],
  },

  BOOKING: {
    id: "BOOKING",
    kind: "DIALOG",
    goal: "Praktisk info og booking",
    message:
      "Her kan du få praktisk information om kontakt, forløb, tider og booking.",
    allow_free_text: true,
    allow_parentese: true,
    allowed_exits: ["BOOKING", "HOME", "GEN_HYPNO"],
    capability_id: "booking-v1",
    meta_domains_written: [
      "ux",
      "booking.last_topic",
      "booking.intent",
      "booking.summary",
    ],
  },

  GEN_HYPNO: {
    id: "GEN_HYPNO",
    kind: "DIALOG",
    goal: "Generelt om hypnoterapi og let refleksion",
    message:
      "Her kan du få information om hypnoterapi, hvordan et forløb typisk foregår, og hjælp til at forstå vaner og mønstre.",
    allow_free_text: true,
    allow_parentese: true,
    allowed_exits: ["HOME", "BOOKING"],
    capability_id: "gen-hypno-v1",
    meta_domains_written: [
      "ux",
      "gen_hypno.transcript",
      "gen_hypno.last_topic",
      "gen_hypno.problem_title",
      "gen_hypno.problem_summary",
      "gen_hypno.topic_tags",
      "gen_hypno.assistant_turn_count",
      "dialog.mode",
      "dialog.stage",
      "dialog.topic",
    ],
  },

  FOCUSED_PATTERN_REFLECTION: {
    id: "FOCUSED_PATTERN_REFLECTION",
    kind: "DIALOG",
    goal: "Fokuseret refleksion over mønstre",
    message:
      "Her ser vi nærmere på et konkret mønster i din hverdag. Samtalen handler om refleksion og afklaring – ikke behandling.",
    allow_free_text: true,
    allow_parentese: true,
    allowed_exits: [
      "FOCUSED_PATTERN_REFLECTION",
      "GEN_HYPNO",
      "HOME",
      "BOOKING",
    ],
    capability_id: "focused-pattern-reflection-v1",
    meta_domains_written: [
      "ux",
      "focused_reflection.topic",
      "focused_reflection.transcript",
      "focused_reflection.stage",
      "focused_reflection.readiness",
      "dialog.mode",
      "dialog.stage",
      "dialog.topic",
    ],
  },

  DEV_SANDBOX_INTRO: {
    id: "DEV_SANDBOX_INTRO",
    kind: "DIALOG",
    goal: "sandbox intro",
    message:
      "Sandbox-flow:\n\n" +
      "1) Udfyld en mini-form\n" +
      "2) Systemet kører et TOOL\n" +
      "3) Systemet laver checkpoint\n\n" +
      "Skriv 'ok' for at fortsætte.",
    allow_free_text: true,
    allow_parentese: false,
    allowed_exits: ["DEV_SANDBOX_FORM", "HOME"],
    meta_domains_written: ["ux"],
  },

  DEV_SANDBOX_FORM: {
    id: "DEV_SANDBOX_FORM",
    kind: "FORM",
    goal: "sandbox form",
    message:
      "Skriv key:value pr linje.\n\n" +
      "Eksempel:\n" +
      "topic: alkohol om aftenen\n" +
      "goal: drikke mindre",
    allow_free_text: true,
    allow_parentese: false,
    allowed_exits: ["DEV_SANDBOX_FORM", "DEV_SANDBOX_TOOL_APPLY", "HOME"],
    form: {
      instructions: "Skriv key:value pr linje.",
      fields: [
        {
          id: "topic",
          label: "Topic",
          required: true,
        },
        {
          id: "goal",
          label: "Goal",
          required: true,
        },
      ],
      on_submit_to: "DEV_SANDBOX_TOOL_APPLY",
    },
    meta_domains_written: ["ux", "form.last"],
  },

  DEV_SANDBOX_TOOL_APPLY: {
    id: "DEV_SANDBOX_TOOL_APPLY",
    kind: "TOOL",
    goal: "apply sandbox form",
    message: "System step: applying sandbox form…",
    allow_free_text: false,
    allow_parentese: false,
    allowed_exits: ["DEV_SANDBOX_CHECKPOINT", "HOME"],
    tool: {
      tool_id: "apply-form-to-track-v1",
      on_success_to: "DEV_SANDBOX_CHECKPOINT",
      on_error_to: "HOME",
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
      "- Redis profile\n\n" +
      "Vælg HOME for at fortsætte.",
    allow_free_text: false,
    allow_parentese: false,
    allowed_exits: ["HOME"],
    meta_domains_written: ["ux"],
  },

  POSTPROC_STEP_1_SCAN: {
    id: "POSTPROC_STEP_1_SCAN",
    kind: "TOOL",
    goal: "post processing step 1",
    message: "System step: post processing (1/3)…",
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
    goal: "post processing step 2",
    message: "System step: post processing (2/3)…",
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
    goal: "post processing step 3",
    message: "System step: post processing (3/3)…",
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
}

export function getNode(nodeId: string): ChatNode | undefined {
  return NODE_REGISTRY[nodeId]
}
