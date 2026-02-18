// pages/state.tsx

import { useEffect, useState } from "react";

type StateResponse = {
  key: string;
  ttl_ms: number | null;
  state: any;
};

export default function StatePage() {
  const [conversations, setConversations] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [data, setData] = useState<StateResponse | null>(null);
  const [raw, setRaw] = useState(false);

  useEffect(() => {
    fetch("/api/state")
      .then((r) => r.json())
      .then((d) => setConversations(d.conversations || []));
  }, []);

  useEffect(() => {
    if (!selected) return;
    fetch(`/api/state?conversation_id=${selected}`)
      .then((r) => r.json())
      .then(setData);
  }, [selected]);

  function Box({ children }: { children: React.ReactNode }) {
    return (
      <div
        style={{
          background: "#f5f5f5",
          padding: 16,
          borderRadius: 8,
          border: "1px solid #e0e0e0",
          marginBottom: 16,
        }}
      >
        {children}
      </div>
    );
  }

  function CodeBlock({ value }: { value: any }) {
    return (
      <pre
        style={{
          background: "#fafafa",
          padding: 16,
          borderRadius: 8,
          border: "1px solid #e0e0e0",
          overflowX: "auto",
          fontSize: 13,
          lineHeight: 1.5,
        }}
      >
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  function renderReadable(state: any) {
    if (!state) return null;

    return (
      <>
        <Box>
          <h3>Active Node</h3>
          <p><strong>{state.active_node}</strong></p>

          <h3>Status</h3>
          <p>{state.status}</p>

          <h3>Revision</h3>
          <p>{state.revision}</p>
        </Box>

        <Box>
          <h3>Allowed Transitions</h3>
          <ul>
            {(state.allowed_transitions || []).map((t: string) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </Box>

        <Box>
          <h3>Meta</h3>
          <CodeBlock value={state.meta} />
        </Box>

        <Box>
          <h3>Parentese Stack</h3>
          <CodeBlock value={state.parentese_stack} />
        </Box>
      </>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "sans-serif" }}>
      {/* LEFT PANEL */}
      <div
        style={{
          width: 320,
          borderRight: "1px solid #e0e0e0",
          padding: 16,
          overflowY: "auto",
        }}
      >
        <h2>States</h2>
        {conversations.map((id) => (
          <div
            key={id}
            onClick={() => setSelected(id)}
            style={{
              padding: 8,
              cursor: "pointer",
              background: selected === id ? "#eaeaea" : "transparent",
              borderRadius: 6,
              marginBottom: 4,
            }}
          >
            {id}
          </div>
        ))}
      </div>

      {/* RIGHT PANEL */}
      <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => setRaw(!raw)}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #ccc",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            {raw ? "Readable View" : "Raw JSON"}
          </button>
        </div>

        {!data && <p>Select a conversation</p>}

        {data && (
          <>
            <Box>
              <p><strong>Key:</strong> {data.key}</p>
              <p><strong>TTL (ms):</strong> {data.ttl_ms}</p>
            </Box>

            {raw ? (
              <CodeBlock value={data.state} />
            ) : (
              renderReadable(data.state)
            )}
          </>
        )}
      </div>
    </div>
  );
}
