import { useEffect, useState } from "react";

interface LogEvent {
  type: string;
  timestamp: number;
  data?: Record<string, any>;
}

/**
 * Group log events by turnIndex.
 * Pure structural grouping – no interpretation.
 */
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

/**
 * Visual semantics for log events
 */
function eventStyle(type: string) {
  switch (type) {
    case "session_started":
      return { color: "border-green-400", icon: "▶️" };
    case "session_ended":
      return { color: "border-red-400", icon: "⏹️" };

    case "turn_started":
      return { color: "border-blue-400", icon: "🔁" };
    case "turn_index":
      return { color: "border-blue-200", icon: "🔢" };

    case "board_activated":
      return { color: "border-purple-400", icon: "🧩" };

    case "role_invoked":
      return { color: "border-gray-400", icon: "🗣️" };
    case "role_skipped":
      return { color: "border-yellow-400", icon: "🤐" };

    case "output_emitted":
      return { color: "border-black", icon: "💬" };
    case "silence_emitted":
      return { color: "border-yellow-200", icon: "…" };

    default:
      return { color: "border-gray-200", icon: "•" };
  }
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const turns = groupLogsByTurn(logs);

  useEffect(() => {
    fetch("/api/rmrc-logs")
      .then((r) => r.json())
      .then((d) => setLogs(d.logs));
  }, []);

  return (
    <main className="p-10 max-w-4xl mx-auto">
      <h1 className="text-h1 mb-6">RMRC · Session Log</h1>

      <div className="space-y-6">
        {Object.entries(turns).map(([turnIndex, events]) => (
          <details
            key={turnIndex}
            open
            className="bg-bg rounded-xl border border-gray-300 p-4"
          >
            <summary className="cursor-pointer font-medium text-lg mb-3">
              🔁 Turn {turnIndex}
            </summary>

            <div className="space-y-3">
              {events.map((log, i) => {
                const style = eventStyle(log.type);

                return (
                  <div
                    key={i}
                    className={`bg-white border-l-4 ${style.color} rounded-lg p-4 text-sm animate-fadeIn`}
                  >
                    <div className="flex justify-between mb-1">
                      <span className="font-medium flex items-center gap-2">
                        <span>{style.icon}</span>
                        <span>{log.type}</span>
                      </span>
                      <span className="text-muted">{log.timestamp}</span>
                    </div>

                    {log.data && (
                      <pre className="text-xs bg-bg p-2 rounded mt-2 overflow-x-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                  </div>
                );
              })}
            </div>
          </details>
        ))}
      </div>
    </main>
  );
}
