import type {
  LoggedSession,
  ReplayResult,
  ReplayTurn,
} from "./replay-types";

import { buildReplayTurn } from "./buildMessages";

/* ----------------------------------
   RUN SINGLE SESSION PLAYBACK
---------------------------------- */

/**
 * Kører et silent playback af en session.
 *
 * Bemærk:
 * - outputText sættes til det loggede assistant-svar
 * - ingen OpenAI-kald foretages her
 * - bruges til eval, compare og batch-analyse
 */
export function runPlaybackSession(
  session: LoggedSession,
  systemPrompt: string
): ReplayResult {
  const turns: ReplayTurn[] = [];

  let closingTurnIndex: number | undefined = undefined;
  let closingCount = 0;

  for (let i = 0; i < session.turns.length; i++) {
    const replayTurn = buildReplayTurn(
      session,
      systemPrompt,
      i
    );

    // Silent mode: brug logget assistant-svar
    replayTurn.outputText = session.turns[i].assistantText;

    if (replayTurn.isClosing) {
      closingCount++;
      if (closingTurnIndex === undefined) {
        closingTurnIndex = i;
      }
    }

    turns.push(replayTurn);
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
      repeatedClosing: closingCount > 1,
    },
  };
}
