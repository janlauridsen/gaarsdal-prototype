import { useEffect, useState } from "react";
import {
  summarizeSession,
} from "../rmrc-reference/postprocess";

export default function LogsPage() {
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetch("/api/rmrc-logs")
      .then(r => r.json())
      .then(d => {
        setSummary(
          summarizeSession(d.logs)
        );
      });
  }, []);

  if (!summary) {
    return <main className="p-10">Loading logs…</main>;
  }

  return (
    <main className="p-10 max-w-4xl mx-auto">
      <h1 className="text-h1 mb-6">
        RMRC · Session Summary
      </h1>

      {summary.turns.map((turn: any) => (
        <div
          key={turn.turnIndex}
          className="bg-white border rounded-xl p-4 mb-6"
        >
          <h2 className="font-medium mb-2">
            Turn {turn.turnIndex}
          </h2>

          <div className="text-sm text-muted mb-2">
            Boards: {turn.boards.join(", ") || "—"}
          </div>

          <div className="space-y-1 text-sm">
            {turn.roles.map((r: any, i: number) => (
              <div key={i}>
                {r.status === "invoked"
                  ? "🗣️"
                  : "🤐"}{" "}
                {r.roleId}
                {r.reason
                  ? ` (${r.reason})`
                  : ""}
              </div>
            ))}
          </div>

          <div className="mt-3 text-sm">
            Output emitted:{" "}
            {turn.outputsEmitted ? "✅" : "—"}
          </div>
        </div>
      ))}
    </main>
  );
}
