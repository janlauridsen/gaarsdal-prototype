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

  function renderReadable(state: any) {
    if (!state) return null;

    return (
      <div style={{ lineHeight: 1.6 }}>
        <h3>Active Node</h3>
        <p>
          <strong>{state.active_node}</strong>
        </p>

        <h3>Status</h3>
        <p>{state.status}</p>

        <h3>Revision</h3>
        <p>{state.revision}</p>

        <h3>Allowed Transitions</h3>
        <ul>
          {(state.allowed_transitions || []).map((t: string) => (
            <li key={t}>{t}</li>
          ))}
        </ul>

        <h3>Meta</h3>
        <pre
          style={{
            background: "#111",
            padding: 12,
            overflowX: "auto",
          }}
        >
          {JSON.stringify(state.meta, null, 2)}
        </pre>

        <h3>Parentese Stack</h3>
        <pre>{JSON.stringify(state.parentese_stack, null, 2)}</pre>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* LEFT PANEL */}
      <div
        style={{
          width: 320,
          borderRight: "1px solid #333",
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
              background: selected === id ? "#222" : "transparent",
            }}
          >
            {id}
          </div>
        ))}
      </div>

      {/* RIGHT PANEL */}
      <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>
        <div style={{ marginBottom: 12 }}>
          <button onClick={() => setRaw(!raw)}>
            {raw ? "Readable View" : "Raw JSON"}
          </button>
        </div>

        {!data && <p>Select a conversation</p>}

        {data && (
          <>
            <p>
              <strong>Key:</strong> {data.key}
            </p>
            <p>
              <strong>TTL (ms):</strong> {data.ttl_ms}
            </p>

            {raw ? (
              <pre
                style={{
                  background: "#111",
                  padding: 16,
                  overflowX: "auto",
                }}
              >
                {JSON.stringify(data.state, null, 2)}
              </pre>
            ) : (
              renderReadable(data.state)
            )}
          </>
        )}
      </div>
    </div>
  );
}
