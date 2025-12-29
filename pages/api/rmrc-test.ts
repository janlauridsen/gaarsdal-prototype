import { useState } from "react";

export default function RMRC_Test() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function send() {
    setLoading(true);
    setOutput(null);

    const res = await fetch("/api/rmrc-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input,
        profileId: "reflective_with_boundaries",
      }),
    });

    const data = await res.json();
    setOutput(data.output ?? null);
    setLogs(data.logs ?? []);
    setLoading(false);
  }

  return (
    <main style={{ padding: 40, maxWidth: 700 }}>
      <h1>RMRC Test</h1>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={4}
        style={{ width: "100%", marginBottom: 12 }}
      />

      <button onClick={send} disabled={loading}>
        {loading ? "..." : "Send"}
      </button>

      {output !== null && (
        <p style={{ marginTop: 20 }}>
          <strong>Output:</strong><br />
          {output}
        </p>
      )}

      {logs.length > 0 && (
        <details style={{ marginTop: 20 }}>
          <summary>Logs</summary>
          <pre>{JSON.stringify(logs, null, 2)}</pre>
        </details>
      )}
    </main>
  );
}
