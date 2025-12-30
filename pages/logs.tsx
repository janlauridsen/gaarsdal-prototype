import { useEffect, useState } from "react";

/* ---------- Types ---------- */

interface LogEvent {
  type: string;
  timestamp: number;
  data?: Record<string, any>;
}

interface TurnSummary {
  turnIndex: number;
  boards: string[];
  rolesInvoked: string[];
  rolesSkipped: { roleId: string; reason?: string }[];
  outputEmitted: boolean;
}

/* ---------- Helpers ---------- */

function groupLogsByTurn(logs: LogEvent[]) {
  const turns: Record<number, LogEvent[]> = {};
  let currentTurn = 0;

  for (const log of logs) {
    if (log.type === "turn_index" && log.data?.turnIndex) {
      currentTurn = log.data.turnIndex;
      if (!turns[currentTurn]) turns[currentTurn] = [];
    }

    if (!turns[currentTurn]) {
      turns[currentTurn] = [];
    }

    turns[currentTurn].push(log);
  }

  return turns;
}

function summarizeTurn(turnIndex: number, logs: LogEvent[]): TurnSummary {
  const boards = new Set<string>();
  const rolesInvoked = new Set<string>();
  const rolesSkipped: { roleId: string; reason?: string }[] = [];
  let outputEmitted = false;

  for (const log of logs) {
    if (log.type === "board_activated") {
      boards.add(log.data?.boardId);
    }

    if (log.type === "role_invoked") {
      rolesInvoked.add(log.data?.roleId);
    }

    if (log.type === "role_skipped") {
      rolesSkipped.push({
        roleId: log.data?.roleId,
        reason: log.data?.reason,
      });
    }

    if (log.type === "output_emitted") {
      outputEmitted = true;
    }
  }

  return {
    turnIndex,
    boards: Array.from(boards),
    rolesInvoked: Array.from(rolesInvoked),
    rolesSkipped,
    outputEmitted,
  };
}

/* ---------- Page ---------- */

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const turns = groupLogsByTurn(logs);

  useEffect(() => {
    fetch("/api/rmrc-logs")
      .then((r) => r.json())
      .then((d) => setLogs(d.logs ?? []));
  }, []);

  return (
    <main className="p-10 max-w-5xl mx-auto">
      <h1 className="text-h1 mb-8">RMRC · Session Workbench</h1>

      {Object.entries(turns).map(([turnIndex, turnLogs]) => {
        const summary = summarizeTurn(Number(turnIndex), turnLogs);

        return (
          <section
            key={turnIndex}
            className="mb-8 bg-white rounded-xl border border-gray-200 shadow-sm"
          >
            {/* --- Turn Header --- */}
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-medium">
                Turn {summary.turnIndex}
              </h2>

              <span className="text-sm text-muted">
                {summary.outputEmitted ? "Output emitted" : "No output"}
              </span>
            </div>

            {/* --- Turn Summary --- */}
            <div className="px-6 py-4 grid grid-cols-3 gap-6 text-sm">
              <div>
                <h3 className="font-medium mb-1">Boards</h3>
                {summary.boards.length === 0 ? (
                  <span className="text-muted">None</span>
                ) : (
                  <ul className="list-disc list-inside">
                    {summary.boards.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="font-medium mb-1">Roles Invoked</h3>
                {summary.rolesInvoked.length === 0 ? (
                  <span className="text-muted">None</span>
                ) : (
                  <ul className="list-disc list-inside">
                    {summary.rolesInvoked.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="font-medium mb-1">Roles Silent</h3>
                {summary.rolesSkipped.length === 0 ? (
                  <span className="text-muted">None</span>
                ) : (
                  <ul className="list-disc list-inside">
                    {summary.rolesSkipped.map((r, i) => (
                      <li key={i}>
                        {r.roleId}
                        {r.reason && (
                          <span className="text-muted">
                            {" "}
                            ({r.reason})
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* --- Raw Logs (foldable later) --- */}
            <details className="px-6 pb-4 text-xs">
              <summary className="cursor-pointer text-muted">
                Show raw logs
              </summary>
              <pre className="bg-bg p-3 rounded mt-2 overflow-x-auto">
                {JSON.stringify(turnLogs, null, 2)}
              </pre>
            </details>
          </section>
        );
      })}
    </main>
  );
}
