import { Node } from "../kernel/types"

export const nodeRegistry: Record<string, Node> = {

  // ─── Core navigation ───────────────────────────────────────────────────────

  HOME: {
    id: "HOME",
    kind: "ROUTER",
    goal: "Indgang og routing baseret på brugerens hensigt",
    message:
      "Velkommen til Gaarsdal Hypnoterapi. Du kan få information om hypnoterapi, reflektere over vaner og mønstre, booke en tid — eller blot skrive hvad du har på hjerte.",
    allow_free_text: true,
    allow_parentese: false,
    allowed_exits: ["GEN_HYPNO", "BOOKING", "CLIENT_SUPPORT", "HANDOFF_FORM", "LEAD_CAPTURE"],
    meta_domains_written: ["ux", "router.decision", "gen_hypno.last_topic", "gen_hypno.problem_path"],
  },

  GEN_HYPNO: {
    id: "GEN_HYPNO",
    kind: "DIALOG",
    goal: "Information om hypnoterapi og refleksion over vaner, adfærd og mønstre",
    message:
      "Hej. Her kan du stille spørgsmål om hypnoterapi eller fortælle hvad du har på hjerte.",
    allow_free_text: true,
    allow_parentese: true,
    capability_id: "gen-hypno-v1",
    allowed_exits: [
      "GEN_HYPNO",
      "HOME",
      "BOOKING",
      "HANDOFF_FORM",
      "LEAD_CAPTURE",
      "PREQUALIFY",
      "CLIENT_SUPPORT",
    ],
    meta_domains_written: [
      "ux",
      "gen_hypno.transcript",
      "gen_hypno.last_topic",
      "gen_hypno.problem_title",
      "gen_hypno.problem_summary",
      "gen_hypno.topic_tags",
      "gen_hypno.assistant_turn_count",
      "gen_hypno.analysis",
      "gen_hypno.cta_shown",
      "dialog.mode",
      "dialog.move",
      "dialog.investigation_focus",
      "dialog.stage",
      "dialog.topic",
      "dialog.objective",
      "dialog.relational_state",
      "focused_reflection.readiness",
      "focused_reflection.topic",
      "focused_reflection.entry_source",
      "focused_reflection.user_opt_in",
      "focused_reflection.stage",
      "focused_reflection.transcript",
      "wot.arousal_score",
      "wot.arousal_level",
    ],
  },

  // ─── Booking / kontakt ─────────────────────────────────────────────────────

  BOOKING: {
    id: "BOOKING",
    kind: "INFO",
    goal: "Kontaktinfo og booking-veje",
    message:
      "Du kan kontakte Jan på telefon +45 42 80 74 74 eller mail jan@gaarsdal.net. Klinikken ligger på Bakkevej 36, 3460 Birkerød.\n\nEller skriv dit navn og hvad du ønsker hjælp til — så kontakter Jan dig.",
    allow_free_text: true,
    allow_parentese: false,
    allowed_exits: ["HOME", "GEN_HYPNO", "HANDOFF_FORM", "LEAD_CAPTURE", "PREQUALIFY"],
    meta_domains_written: ["ux"],
  },

  // ─── Warm handoff flow ─────────────────────────────────────────────────────

  HANDOFF_FORM: {
    id: "HANDOFF_FORM",
    kind: "FORM",
    goal: "Indsaml kontaktoplysninger og emne til Jan",
    message:
      "Godt. Udfyld kontaktformularen — Jan vender tilbage inden for 24 timer.",
    allow_free_text: true,
    allow_parentese: false,
    form: {
      fields: [
        { id: "navn", label: "Dit navn", required: true, placeholder: "Fornavn og efternavn" },
        { id: "emne", label: "Hvad handler det om?", required: true, placeholder: "Fx søvn, stress, rygestop, angst…" },
        { id: "kontakt", label: "Telefon eller email", required: true, placeholder: "Jan kontakter dig her" },
        { id: "besked", label: "Besked (valgfrit)", required: false, placeholder: "Noget du vil tilføje?" },
      ],
      allow_partial: false,
      on_submit_to: "HANDOFF_NOTIFY",
    },
    allowed_exits: ["HANDOFF_NOTIFY", "LEAD_CAPTURE", "GEN_HYPNO"],
    meta_domains_written: ["ux", "form.last", "gen_hypno.transcript", "gen_hypno.assistant_turn_count", "dialog.mode", "dialog.move", "dialog.investigation_focus", "dialog.stage", "dialog.relational_state", "gen_hypno.analysis"],
  },

  HANDOFF_NOTIFY: {
    id: "HANDOFF_NOTIFY",
    kind: "TOOL",
    goal: "Send handoff-notifikation til Jan og gem i Redis",
    message: "",
    allow_free_text: false,
    allow_parentese: false,
    tool: {
      name: "handoff-notify-v1",
      on_success_to: "HANDOFF_CONFIRM",
      on_failure_to: "HANDOFF_CONFIRM",
    },
    allowed_exits: ["HANDOFF_CONFIRM"],
    meta_domains_written: ["ux", "handoff.last"],
  },

  HANDOFF_CONFIRM: {
    id: "HANDOFF_CONFIRM",
    kind: "INFO",
    goal: "Bekræft at henvendelsen er modtaget",
    message:
      "Tak — Jan modtager din henvendelse og kontakter dig inden for 24 timer.\n\nDu kan også selv ringe på +45 42 80 74 74 eller skrive til jan@gaarsdal.net.",
    allow_free_text: false,
    allow_parentese: false,
    allowed_exits: ["HOME", "GEN_HYPNO"],
    meta_domains_written: ["ux"],
  },

  // ─── Lead capture flow ─────────────────────────────────────────────────────

  LEAD_CAPTURE: {
    id: "LEAD_CAPTURE",
    kind: "FORM",
    goal: "Indsaml email til opfølgning for ikke-klar besøgende",
    message:
      "Ingen stress — du behøver ikke beslutte dig nu.\n\nEfterlad din email, så sender Jan en kort besked om hvad en første session typisk indebærer.\n\nSkriv:\n- email: Din emailadresse\n- tema: (valgfrit) Hvad handler det primært om?",
    allow_free_text: true,
    allow_parentese: false,
    form: {
      fields: [
        { id: "email", label: "Email", required: true, placeholder: "din@email.dk" },
        { id: "tema", label: "Tema", required: false, placeholder: "Fx søvn, stress, vaner..." },
      ],
      allow_partial: false,
      on_submit_to: "LEAD_SAVE",
    },
    allowed_exits: ["LEAD_SAVE"],
    meta_domains_written: ["ux", "form.last"],
  },

  LEAD_SAVE: {
    id: "LEAD_SAVE",
    kind: "TOOL",
    goal: "Gem lead i Redis til Jan",
    message: "",
    allow_free_text: false,
    allow_parentese: false,
    tool: {
      name: "lead-save-v1",
      on_success_to: "LEAD_CONFIRM",
      on_failure_to: "LEAD_CONFIRM",
    },
    allowed_exits: ["LEAD_CONFIRM"],
    meta_domains_written: ["ux", "lead.last"],
  },

  LEAD_CONFIRM: {
    id: "LEAD_CONFIRM",
    kind: "INFO",
    goal: "Bekræft at email er modtaget",
    message:
      "Noteret. Jan sender dig en kort besked inden for et par dage.\n\nDu er selvfølgelig altid velkommen til at vende tilbage her, hvis du vil tale mere om det.",
    allow_free_text: false,
    allow_parentese: false,
    allowed_exits: ["HOME", "GEN_HYPNO"],
    meta_domains_written: ["ux"],
  },

  // ─── Pre-kvalificering ─────────────────────────────────────────────────────

  PREQUALIFY: {
    id: "PREQUALIFY",
    kind: "DIALOG",
    goal: "Afklaring: passer hypnoterapi til denne persons situation?",
    message:
      "Hvad er det primære, du ønsker at arbejde med?",
    allow_free_text: true,
    allow_parentese: false,
    capability_id: "prequalify-v1",
    allowed_exits: ["PREQUALIFY", "HANDOFF_FORM", "GEN_HYPNO", "HOME"],
    meta_domains_written: [
      "ux",
      "prequalify.transcript",
      "prequalify.fit",
      "prequalify.reason",
      "prequalify.turn_count",
      "prequalify.offer_shown",
    ],
  },

  // ─── Klient-støtte ─────────────────────────────────────────────────────────

  CLIENT_SUPPORT: {
    id: "CLIENT_SUPPORT",
    kind: "DIALOG",
    goal: "Støtte til eksisterende klienter mellem sessioner",
    message:
      "Hej igen. Hvad er der på hjerte siden sidst — eller er der noget fra sessionen du vil tale nærmere om?",
    allow_free_text: true,
    allow_parentese: true,
    capability_id: "client-support-v1",
    allowed_exits: ["CLIENT_SUPPORT", "GEN_HYPNO", "HANDOFF_FORM", "HOME"],
    meta_domains_written: [
      "ux",
      "client_support.transcript",
      "client_support.last_topic",
    ],
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
