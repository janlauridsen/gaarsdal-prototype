// pages/trace.tsx

import { useEffect, useMemo, useState } from "react";

type TracePayload = {
  conversation_id: string;
  keys: Record<string, string>;
  ttl_ms: number | null;
  state: any;
  counts: { v1: number; spine: number; raw: number; timeline: number };
  timeline: Array<{
    kind: "v1" | "spine" | "raw";
    t_ms: number | null;
    t_iso: string | null;
    summary: string;
    data: any;
  }>;
};

function fmtTTL(ms: number | null) {
  if (ms == null || ms < 0) return String(ms);
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

function CodeBlock({ value }: { value: any }) {
  return (
    <pre
      style={{
        background: "#fafafa",
        padding: 12,
        borderRadius: 8,
        border: "1px solid #e0e0e0",
        overflowX: "auto",
        fontSize: 13,
        lineHeight: 1.5,
        margin: 0,
      }}
    >
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export default function TracePage() {
  const [conversations, setConversations] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [data, setData] = useState<TracePayload | null>(null);
  const [raw, setRaw] = useState(false);
  const [limit, setLimit] = useState(250);

  useEffect(() => {
    fetch("/api/trace")
      .then((r) => r.json())
      .then((d) => setConversations(d.conversations || []));
  }, []);

  useEffect(() => {
    if (!selected) return;
    fetch(`/api/trace?conversation_id=${encodeURIComponent(selected)}&limit=${limit}`)
      .then((r) => r.json())
      .then(setData);
  }, [selected, limit]);

  const header = useMemo(() => {
    if (!data) return null;
    return {
      active_node: data.state?.active_node,
      status: data.state?.status,
      revision: data.state?.revision,
    };
  }, [data]);

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "sans-serif" }}>
      {/* LEFT */}
      <div style={{ width: 360, borderRight: "1px solid #e0e0e0", padding: 16, overflowY: "auto" }}>
        <h2 style={{ marginTop: 0 }}>Trace</h2>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: "#444" }}>Limit</label>
          <div>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #ccc", width: "100%" }}
            >
              <option value={100}>100</option>
              <option value={250}>250</option>
              <option value={500}>500</option>
              <option value={1000}>1000</option>
            </select>
          </div>
        </div>

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
              wordBreak: "break-word",
              fontSize: 13,
            }}
          >
            {id}
          </div>
        ))}
      </div>

      {/* RIGHT */}
      <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <button
            onClick={() => setRaw(!raw)}
            style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}
          >
            {raw ? "Readable View" : "Raw JSON"}
          </button>

          {data?.conversation_id && (
            <a
              href={`/conversation?conversation_id=${encodeURIComponent(data.conversation_id)}`}
              style={{ fontSize: 13, color: "#0b57d0", textDecoration: "none" }}
            >
              Open /conversation
            </a>
          )}
        </div>

        {!data && <p>Select a conversation</p>}

        {data && (
          <>
            <div style={{ background: "#f5f5f5", padding: 16, borderRadius: 8, border: "1px solid #e0e0e0", marginBottom: 16 }}>
              <div style={{ fontSize: 13, marginBottom: 6 }}><strong>Conversation:</strong> {data.conversation_id}</div>
              <div style={{ fontSize: 13, marginBottom: 6 }}><strong>TTL:</strong> {fmtTTL(data.ttl_ms)} ({data.ttl_ms} ms)</div>
              <div style={{ fontSize: 13, marginBottom: 6 }}><strong>State:</strong> {header?.active_node} · {header?.status} · rev {header?.revision}</div>
              <div style={{ fontSize: 13 }}>
                <strong>Counts:</strong> v1 {data.counts.v1} · spine {data.counts.spine} · raw {data.counts.raw} · timeline {data.counts.timeline}
              </div>
            </div>

            {raw ? (
              <CodeBlock value={data} />
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {data.timeline.map((row, idx) => (
                  <div
                    key={`${row.kind}-${idx}`}
                    style={{
                      border: "1px solid #e0e0e0",
                      borderRadius: 8,
                      padding: 12,
                      background: "#fff",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ fontSize: 12, color: "#555" }}>
                        <strong>{row.kind.toUpperCase()}</strong> · {row.t_iso ?? (row.t_ms ?? "")}
                      </div>
                      <div style={{ fontSize: 12, color: "#555" }}>{row.summary}</div>
                    </div>

                    <div style={{ marginTop: 8 }}>
                      <CodeBlock value={row.data} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
