import { LogEvent } from "./types";
import { SessionEvaluation, TurnEvaluation } from "./evaluationTypes";

export function evaluateSession(
  logs: LogEvent[]
): SessionEvaluation {
  const turns: Record<number, TurnEvaluation> = {};
  let currentTurn = 0;

  for (const log of logs) {
    if (log.type === "turn_index") {
      currentTurn = log.data.turnIndex;
      turns[currentTurn] = {
        turnIndex: currentTurn,
        rolesInvoked: [],
        rolesSkipped: [],
        boardsActive: [],
        outputProduced: false,
        notes: [],
      };
    }

    const turn = turns[currentTurn];
    if (!turn) continue;

    if (log.type === "board_activated") {
      turn.boardsActive.push(log.data.boardId);
    }

    if (log.type === "role_invoked") {
      turn.rolesInvoked.push(log.data.roleId);
    }

    if (log.type === "role_skipped") {
      turn.rolesSkipped.push({
        roleId: log.data.roleId,
        reason: log.data.reason,
      });
    }

    if (log.type === "output_emitted") {
      turn.outputProduced = true;
    }
  }

  const allRolesInvoked = Object.values(turns)
    .flatMap(t => t.rolesInvoked);

  const roleFrequency: Record<string, number> = {};
  for (const r of allRolesInvoked) {
    roleFrequency[r] = (roleFrequency[r] || 0) + 1;
  }

  const dominantRoles = Object.entries(roleFrequency)
    .filter(([_, c]) => c > 1)
    .map(([r]) => r);

  const silentTurns = Object.values(turns)
    .filter(t => !t.outputProduced)
    .map(t => t.turnIndex);

  return {
    turnCount: Object.keys(turns).length,
    evaluations: Object.values(turns),
    observations: {
      silentTurns,
      dominantRoles,
      unusedRoles: [],
    },
  };
}
