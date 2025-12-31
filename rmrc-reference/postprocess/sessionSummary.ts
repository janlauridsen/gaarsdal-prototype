import { LogEvent } from "./types";
import { summarizeTurns } from "./turnSummary";

export function summarizeSession(logs: LogEvent[]) {
  const turns = summarizeTurns(logs);

  return {
    turnCount: turns.length,
    turns,
    rolesUsed: Array.from(
      new Set(
        turns.flatMap(t =>
          t.roles.map(r => r.roleId)
        )
      )
    ),
  };
}
