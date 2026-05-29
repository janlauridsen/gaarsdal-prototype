import type {
  ConversationState,
  InputSignal,
  KernelResult,
  Transition,
  Node,
} from "../kernel/types"
import { runKernel } from "../kernel/engine"
import { getNode } from "../nodes/registry"
import { runCapability } from "../ai/runtime"
import { parseFormText } from "../tools/formParsing"
import { runTool } from "../tools/tools"
import { runRouter } from "../router/runRouter"
import { buildContextPackV23 } from "../ai/contextPack"
import { readConsent, consentAllowsPersistence } from "../consent/store"
import { buildUserProfilePromptContext, readUserProfile } from "../memory/store"
import { MEMORY_TTL_SECONDS } from "../utils/ttl"

export type NodeRunParams = {
  state: ConversationState
  input: InputSignal
  userKey: string
  modelOverride?: string
  chatbotType?: "standard" | "children"
}


function norm(s: string): string {
  return s.toLowerCase().trim()
}

/**
 * Reads the most recent conversation topic from state meta.
 * Tries gen_hypno.last_topic first, then dialog.topic.
 */
function readLastTopic(state: ConversationState): string | null {
  const fromGenHypno = (state.meta as any)?.["gen_hypno.last_topic"]?.value
  if (typeof fromGenHypno === "string" && fromGenHypno.trim()) return fromGenHypno.trim()
  const fromDialog = (state.meta as any)?.["dialog.topic"]?.value
  if (typeof fromDialog === "string" && fromDialog.trim()) return fromDialog.trim()
  return null
}

/**
 * Returns true if the user's free text in a FORM node looks like they want
 * to escape back to dialogue rather than fill in the form.
 * Heuristic: no key:value pairs found AND text reads as a natural sentence.
 */
function looksLikeFormEscapeIntent(text: string): boolean {
  const t = norm(text).replace(/\s+/g, " ")
  if (!t || t.length < 5) return false

  // If text contains a colon with a label before it, it looks like form input
  if (/\b\w+\s*:\s*\S/.test(t)) return false

  // Explicit escape signals
  const escapePatterns = [
    /fortsæt/,
    /fortsat/,
    /tilbage til/,
    /vil gerne tale/,
    /kan vi tale/,
    /vil tale/,
    /ikke udfylde/,
    /ikke nu/,
    /gå tilbage/,
    /vent lidt/,
    /faktisk/,
    /fortryder/,
    /hvad (med|hvis|nu|så)/,
    /har et spørgsmål/,
    /noget andet/,
    /andet emne/,
    /andre spørgsmål/,
    /dialog/,
    /snakke/,
    /snak/,
  ]
  if (escapePatterns.some((p) => p.test(t))) return true

  // If text is a full sentence (no colons, contains verb-like words) and > 15 chars
  // it's likely dialogue, not form input
  const sentenceWords = t.split(" ")
  const hasVerb = sentenceWords.some((w) =>
    /^(er|har|vil|kan|skal|må|gerne|ønsker|tænker|forstår|overvejer|lyder|mener|tror|ved|hører|ser|prøver)$/.test(w)
  )
  if (hasVerb && t.length > 20) return true

  return false
}

/**
 * Runs a node according to its kind.
 *
 * - MENU: allow FREE_TEXT and hop to first exit (or HOME) to avoid REJECT loops from UI
 * - TERMINAL: kernel-only
 * - DIALOG: optional AI capability resolution for FREE_TEXT
 * - FORM: parses and validates FREE_TEXT and writes meta_delta
 * - TOOL/CHECKPOINT: deterministic tool execution (supports SYSTEM ticks for auto-advance)
 * - ROUTER: deterministic routing (supports SYSTEM ticks for auto-advance)
 */
export async function runNode(params: NodeRunParams): Promise<KernelResult> {
  const { state, input } = params
  const node = getNode(state.active_node) as Readonly<Node>

  // ROUTER can run on SYSTEM ticks (auto-advance)
  if (node.kind === "ROUTER" && input.type === "SYSTEM") {
    const { transition } = runRouter({ node, state, userText: "" })
    return runKernel(state, {
      type: "FREE_TEXT_RESOLVED",
      proposed_transition: transition,
    })
  }

  // TOOL / CHECKPOINT can run on SYSTEM ticks (auto-advance)
  if ((node.kind === "TOOL" || node.kind === "CHECKPOINT") && input.type === "SYSTEM") {
    const spec = node.kind === "TOOL" ? node.tool : node.checkpoint
    if (!spec) return runKernel(state, input)

    const toolResult = await runTool({
      kind: node.kind,
      spec,
      userKey: params.userKey,
      state,
      userText: "",
    })

    if (toolResult.state_override) {
      const now = new Date().toISOString()
      const result: KernelResult = {
        state: toolResult.state_override,
        transition: {
          type: "INIT",
          from: "SYSTEM",
          to: toolResult.state_override.active_node,
          reason: toolResult.reason,
          response_message: toolResult.response_message,
          meta_delta: toolResult.meta_delta,
        },
        log: {
          conversation_id: toolResult.state_override.conversation_id,
          revision_before: -1,
          revision_after: toolResult.state_override.revision,
          active_node_before: null,
          active_node_after: toolResult.state_override.active_node,
          input_type: "SYSTEM",
          transition_type: "INIT",
          timestamp: now,
        },
      }
      return result
    }

    const transition: Transition = {
      type: "NODE_HOP",
      from: state.active_node,
      to: toolResult.nextNode,
      reason: toolResult.reason,
      response_message: toolResult.response_message,
      meta_delta: toolResult.meta_delta,
    }

    return runKernel(state, {
      type: "FREE_TEXT_RESOLVED",
      proposed_transition: transition,
    })
  }

  // Default: let kernel handle it for non FREE_TEXT
  if (input.type !== "FREE_TEXT") {
    return runKernel(state, input)
  }

  // If node does not allow free text, kernel will REJECT.
  if (!node.allow_free_text) {
    return runKernel(state, input)
  }

  // MENU: hop forward to avoid UI free-text causing REJECT
  if (node.kind === "MENU") {
    const text = norm(input.text)
    const toHome = text === "home" || text === "hjem" || text === "tilbage"
    const next = toHome ? "HOME" : (node.allowed_exits?.[0] ?? state.active_node)

    const transition: Transition = {
      type: "NODE_HOP",
      from: state.active_node,
      to: next,
      reason: "menu free_text -> next",
    }

    return runKernel(state, {
      type: "FREE_TEXT_RESOLVED",
      proposed_transition: transition,
    })
  }

  if (node.kind === "ROUTER") {
    const { transition } = runRouter({ node, state, userText: input.text })
    return runKernel(state, {
      type: "FREE_TEXT_RESOLVED",
      proposed_transition: transition,
    })
  }

  if (node.kind === "DIALOG") {
    const capabilityId = node.capability_id ?? null
    if (!capabilityId) {
      // No capability: treat as simple free-text node, and rely on explicit transitions.
      // Default behavior: hop to first exit if user types anything.
      const next = node.allowed_exits?.[0] ?? state.active_node
      const transition: Transition = {
        type: "NODE_HOP",
        from: state.active_node,
        to: next,
        reason: "dialog (no capability) -> next",
      }
      return runKernel(state, {
        type: "FREE_TEXT_RESOLVED",
        proposed_transition: transition,
      })
    }

    const consentRecord = await readConsent(params.userKey)
    const contextPack = await buildContextPackV23({
      userKey: params.userKey,
      state,
      ttlSeconds: MEMORY_TTL_SECONDS,
      userText: input.text,
      // Children chatbot: aldrig brug LTM - børnedata må ikke blandes med forældrers profil
      sessionOnly: params.chatbotType === "children" || !consentAllowsPersistence(consentRecord),
    })
    const profile = await readUserProfile(params.userKey)
    const capabilityResult = await runCapability(capabilityId, {
      state,
      userText: input.text,
      modelOverride: params.modelOverride,
      contextPack: {
        system: contextPack.system,
        user_profile: buildUserProfilePromptContext(profile),
        goal_hypothesis: contextPack.goal_hypothesis,
      },
    })

    return runKernel(state, {
      type: "FREE_TEXT_RESOLVED",
      proposed_transition: capabilityResult.transition,
    })
  }

  if (node.kind === "FORM") {
    if (!node.form) {
      return runKernel(state, input)
    }

    // Escape hatch: detect dialogue/cancel intent before attempting form parsing.
    // If the user clearly wants to go back to dialogue, route to GEN_HYPNO.
    if (looksLikeFormEscapeIntent(input.text) && node.allowed_exits.includes("GEN_HYPNO")) {
      const lastTopic = readLastTopic(state)
      const response_message = lastTopic
        ? `Selvfølgelig — vi kan sagtens fortsætte. Vi var ved at tale om ${lastTopic}. Vil du fortsætte der, eller er der noget andet på hjerte?`
        : "Selvfølgelig — hvad vil du gerne tale om?"

      const transition: Transition = {
        type: "NODE_HOP",
        from: state.active_node,
        to: "GEN_HYPNO",
        reason: "form escape: user wants to continue dialogue",
        response_message,
      }
      return runKernel(state, {
        type: "FREE_TEXT_RESOLVED",
        proposed_transition: transition,
      })
    }

    const parsed = parseFormText(input.text)
    const missing: string[] = []
    const values: Record<string, unknown> = {}

    for (const field of node.form.fields) {
      const raw = parsed[field.id]
      const value = typeof raw === "string" ? raw.trim() : ""
      if (field.required && !value) {
        missing.push(field.label)
      }
      if (value) values[field.id] = value
    }

    if (missing.length && !node.form.allow_partial) {
      const response =
        `Mangler: ${missing.join(", ")}.\n\n` +
        `Skriv som nøgle:værdi pr linje, fx:\n` +
        node.form.fields
          .map((f) => `- ${f.id}: ${f.placeholder ?? f.label}`)
          .join("\n")

      const stay: Transition = {
        type: "NODE_HOP",
        from: state.active_node,
        // Intentionally no `to`: kernel falls back to state.active_node.
        // Setting to: state.active_node would require the node to list itself
        // in allowed_exits, which creates unnecessary graph noise.
        reason: "form validation failed",
        response_message: response,
      }
      return runKernel(state, {
        type: "FREE_TEXT_RESOLVED",
        proposed_transition: stay,
      })
    }

    const transition: Transition = {
      type: "NODE_HOP",
      from: state.active_node,
      to: node.form.on_submit_to,
      reason: "form submitted",
      meta_delta: {
        "form.last": {
          node: state.active_node,
          values,
          submitted_at: new Date().toISOString(),
        },
      },
    }

    return runKernel(state, {
      type: "FREE_TEXT_RESOLVED",
      proposed_transition: transition,
    })
  }

  // INFO: statisk node der ikke har en capability.
  // FREE_TEXT returnerer node-beskeden uden at lave en transition.
  // Dette sikrer at CRISIS_INFO forbliver aktiv på tværs af turns
  // uden at falde tilbage til normal dialog.
  if (node.kind === "INFO") {
    const transition: Transition = {
      type: "NODE_HOP",
      from: state.active_node,
      to: state.active_node,
      reason: "info node free_text -> self",
      response_message: node.message,
    }
    // Bypass kernel validation ved at returnere direkte
    const now = new Date().toISOString()
    return {
      state: {
        ...state,
        revision: state.revision + 1,
      },
      transition,
      log: {
        conversation_id: state.conversation_id,
        revision_before: state.revision,
        revision_after: state.revision + 1,
        active_node_before: state.active_node,
        active_node_after: state.active_node,
        input_type: "FREE_TEXT",
        transition_type: "NODE_HOP",
        timestamp: now,
      },
    }
  }

  if (node.kind === "TOOL" || node.kind === "CHECKPOINT") {
    const spec = node.kind === "TOOL" ? node.tool : node.checkpoint
    if (!spec) {
      return runKernel(state, input)
    }

    const toolResult = await runTool({
      kind: node.kind,
      spec,
      userKey: params.userKey,
      state,
      userText: input.text,
    })

    if (toolResult.state_override) {
      const now = new Date().toISOString()
      const result: KernelResult = {
        state: toolResult.state_override,
        transition: {
          type: "INIT",
          from: state.active_node,
          to: toolResult.state_override.active_node,
          reason: toolResult.reason,
          response_message: toolResult.response_message,
          meta_delta: toolResult.meta_delta,
        },
        log: {
          conversation_id: toolResult.state_override.conversation_id,
          revision_before: -1,
          revision_after: toolResult.state_override.revision,
          active_node_before: null,
          active_node_after: toolResult.state_override.active_node,
          input_type: "FREE_TEXT",
          transition_type: "INIT",
          timestamp: now,
        },
      }
      return result
    }

    const transition: Transition = {
      type: "NODE_HOP",
      from: state.active_node,
      to: toolResult.nextNode,
      reason: toolResult.reason,
      response_message: toolResult.response_message,
      meta_delta: toolResult.meta_delta,
    }

    return runKernel(state, {
      type: "FREE_TEXT_RESOLVED",
      proposed_transition: transition,
    })
  }

  // Default fallback
  return runKernel(state, input)
}
