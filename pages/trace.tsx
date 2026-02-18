// pages/trace.tsx

import { useEffect, useMemo, useState } from "react";

type TurnGroup = {
  input_id: number | null;
  revision: number | null;
  started_at_ms: number | null;
  ended_at_ms: number | null;

  input_received?: any;
  transition_applied?: any[];
  node_rendered?: any;

  raw?: any;
  spine?: any[];
};

type TracePayload = {
  conversation_id: string;
  keys: Record<string, string>;
  ttl_ms: number | null;
  state: any;
  counts: { v1: number; spine: number; raw: number; groups: number };
  groups: TurnGroup[];
};

function fmtTTL(ms: number | null) {
  if (ms == null || ms < 0) return String(ms);
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

function fmtTime(ms: number | null) {
  if (ms == null) return "";
  try {
    return new Date(ms).toISOString();
  } catch {
    return String(ms);
  }
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

function pickLatency(spine?: any[]) {
  if (!Array.isArray(spine) || spine.length === 0) return null;
  // take max latency_ms in group as "turn latency"
  let best: number | null = null;
  for (const e of spine) {
    const v = typeof e?.latency_ms === "number" ? e.latency_ms : null;
    if (v == null) continue;
    if (best == null || v > best) best = v;
  }
  return best;
}

export default function TracePage() {
  const [conversations, setConversations] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [data, setData] = useState<TracePayload | null>(null);
  const [rawAll, setRawAll] = useState(false);
  const [limit, setLimit] = useState(500);

  // preselect from query param
  useEffect(() => {
    const url = new URL(window.location.href);
    const cid = url.searchParams.get("conversation_id");
    if (cid) setSelected(cid);
  }, []);

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
        <h2 style={{ marginTop: 0 }}>Trace (Grouped)</h2>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: "#444" }}>Limit (tail)</label>
          <div>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #ccc", width: "100%" }}
            >
              <option value={250}>250</option>
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
            onClick={() => setRawAll(!rawAll)}
            style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #ccc", background: "#fff", cursor: "pointer" }}
          >
            {rawAll ? "Readable View" : "Raw JSON (whole response)"}
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
                <strong>Counts:</strong> v1 {data.counts.v1} · spine {data.counts.spine} · raw {data.counts.raw} · groups {data.counts.groups}
              </div>
            </div>

            {rawAll ? (
              <CodeBlock value={data} />
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {data.groups.map((g, idx) => {
                  const transitions = Array.isArray(g.transition_applied) ? g.transition_applied : [];
                  const latency = pickLatency(g.spine);
                  const renderedMsg = g.node_rendered?.payload?.message ?? g.node_rendered?.payload?.node_id ?? null;

                  const userText = g.raw?.user_input ?? "";
                  const assistantText = g.raw?.assistant_output ?? "";

                  const nodeRendered = g.node_rendered?.payload?.node_id ?? g.node_rendered?.node_id ?? null;
                  const nodeFromTransition = transitions[transitions.length - 1]?.payload?.transition?.to ?? null;

                  const node = nodeRendered ?? nodeFromTransition ?? "";

                  return (
                    <div key={`${g.input_id ?? "null"}-${idx}`} style={{ border: "1px solid #e0e0e0", borderRadius: 10, padding: 14, background: "#fff" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                        <div style={{ fontSize: 12, color: "#555" }}>
                          <strong>Turn</strong> #{g.input_id ?? "?"} · rev {g.revision ?? "?"} · {fmtTime(g.started_at_ms)}
                        </div>
                        <div style={{ fontSize: 12, color: "#555" }}>
                          node <strong>{node}</strong>
                          {latency != null ? ` · latency ${latency}ms` : ""}
                        </div>
                      </div>

                      {(userText || assistantText) && (
                        <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
                          {userText && (
                            <div>
                              <div style={{ fontSize: 12, color: "#444", marginBottom: 4 }}><strong>User</strong></div>
                              <div style={{ whiteSpace: "pre-wrap" }}>{userText}</div>
                            </div>
                          )}
                          {assistantText && (
                            <div>
                              <div style={{ fontSize: 12, color: "#444", marginBottom: 4 }}><strong>Assistant</strong></div>
                              <div style={{ whiteSpace: "pre-wrap" }}>{assistantText}</div>
                            </div>
                          )}
                        </div>
                      )}

                      {renderedMsg && typeof renderedMsg === "string" && renderedMsg.length < 200 && (
                        <div style={{ marginTop: 10, fontSize: 12, color: "#333", background: "#f8f8f8", border: "1px solid #eee", borderRadius: 8, padding: 10 }}>
                          <strong>Rendered:</strong> {renderedMsg}
                        </div>
                      )}

                      <details style={{ marginTop: 12 }}>
                        <summary style={{ cursor: "pointer", fontSize: 12, color: "#0b57d0" }}>Details (v1 / spine / raw)</summary>
                        <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                          {g.input_received && (
                            <div>
                              <div style={{ fontSize: 12, color: "#444", marginBottom: 6 }}><strong>v1.input_received</strong></div>
                              <CodeBlock value={g.input_received} />
                            </div>
                          )}

                          {transitions.length > 0 && (
                            <div>
                              <div style={{ fontSize: 12, color: "#444", marginBottom: 6 }}><strong>v1.transition_applied ({transitions.length})</strong></div>
                              <CodeBlock value={transitions} />
                            </div>
                          )}

                          {g.node_rendered && (
                            <div>
                              <div style={{ fontSize: 12, color: "#444", marginBottom: 6 }}><strong>v1.node_rendered</strong></div>
                              <CodeBlock value={g.node_rendered} />
                            </div>
                          )}

                          {Array.isArray(g.spine) && g.spine.length > 0 && (
                            <div>
                              <div style={{ fontSize: 12, color: "#444", marginBottom: 6 }}><strong>spine ({g.spine.length})</strong></div>
                              <CodeBlock value={g.spine} />
                            </div>
                          )}

                          {g.raw && (
                            <div>
                              <div style={{ fontSize: 12, color: "#444", marginBottom: 6 }}><strong>raw</strong></div>
                              <CodeBlock value={g.raw} />
                            </div>
                          )}
                        </div>
                      </details>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
