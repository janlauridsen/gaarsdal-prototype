import { useEffect, useState } from "react";

interface LogEvent {
  type: string;
  timestamp: number;
  data?: Record<string, any>;
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
