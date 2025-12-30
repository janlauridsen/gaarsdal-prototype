import { useEffect, useState } from "react";

interface LogEvent {
  type: string;
  timestamp: number;
  data?: Record<string, any>;
}

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
      return { color: "border-yellow-200", icon: "…"};

    default:
      return { color: "border-gray-200", icon: "•" };
  }
}


export default function LogsPage() {
  const [logs, setLogs] = useState<LogEvent[]>([]);

  useEffect(() => {
    fetch("/api/rmrc-logs")
      .then((r) => r.json())
      .then((d) => setLogs(d.logs));
  }, []);

  return (
    <main className="p-10 max-w-4xl mx-auto">
      <h1 className="text-h1 mb-6">RMRC · Session Log</h1>

      <div className="space-y-3">
        {logs.map((log, i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 rounded-lg p-4 text-sm animate-fadeIn"
          >
            <div className="flex justify-between mb-1">
              <span className="font-medium">{log.type}</span>
              <span className="text-muted">{log.timestamp}</span>
            </div>

            {log.data && (
              <pre className="text-xs bg-bg p-2 rounded mt-2 overflow-x-auto">
                {JSON.stringify(log.data, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
