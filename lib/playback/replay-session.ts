import type { ReplayInput, ReplayResult, ReplayStep } from "./replay-types";

/**
 * Replayer en allerede logget session.
 * Ingen netværkskald. Ingen sideeffekter.
 */
export function replaySession(input: ReplayInput): ReplayResult {
  const { meta, turns } = input;

  const steps: ReplayStep[] = turns.map((turn, index) => ({
    index,

    userText: turn.userText,
    assistantText: turn.assistantText,

    chatStateBefore: turn.chatStateBefore,
    chatStateAfter: turn.chatStateAfter,

    isClosing: turn.isClosing,
  }));

  return {
    sessionId: meta.sessionId,

    promptVersion: meta.promptVersion,
    model: meta.model,
    environment: meta.environment,

    startedAt: meta.startedAt,
    endedAt: meta.endedAt,

    steps,
  };
}
