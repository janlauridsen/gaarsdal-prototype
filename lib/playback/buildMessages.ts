import type {
  LoggedSession,
  ReplayMessage,
  ReplayTurn,
} from "./replay-types";

/* ----------------------------------
   BUILD SYSTEM MESSAGE
---------------------------------- */

export function buildSystemMessage(
  systemPrompt: string
): ReplayMessage {
  return {
    role: "system",
    content: systemPrompt,
  };
}

/* ----------------------------------
   BUILD MESSAGE STACK PR. TURN
---------------------------------- */

/**
 * Bygger message-stack frem til og med
 * bruger-input for et givent turnIndex.
 *
 * Output er deterministisk og kan bruges
 * direkte til replay / compare.
 */
export function buildMessagesForTurn(
  session: LoggedSession,
  systemPrompt: string,
  turnIndex: number
): ReplayMessage[] {
  const messages: ReplayMessage[] = [];

  // System prompt er altid først
  messages.push(buildSystemMessage(systemPrompt));

  for (let i = 0; i <= turnIndex; i++) {
    const turn = session.turns[i];
    if (!turn) break;

    messages.push({
      role: "user",
      content: turn.userText,
    });

    // Assistant-svar medtages kun
    // hvis vi bygger HISTORIK (i < turnIndex)
    if (i < turnIndex) {
      messages.push({
        role: "assistant",
        content: turn.assistantText,
      });
    }
  }

  return messages;
}

/* ----------------------------------
   BUILD REPLAY TURN (INPUT-DEL)
---------------------------------- */

export function buildReplayTurn(
  session: LoggedSession,
  systemPrompt: string,
  turnIndex: number
): ReplayTurn {
  const turn = session.turns[turnIndex];

  return {
    turnIndex,

    inputMessages: buildMessagesForTurn(
      session,
      systemPrompt,
      turnIndex
    ),

    // outputText sættes senere (af runner)
    outputText: "",

    chatStateBefore: turn.chatStateBefore,
    chatStateAfter: turn.chatStateAfter,

    isClosing: turn.isClosing,
  };
}
