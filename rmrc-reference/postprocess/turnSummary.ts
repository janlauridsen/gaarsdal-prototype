import { LogEvent, TurnSummary } from "./types";

export function summarizeTurns(
  logs: LogEvent[]
): TurnSummary[] {
  const turns: Record<number, TurnSummary> = {};
  let currentTurn = 0;

  for (const log of logs) {
    if (log.type === "turn_index" && log.data?.turnIndex) {
      currentTurn = log.data.turnIndex;
      turns[currentTurn] = {
        turnIndex: currentTurn,
        boards: [],
        roles: [],
        outputsEmitted: false,
      };
    }

    const turn = turns[currentTurn];
    if (!turn) continue;

    if (log.type === "board_activated") {
      turn.boards.push(log.data.boardId);
    }

    if (log.type === "role_invoked") {
      turn.roles.push({
        roleId: log.data.roleId,
        status: "invoked",
      });
    }

    if (log.type === "role_skipped") {
      turn.roles.push({
        roleId: log.data.roleId,
        status: "skipped",
        reason: log.data.reason,
      });
    }

    if (log.type === "output_emitted") {
      turn.outputsEmitted = true;
    }
  }

  return Object.values(turns);
}
