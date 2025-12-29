import { useState } from "react";

interface LogEvent {
  type: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

export default function RMRCConsole() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [loading, setLoading] = useState(false);

  async function runTurn() {
    if (!input.trim()) return;

    setLoading(true);
    setOutput(null);
    setLogs([]);

    try {
      const res = await fetch("/api/rmrc-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input,
          profileId: "reflective_with_boundaries",
        }),
      });

      const data = await res.json();

      setOutput(data.output ?? "— stilhed —");
      setLogs(data.logs ?? []);
    } catch (err) {
      setOutput("Fejl ved kald til RMRC.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-4xl mx-auto p-10 space-y-10">
      <h1 className="text-h1 font-light">
        RMRC · Test Console
      </h1>

      {/* Input */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Input</h2>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={4}
          className="w-full p-4 border border-gray-300 rounded-lg bg-white"
          placeholder="Skriv et input til systemet…"
        />
        <button
          onClick={runTurn}
          disabled={loading}
          className="px-6 py-2 rounded-lg bg-accent text-white disabled:opacity-50"
        >
          {loading ? "Kører…" : "Send"}
        </button>
      </section>

      {/* Output */}
      <section className="space-y-2">
        <h2 className="text-lg font-medium">Output</h2>
        <div className="p-4 bg-white border border-gray-200 rounded-lg animate-fadeIn whitespace-pre-wrap">
          {output ?? "—"}
        </div>
      </section>

      {/* Logs */}
      <section className="space-y-2">
        <h2 className="text-lg font-medium">Logs</h2>
        <div className="p-4 bg-white border border-gray-200 rounded-lg text-sm space-y-2 max-h-[400px] overflow-auto">
          {logs.length === 0 && (
            <div className="text-muted">Ingen logs</div>
          )}

          {logs.map((log, idx) => (
            <div key={idx} className="border-b border-gray-100 pb-2">
              <div className="font-mono text-xs text-gray-600">
                {new Date(log.timestamp).toLocaleTimeString()} ·{" "}
                <strong>{log.type}</strong>
              </div>
              {log.data && (
                <pre className="mt-1 text-xs text-gray-700">
                  {JSON.stringify(log.data, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
