import { useEffect, useState } from "react";

/* =========================
   Types
========================= */

interface LogEvent {
  type: string;
  timestamp: number;
  data?: Record<string, any>;
}

interface AnalysisNote {
  roleId: string;
  note: string;
}

/* =========================
   Helpers
========================= */

function groupLogsByTurn(logs: LogEvent[]) {
  const turns: Record<number, LogEvent[]> = {};
  let currentTurn = 0;

  for (const log of logs) {
    if (log.type === "turn_index" && log.data?.turnIndex) {
      currentTurn = log.data.turnIndex;
      if (!turns[currentTurn]) turns[currentTurn] = [];
    }

    if (!turns[currentTurn]) turns[currentTurn] = [];
    turns[currentTurn].push(log);
  }

  return turns;
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
      return { color: "border-yellow-200", icon: "…" };
    default:
      return { color: "border-gray-200", icon: "•" };
  }
}

/* =========================
   Page
========================= */

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisNote[]>([]);

  const turns = groupLogsByTurn(logs);

  useEffect(() => {
    fetch("/api/rmrc-logs")
      .then((r) => r.json())
      .then((d) => setLogs(d.logs));

    // 🔬 Mock analysis (lab-side placeholder)
    setAnalysis([
      {
        roleId: "dialog_coherence_evaluator",
        note:
          "Dialogen fremstår tematisk sammenhængende med gentagelse omkring fastlåsthed.",
      },
      {
        roleId: "missed_intervention_detector",
        note:
          "Dialog Navigator kunne hypotetisk have været aktiveret efter gentagelsen.",
      },
      {
        roleId: "experience_quality_reflector",
        note:
          "Systemets respons synes at have bevaret en ikke-presserende og tryg tone.",
      },
    ]);
  }, []);

  return (
    <main className="p-10 max-w-7xl mx-auto">
      <h1 className="text-h1 mb-8">RMRC · Session Workbench</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* ================= Runtime Logs ================= */}
        <section>
          <h2 className="text-xl font-medium mb-4">Runtime Log</h2>

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
                        className={`bg-white border-l-4 ${style.color} rounded-lg p-4 text-sm`}
                      >
                        <div className="flex justify-between mb-1">
                          <span className="font-medium flex items-center gap-2">
                            <span>{style.icon}</span>
                            <span>{log.type}</span>
                          </span>
                          <span className="text-muted">
                            {log.timestamp}
                          </span>
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
        </section>

        {/* ================= Analysis ================= */}
        <section>
          <h2 className="text-xl font-medium mb-4">Post-Analysis (Lab)</h2>

          <div className="space-y-4">
            {analysis.map((item, i) => (
              <div
                key={i}
                className="bg-white border border-gray-300 rounded-lg p-4 text-sm"
              >
                <div className="font-medium mb-2">
                  🧠 {item.roleId}
                </div>
                <p className="text-muted leading-relaxed">
                  {item.note}
                </p>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted mt-6">
            Analyse udføres udenfor runtime og påvirker ikke systemets adfærd.
          </p>
        </section>
      </div>
    </main>
  );
}
