import type {
  LoggedSession,
  ReplayResult,
  ReplayTurn,
  ReplayMessage,
  ReplayContext,
} from "./replay-types";

/**
 * Genskaber en session turn-for-turn baseret på loggede data.
 * Ingen netværkskald. Ingen sideeffekter.
 */
export function replaySession(
  session: LoggedSession,
  context: ReplayContext
): ReplayResult {
  const turns: ReplayTurn[] = [];

  const history: ReplayMessage[] = [
    {
      role: "system",
      content: context.systemPrompt,
    },
  ];

  let closingTurnIndex: number | undefined;
  let repeatedClosing = false;

  for (const turn of session.turns) {
    // input = system + historik + current user
    const inputMessages: ReplayMessage[] = [
      ...history,
      { role: "user", content: turn.userText },
    ];

    turns.push({
      turnIndex: turn.turnIndex,
      inputMessages,
      outputText: turn.assistantText,
      chatStateBefore: turn.chatStateBefore,
      chatStateAfter: turn.chatStateAfter,
      isClosing: turn.isClosing,
    });

    // opdater historik (immutabelt)
    history.push(
      { role: "user", content: turn.userText },
      { role: "assistant", content: turn.assistantText }
    );

    if (turn.isClosing) {
      if (closingTurnIndex === undefined) {
        closingTurnIndex = turn.turnIndex;
      } else {
        repeatedClosing = true;
      }
    }
  }

  return {
    sessionId: session.sessionId,
    promptVersion: session.promptVersion,
    model: session.model,

    totalTurns: turns.length,
    turns,

    summary: {
      hasClosing: closingTurnIndex !== undefined,
      closingTurnIndex,
      repeatedClosing,
    },
  };
}
