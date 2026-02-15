import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "./Chatbot.module.css";

type ChatInput =
  | { type: "SYSTEM_INIT" }
  | { type: "FREE_TEXT"; text: string }
  | { type: "EXPLICIT_TRANSITION"; target: string };

type ConversationState = {
  conversation_id: string;
  revision: number;
  active_node: string;
  active_node_message: string;
  allowed_transitions: string[];
  meta: Record<string, unknown>;
  status: "active" | "completed";
  parentese_stack: unknown[];
};

type ChatResponse = {
  state: ConversationState;
  transition: {
    type: "INIT" | "NODE_HOP";
    from_node: string | null;
    to_node: string;
    response_message?: string;
  };
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const SANDBOX_FIELDS: Array<{
  key:
    | "topic"
    | "goal"
    | "time_patterns"
    | "situational_triggers"
    | "relational_patterns"
    | "preferred_tone"
    | "support_direction"
    | "interest_in_methods";
  label: string;
  placeholder: string;
}> = [
  { key: "topic", label: "Tema", placeholder: "Fx: alkohol om aftenen" },
  { key: "goal", label: "Mål", placeholder: "Fx: drikke mindre" },
  { key: "time_patterns", label: "Tid / mønster", placeholder: "Fx: aftenen" },
  { key: "situational_triggers", label: "Udløsere", placeholder: "Fx: arbejdsstress" },
  { key: "relational_patterns", label: "Relationer", placeholder: "Fx: familien" },
  { key: "preferred_tone", label: "Tone", placeholder: "Fx: rolig og direkte" },
  { key: "support_direction", label: "Hjælperetning", placeholder: "Fx: ro før jeg kommer hjem" },
  { key: "interest_in_methods", label: "Metoder (liste)", placeholder: "Fx: gåtur; pause; registrering" },
];

function mkId() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

async function postChat(state: ConversationState | null, input: ChatInput): Promise<ChatResponse> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ state, input }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}${text ? `: ${text}` : ""}`);
  }

  return (await res.json()) as ChatResponse;
}

function pickAssistantMessage(payload: ChatResponse): string {
  return (
    payload.transition.response_message ??
    payload.state.active_node_message ??
    "Der opstod en ukendt fejl (manglende svartekst)."
  );
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [state, setState] = useState<ConversationState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");

  // Sandbox-form UI state (kun brugt når active_node === DEV_SANDBOX_FORM)
  const [sandboxForm, setSandboxForm] = useState<Record<string, string>>(() =>
    Object.fromEntries(SANDBOX_FIELDS.map((f) => [f.key, ""]))
  );

  const listRef = useRef<HTMLDivElement | null>(null);

  const allowedTransitions = useMemo(() => state?.allowed_transitions ?? [], [state]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [open, messages.length]);

  // Lazy init: først når chat åbnes
  useEffect(() => {
    if (!open) return;
    if (initialized) return;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const payload = await postChat(null, { type: "SYSTEM_INIT" });
        setState(payload.state);
        setMessages([{ id: mkId(), role: "assistant", content: pickAssistantMessage(payload) }]);
        setInitialized(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Init fejlede");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, initialized]);

  async function sendFreeText(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (!state) {
      setError("State mangler (prøv at lukke/åbne chatten igen).");
      return;
    }

    const userMsg: ChatMessage = { id: mkId(), role: "user", content: trimmed };
    setMessages((m) => [...m, userMsg]);
    setDraft("");
    setError(null);

    try {
      setLoading(true);
      const payload = await postChat(state, { type: "FREE_TEXT", text: trimmed });
      setState(payload.state);

      const assistantMsg: ChatMessage = { id: mkId(), role: "assistant", content: pickAssistantMessage(payload) };
      setMessages((m) => [...m, assistantMsg]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request fejlede");
    } finally {
      setLoading(false);
    }
  }

  async function sendTransition(target: string) {
    if (!state) return;

    setError(null);
    try {
      setLoading(true);
      const payload = await postChat(state, { type: "EXPLICIT_TRANSITION", target });
      setState(payload.state);

      const assistantMsg: ChatMessage = { id: mkId(), role: "assistant", content: pickAssistantMessage(payload) };
      setMessages((m) => [...m, assistantMsg]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transition fejlede");
    } finally {
      setLoading(false);
    }
  }

  function formatSandboxFormToText(values: Record<string, string>): string {
    const lines: string[] = [];
    for (const f of SANDBOX_FIELDS) {
      const raw = (values[f.key] ?? "").trim();
      if (!raw) continue;
      lines.push(`${f.key}: ${raw}`);
    }
    return lines.join("\n");
  }

  function isSandboxFormNode() {
    return state?.active_node === "DEV_SANDBOX_FORM";
  }

  function loadSandboxExample() {
    setSandboxForm({
      topic: "alkohol om aftenen",
      goal: "drikke mindre",
      time_patterns: "aftenen",
      situational_triggers: "arbejdsstress",
      relational_patterns: "familien",
      preferred_tone: "rolig og direkte",
      support_direction: "ro før jeg kommer hjem",
      interest_in_methods: "gåtur; pause; registrering",
    });
  }

  const overlay = open ? (
    <div className={styles.overlay} role="presentation" onClick={() => setOpen(false)} aria-hidden="true" />
  ) : null;

  return (
    <>
      {overlay}

      {!open ? (
        <button type="button" className={styles.fab} aria-label="Åbn chat" onClick={() => setOpen(true)}>
          <span className={styles.fabIcon} aria-hidden="true">
            💬
          </span>
          <span className={styles.fabLabel}>Chat</span>
        </button>
      ) : (
        <div className={styles.panel} role="dialog" aria-label="Gaarsdal Chat" aria-modal="true">
          <div className={styles.header}>
            <div className={styles.title}>Gaarsdal Chat</div>
            <div className={styles.headerActions}>
              {state?.active_node ? <span className={styles.badge}>{state.active_node}</span> : null}
              <button type="button" className={styles.iconBtn} onClick={() => setOpen(false)} aria-label="Luk">
                ✕
              </button>
            </div>
          </div>

          <div className={styles.body} ref={listRef}>
            {messages.map((m) => (
              <div key={m.id} className={m.role === "user" ? styles.msgUser : styles.msgAssistant}>
                <div className={styles.msgBubble}>{m.content}</div>
              </div>
            ))}

            {loading ? <div className={styles.statusLine}>Arbejder…</div> : null}
            {error ? <div className={styles.errorBox}>Fejl: {error}</div> : null}

            {isSandboxFormNode() ? (
              <div className={styles.sandboxBox}>
                <div className={styles.sandboxTitle}>Sandbox – udfyld felter</div>
                <div className={styles.sandboxGrid}>
                  {SANDBOX_FIELDS.map((f) => (
                    <label key={f.key} className={styles.field}>
                      <span className={styles.fieldLabel}>{f.label}</span>
                      <input
                        className={styles.input}
                        value={sandboxForm[f.key] ?? ""}
                        placeholder={f.placeholder}
                        onChange={(e) => setSandboxForm((v) => ({ ...v, [f.key]: e.target.value }))}
                      />
                    </label>
                  ))}
                </div>

                <div className={styles.sandboxActions}>
                  <button type="button" className={styles.secondaryBtn} onClick={loadSandboxExample}>
                    Indsæt eksempel
                  </button>
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={() => sendFreeText(formatSandboxFormToText(sandboxForm))}
                    disabled={loading}
                  >
                    Send
                  </button>
                </div>
              </div>
            ) : null}

            {allowedTransitions.length ? (
              <div className={styles.transitions}>
                {allowedTransitions.map((t) => (
                  <button key={t} type="button" className={styles.chip} onClick={() => sendTransition(t)} disabled={loading}>
                    {t}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {!isSandboxFormNode() ? (
            <form
              className={styles.footer}
              onSubmit={(e) => {
                e.preventDefault();
                void sendFreeText(draft);
              }}
            >
              <input
                className={styles.input}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Skriv her…"
                disabled={loading}
              />
              <button type="submit" className={styles.primaryBtn} disabled={loading || !draft.trim()}>
                Send
              </button>
            </form>
          ) : (
            <div className={styles.footerHint}>Udfyld felterne ovenfor og tryk Send.</div>
          )}
        </div>
      )}
    </>
  );
}
