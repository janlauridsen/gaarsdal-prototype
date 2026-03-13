export type ToolSpec = {
  tool_id: string
  on_success_to: string
  on_error_to?: string
}

export type CheckpointSpec = {
  checkpoint_id: string
  on_done_to: string
  on_error_to?: string
}

export type RouterSpec = {
  router_id: string
  candidates: string[]
}

export type FormFieldSpec = {
  id: string
  label: string
  required?: boolean
  placeholder?: string
}

export type FormSpec = {
  fields: FormFieldSpec[]
  allow_partial?: boolean
  on_submit_to: string
}

export type NodeKind =
  | "MENU"
  | "STATIC"
  | "INFO"
  | "DIALOG"
  | "TERMINAL"
  | "FORM"
  | "TOOL"
  | "CHECKPOINT"
  | "ROUTER"

export type Node = {
  id: string
  kind: NodeKind
  goal: string
  message: string
  allow_free_text: boolean
  allow_parentese: boolean
  allowed_exits: string[]
  meta_domains_written: string[]
  capability_id?: string
  router?: RouterSpec
  tool?: ToolSpec
  checkpoint?: CheckpointSpec
  form?: FormSpec
}

export const nodeRegistry: Record<string, Node> = {
  HOME: {
    id: "HOME",
    kind: "MENU",
    goal: "Startnode for chatbot",
    message:
      "Velkommen. Du kan få information om hypnoterapi, reflektere over vaner og mønstre, eller finde kontaktoplysninger.",
    allow_free_text: true,
    allow_parentese: false,
    allowed_exits: ["GEN_HYPNO", "BOOKING"],
    meta_domains_written: ["ux"],
  },

  GEN_HYPNO: {
    id: "GEN_HYPNO",
    kind: "DIALOG",
    goal: "Information om hypnoterapi og refleksion over vaner",
    message:
      "Her kan du få information om hypnoterapi, hvordan et forløb typisk foregår, og hjælp til at forstå vaner og mønstre.",
    allow_free_text: true,
    allow_parentese: true,
    capability_id: "gen-hypno-v1",
    allowed_exits: ["GEN_HYPNO", "HOME", "BOOKING"],
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

      "focused_reflection.readiness",
      "focused_reflection.topic",
      "focused_reflection.entry_source",
      "focused_reflection.user_opt_in",
      "focused_reflection.stage",
      "focused_reflection.transcript",
    ],
  },

  BOOKING: {
    id: "BOOKING",
    kind: "INFO",
    goal: "Kontaktinformation",
    message:
      "Du kan kontakte Jan på telefon +45 42 80 74 74 eller mail jan@gaarsdal.net. Klinikken ligger på Bakkevej 36, 3460 Birkerød.",
    allow_free_text: true,
    allow_parentese: false,
    allowed_exits: ["HOME", "GEN_HYPNO", "BOOKING"],
    meta_domains_written: ["ux"],
  },

  PROFILE_BOOTSTRAP: {
    id: "PROFILE_BOOTSTRAP",
    kind: "TOOL",
    goal: "Bootstrap profil og trådindex",
    message: "Klargør profil og trådoversigt.",
    allow_free_text: true,
    allow_parentese: false,
    allowed_exits: ["GEN_HYPNO"],
    meta_domains_written: [
      "profile.status",
      "profile.last_seen_at",
      "threads.count",
      "threads.active",
      "threads.choices",
    ],
    tool: {
      tool_id: "profile-bootstrap-v1",
      on_success_to: "GEN_HYPNO",
    },
  },
}

export function getNode(nodeId: string): Node {
  const node = nodeRegistry[nodeId]

  if (!node) {
    throw new Error(`Node not found: ${nodeId}`)
  }

  return node
}

export function nodeExists(nodeId: string): boolean {
  return nodeId in nodeRegistry
}

export const allNodes: Node[] = Object.values(nodeRegistry)

export default nodeRegistry
