// pages/conversation.tsx

import { useEffect, useMemo, useState } from "react";

type ConversationPayload = {
  conversation_id: string;
  keys: Record<string, string>;
  state: any;
  turns: any[];
  count: number;
};

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

export default function ConversationPage() {
  const [conversations, setConversations] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [data, setData] = useState<ConversationPayload | null>(null);
  const [raw, setRaw] = useState(false);
  const [limit, setLimit] = useState(500);

  // preselect from query param
  useEffect(() => {
    const url = new URL(window.location.href);
    const cid = url.searchParams.get("conversation_id");
    if (cid) setSelected(cid);
  }, []);

  useEffect(() => {
    fetch("/api/conversation")
      .then((r) => r.json())
      .then((d) => setConversations(d.conversations || []));
  }, []);

  useEffect(() => {
    if (!selected) return;
    fetch(`/api/conversation?conversation_id=${encodeURIComponent(selected)}&limit=${limit}`)
      .then((r) => r.json())
      .then(setData);
  }, [selected, limit]);

  const stateHeader = useMemo(() => {
    if (!data?.state) return null;
    return {
      active_node: data.state.active_node,
      status: data.state.status,
      revision: data.state.revision,
      message: data.state.active_node_message,
    };
  }, [data]);

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "sans-serif" }}>
      {/* LEFT */}
      <div style={{ width: 360, borderRight: "1px solid #e0e0e0", padding: 16, overflowY: "auto" }}>
        <h2 style={{ marginTop: 0 }}>Conversation</h2>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: "#444" }}>Limit</label>
          <div>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #ccc", width: "100%" }}
            >
              <option value={200}>200</option>
              <option value={500}>500</option>
              <option value={1000}>1000</option>
              <option value={2000}>2000</option>
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
              href={`/trace?conversation_id=${encodeURIComponent(data.conversation_id)}`}
              style={{ fontSize: 13, color: "#0b57d0", textDecoration: "none" }}
            >
              Open /trace
            </a>
          )}
        </div>

        {!data && <p>Select a conversation</p>}

        {data && (
          <>
            <div style={{ background: "#f5f5f5", padding: 16, borderRadius: 8, border: "1px solid #e0e0e0", marginBottom: 16 }}>
              <div style={{ fontSize: 13, marginBottom: 6 }}><strong>Conversation:</strong> {data.conversation_id}</div>
              <div style={{ fontSize: 13, marginBottom: 6 }}>
                <strong>State:</strong> {stateHeader?.active_node} · {stateHeader?.status} · rev {stateHeader?.revision}
              </div>
              {stateHeader?.message && (
                <div style={{ fontSize: 13 }}><strong>Node message:</strong> {stateHeader.message}</div>
              )}
              <div style={{ fontSize: 13, marginTop: 6 }}><strong>Turns:</strong> {data.count}</div>
            </div>

            {raw ? (
              <CodeBlock value={data} />
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {data.turns.map((t, idx) => (
                  <div key={idx} style={{ border: "1px solid #e0e0e0", borderRadius: 8, padding: 12, background: "#fff" }}>
                    <div style={{ fontSize: 12, color: "#555", marginBottom: 8 }}>
                      {t?.ts ?? ""} · node {t?.node_id ?? ""} · {t?.input_type ?? ""}
                    </div>

                    <div style={{ display: "grid", gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 12, color: "#444", marginBottom: 4 }}><strong>User</strong></div>
                        <div style={{ whiteSpace: "pre-wrap" }}>{t?.user_input ?? ""}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: 12, color: "#444", marginBottom: 4 }}><strong>Assistant</strong></div>
                        <div style={{ whiteSpace: "pre-wrap" }}>{t?.assistant_output ?? ""}</div>
                      </div>

                      <details>
                        <summary style={{ cursor: "pointer", fontSize: 12, color: "#0b57d0" }}>Raw JSON</summary>
                        <div style={{ marginTop: 8 }}>
                          <CodeBlock value={t} />
                        </div>
                      </details>
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
