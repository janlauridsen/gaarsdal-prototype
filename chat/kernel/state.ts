import type { ConversationState } from "./types"
import { getNode } from "../nodes/registry"

export function createInitialState(
  conversation_id: string
): ConversationState {
  const entry = getNode("GEN_HYPNO")

  return {
    conversation_id,
    revision: 0,
    active_node: entry.id,
    active_node_message: entry.message,
    allowed_transitions: entry.allowed_exits,
    meta: {},
    status: "active",
    parentese_stack: [],
  }
}

/**
 * Creates the "lobby" state used before entering a specific thread.
 * The lobby must point to an existing node in the current registry.
 */
export function createLobbyState(conversation_id: string): ConversationState {
  const entry = getNode("HOME")

  return {
    conversation_id,
    revision: 0,
    active_node: entry.id,
    active_node_message: entry.message,
    allowed_transitions: entry.allowed_exits,
    meta: {},
    status: "active",
    parentese_stack: [],
  }
}

/**
 * Dagbogsbevidste meta-nøgler.
 *
 * Disse nøgler opbygger den temporale dimension der giver brugeren
 * oplevelsen af en samtale der husker og udvikler sig over tid —
 * ikke bare én session, men et forløb.
 *
 * topic_first_seen_at: hvornår et emne første gang optrådte (ISO timestamp)
 * topic_last_framing:  hvordan brugeren senest formulerede sit emne (fri tekst)
 *
 * Skrives fra postTurn (Sprint 2+) og læses i handleInitOrRestore
 * til at bygge personlige velkomstbeskeder.
 */
export const JOURNAL_META_KEYS = {
  topicFirstSeenAt: "gen_hypno.topic_first_seen_at",
  topicLastFraming: "gen_hypno.topic_last_framing",
  lastTopic: "gen_hypno.last_topic",
  assistantTurnCount: "gen_hypno.assistant_turn_count",
} as const

/**
 * Læser en meta-værdi sikkert fra ConversationState.meta.
 * Håndterer både { value, source_node }-formatet og rå værdier.
 */
export function readMetaValue(state: ConversationState, key: string): unknown {
  const entry = state.meta?.[key]
  if (entry && typeof entry === "object" && "value" in entry) {
    return (entry as any).value
  }
  return entry
}

/**
 * Bygger en personlig returneringsbesked baseret på hvad systemet
 * ved om brugerens tidligere samtaler.
 *
 * Returnerer null hvis:
 * - Det er en lobby-samtale
 * - Brugeren endnu ikke har haft en reel dialog (< 2 turns)
 * - Intet emne er registreret
 *
 * Kaldes fra handleInitOrRestore i pages/api/chat.ts.
 */
export function buildReturnGreeting(params: {
  storedState: ConversationState
  conversationKind: "lobby" | "thread"
}): string | null {
  if (params.conversationKind === "lobby") return null

  const state = params.storedState
  const lastTopic = readMetaValue(state, JOURNAL_META_KEYS.lastTopic)
  const turnCount = readMetaValue(state, JOURNAL_META_KEYS.assistantTurnCount)
  const lastFraming = readMetaValue(state, JOURNAL_META_KEYS.topicLastFraming)

  // Kræv minimum 2 AI-turns for at undgå greetings efter én hej-besked
  if (typeof turnCount !== "number" || turnCount < 2) return null
  if (typeof lastTopic !== "string" || !lastTopic.trim()) return null

  const topic = lastTopic.trim()

  // Bruger lastFraming som kontekst hvis tilgængeligt — giver mere menneskelig hilsen
  if (typeof lastFraming === "string" && lastFraming.trim().length > 8) {
    return `Hej igen. Sidst var vi inde på ${topic} — du nævnte noget om "${lastFraming.trim().slice(0, 60)}". Vil du tage det op igen, eller er der noget nyt?`
  }

  return `Hej igen. Sidst var vi inde på ${topic}. Vil du fortsætte der, eller er der noget nyt på hjerte?`
}
