import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  EnvelopeIcon,
  LinkIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

type StatePayload = {
  conversation_id: string;
  revision: number;
  active_node: string;
  active_node_message: string;
  allowed_transitions: string[];
  meta?: Record<string, any>;
  status?: string;
};

type Interaction = {
  role: "user" | "assistant";
  text: string;
  ts?: string;
};

const API_STATE = "/api/state";
const API_INTERACT = "/api/interact";

function iconClass() {
  return "gaarsdal-icon";
}

function isSandboxNode(nodeId: string) {
  return nodeId?.startsWith("DEV_SANDBOX_");
}

function isSandboxFormNode(nodeId: string) {
  return nodeId === "DEV_SANDBOX_FORM";
}

function isSandboxIntroNode(nodeId: string) {
  return nodeId === "DEV_SANDBOX_INTRO";
}

function isHomeNode(nodeId: string) {
  return nodeId === "HOME";
}

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function buildKeyValueText(values: Record<string, string>) {
  return Object.entries(values)
    .filter(([, v]) => (v ?? "").trim().length > 0)
    .map(([k, v]) => `${k}: ${v.trim()}`)
    .join("\n");
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const [state, setState] = useState<StatePayload | null>(null);
  const [messages, setMessages] = useState<Interaction[]>([]);
  const [input, setInput] = useState("");

  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI-friendly sandbox form state (client-side)
  const [sandboxValues, setSandboxValues] = useState<Record<string, string>>({
    topic: "",
    goal: "",
    time_patterns: "",
    situational_triggers: "",
    relational_patterns: "",
    preferred_tone: "",
    support_direction: "",
    interest_in_methods: "",
  });

  const [sandboxError, setSandboxError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const allowedTransitions = state?.allowed_transitions ?? [];
  const activeNode = state?.active_node ?? "";

  const showSandboxForm = useMemo(() => {
    return Boolean(state && isSandboxFormNode(state.active_node));
  }, [state]);

  const showSandboxIntroHelp = useMemo(() => {
    return Boolean(state && isSandboxIntroNode(state.active_node));
  }, [state]);

  const showTopicGrid = useMemo(() => {
    return Boolean(state && isHomeNode(state.active_node));
  }, [state]);

  const containerClass = useMemo(() => {
    const base = "gaarsdal-chatbot";
    const size = isExpanded ? " gaarsdal-chatbot--expanded" : " gaarsdal-chatbot--normal";
    return base + size;
  }, [isExpanded]);

  async function fetchState() {
    setError(null);
    const res = await fetch(API_STATE, { method: "GET" });
    if (!res.ok) throw new Error(`State fetch failed (${res.status})`);
    const data = (await res.json()) as StatePayload;
    setState(data);
    return data;
  }

  async function sendInteraction(text: string) {
    setIsSending(true);
    setError(null);
    try {
      const res = await fetch(API_INTERACT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const maybe = await res.text();
        throw new Error(maybe || `Interact failed (${res.status})`);
      }

      const payload = await res.json();

      // payload can vary; we keep a simple transcript in UI:
      const userMsg: Interaction = { role: "user", text };
      const assistantText =
        payload?.ai_response ??
        payload?.assistant_output_raw ??
        payload?.message ??
        payload?.active_node_message ??
        "";

      const botMsg: Interaction = {
        role: "assistant",
        text: String(assistantText),
      };

      setMessages((prev) => [...prev, userMsg, botMsg]);

      // refresh state after interaction
      await fetchState();
    } finally {
      setIsSending(false);
    }
  }

  async function boot() {
    try {
      const s = await fetchState();
      // seed UI with the active_node_message once, so chat feels “alive”
      if (s?.active_node_message) {
        setMessages([{ role: "assistant", text: s.active_node_message }]);
      }
    } catch (e: any) {
      setError(e?.message || "Kunne ikke hente state.");
    }
  }

  useEffect(() => {
    void boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen, isExpanded]);

  function onToggleExpanded() {
    setIsExpanded((v) => !v);
  }

  function onClose() {
    setIsOpen(false);
  }

  function onOpen() {
    setIsOpen(true);
  }

  async function onSubmitText() {
    const text = input.trim();
    if (!text || isSending) return;

    setInput("");
    await sendInteraction(text);
  }

  async function onTransition(nodeId: string) {
    if (isSending) return;
    await sendInteraction(`EXPLICIT_TRANSITION:${nodeId}`);
  }

  function renderQuickActions() {
    // These are UI-only; you can wire them to your own transitions if you want.
    return (
      <div className="gaarsdal-chip-group" aria-label="Quick actions">
        <button className="chip" type="button" onClick={() => void onTransition("HOME")} disabled={isSending}>
          Home
        </button>
        <button className="chip" type="button" onClick={() => void onTransition("MAIL")} disabled={isSending}>
          Mail
        </button>
        <button className="chip" type="button" onClick={() => void onTransition("TLF")} disabled={isSending}>
          Telefon
        </button>
        <button className="chip" type="button" onClick={() => void onTransition("AKUT")} disabled={isSending}>
          Akut
        </button>
      </div>
    );
  }

  function renderTopicGrid() {
    // Example UI grid for HOME that feels like a real entry screen.
    // It uses your existing transitions.
    const cards: Array<{ id: string; label: string; icon: React.ReactNode; disabled?: boolean }> = [
      {
        id: "GEN_HYPNO",
        label: "Hypnoterapi (info)",
        icon: <ChatBubbleLeftRightIcon className={iconClass()} />,
      },
      {
        id: "TRIAGE",
        label: "Hvad passer til mig?",
        icon: <ExclamationTriangleIcon className={iconClass()} />,
      },
      {
        id: "METHOD_FIT",
        label: "Metode-fit",
        icon: <LinkIcon className={iconClass()} />,
      },
      {
        id: "BOOKING",
        label: "Booking",
        icon: <EnvelopeIcon className={iconClass()} />,
      },
      {
        id: "DEV_SANDBOX_INTRO",
        label: "Dev sandbox",
        icon: <ChatBubbleLeftRightIcon className={iconClass()} />,
      },
    ];

    return (
      <>
        <div className="gaarsdal-section-title">Vælg et emne</div>
        <div className="gaarsdal-topic-grid">
          {cards.map((c) => (
            <button
              key={c.id}
              className="gaarsdal-topic-card"
              type="button"
              disabled={isSending || (allowedTransitions.length > 0 && !allowedTransitions.includes(c.id))}
              onClick={() => void onTransition(c.id)}
            >
              <span className="gaarsdal-topic-icon">{c.icon}</span>
              <span className="gaarsdal-topic-label">{c.label}</span>
            </button>
          ))}
        </div>
      </>
    );
  }

  function renderSandboxIntroHint() {
    // Make sandbox feel guided, not “type ok”.
    return (
      <>
        <div className="gaarsdal-section-title">Sandbox</div>
        <div className="gaarsdal-meta">
          Tryk “Start” for at udfylde felter i en rigtig form. (Systemet sender stadig key:value til backend for
          kompatibilitet.)
        </div>
        <div className="gaarsdal-chip-group" style={{ marginTop: 8 }}>
          <button
            className="chip"
            type="button"
            disabled={isSending}
            onClick={() => void onTransition("DEV_SANDBOX_FORM")}
          >
            Start
          </button>
          <button className="chip" type="button" disabled={isSending} onClick={() => void onTransition("HOME")}>
            Tilbage
          </button>
        </div>
      </>
    );
  }

  function onSandboxChange(key: string, value: string) {
    setSandboxValues((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmitSandboxForm() {
    if (isSending) return;

    setSandboxError(null);

    const required = ["topic", "goal"];
    const missing = required.filter((k) => !(sandboxValues[k] ?? "").trim());
    if (missing.length > 0) {
      setSandboxError(`Udfyld mindst: ${missing.join(", ")}`);
      return;
    }

    const text = buildKeyValueText(sandboxValues);

    // Clear UI input after submit (optional)
    // setSandboxValues((v) => ({ ...v, support_direction: "", interest_in_methods: "" }));

    await sendInteraction(text);
  }

  function renderSandboxFooterForm() {
    return (
      <div className="gaarsdal-sandbox-footer">
        <div className="gaarsdal-section-title">Sandbox form</div>

        <div className="gaarsdal-form-grid">
          <div className="gaarsdal-field">
            <div className="gaarsdal-label">Topic *</div>
            <input
              className="gaarsdal-input"
              value={sandboxValues.topic}
              onChange={(e) => onSandboxChange("topic", e.target.value)}
              placeholder="fx alkohol om aftenen"
              disabled={isSending}
            />
          </div>

          <div className="gaarsdal-field">
            <div className="gaarsdal-label">Goal *</div>
            <input
              className="gaarsdal-input"
              value={sandboxValues.goal}
              onChange={(e) => onSandboxChange("goal", e.target.value)}
              placeholder="fx drikke mindre"
              disabled={isSending}
            />
          </div>

          <div className="gaarsdal-field">
            <div className="gaarsdal-label">Time patterns</div>
            <input
              className="gaarsdal-input"
              value={sandboxValues.time_patterns}
              onChange={(e) => onSandboxChange("time_patterns", e.target.value)}
              placeholder="fx aftenen"
              disabled={isSending}
            />
          </div>

          <div className="gaarsdal-field">
            <div className="gaarsdal-label">Situational triggers</div>
            <input
              className="gaarsdal-input"
              value={sandboxValues.situational_triggers}
              onChange={(e) => onSandboxChange("situational_triggers", e.target.value)}
              placeholder="fx arbejdsstress"
              disabled={isSending}
            />
          </div>

          <div className="gaarsdal-field">
            <div className="gaarsdal-label">Relational patterns</div>
            <input
              className="gaarsdal-input"
              value={sandboxValues.relational_patterns}
              onChange={(e) => onSandboxChange("relational_patterns", e.target.value)}
              placeholder="fx familien"
              disabled={isSending}
            />
          </div>

          <div className="gaarsdal-field">
            <div className="gaarsdal-label">Preferred tone</div>
            <input
              className="gaarsdal-input"
              value={sandboxValues.preferred_tone}
              onChange={(e) => onSandboxChange("preferred_tone", e.target.value)}
              placeholder="fx rolig og direkte"
              disabled={isSending}
            />
          </div>

          <div className="gaarsdal-field">
            <div className="gaarsdal-label">Support direction</div>
            <input
              className="gaarsdal-input"
              value={sandboxValues.support_direction}
              onChange={(e) => onSandboxChange("support_direction", e.target.value)}
              placeholder="fx ro før jeg kommer hjem"
              disabled={isSending}
            />
          </div>

          <div className="gaarsdal-field">
            <div className="gaarsdal-label">Interest in methods</div>
            <input
              className="gaarsdal-input"
              value={sandboxValues.interest_in_methods}
              onChange={(e) => onSandboxChange("interest_in_methods", e.target.value)}
              placeholder="fx gåtur; pause; registrering"
              disabled={isSending}
            />
          </div>
        </div>

        <div className="gaarsdal-form-actions">
          <button className="btn btn-primary" type="button" disabled={isSending} onClick={() => void onSubmitSandboxForm()}>
            Send
          </button>
          <button className="btn" type="button" disabled={isSending} onClick={() => void onTransition("HOME")}>
            Home
          </button>
        </div>

        {sandboxError ? <div className="gaarsdal-error">{sandboxError}</div> : null}
      </div>
    );
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="gaarsdal-icon-btn"
        style={{
          position: "fixed",
          right: 24,
          bottom: 24,
          zIndex: 40,
        }}
        aria-label="Open chatbot"
      >
        <ChatBubbleLeftRightIcon className={iconClass()} />
      </button>
    );
  }

  return (
    <>
      <div className="gaarsdal-overlay" onClick={onClose} />

      <div className={containerClass} role="dialog" aria-label="Gaarsdal Chat">
        <div className="gaarsdal-chatbot-header">
          <div className="gaarsdal-header-row">
            <div className="gaarsdal-title-wrap">
              <div className="gaarsdal-title">Gaarsdal Chat</div>
              <div className="gaarsdal-subtitle">{activeNode || "—"}</div>
            </div>

            <div className="gaarsdal-actions">
              <button className="gaarsdal-icon-btn" type="button" onClick={onToggleExpanded} aria-label="Toggle size">
                {isExpanded ? (
                  <ArrowsPointingInIcon className={iconClass()} />
                ) : (
                  <ArrowsPointingOutIcon className={iconClass()} />
                )}
              </button>

              <button className="gaarsdal-icon-btn" type="button" onClick={onClose} aria-label="Close">
                <XMarkIcon className={iconClass()} />
              </button>
            </div>
          </div>
        </div>

        <div className="messages">
          {error ? (
            <div className="message bot">
              <strong>Fejl:</strong> {error}
            </div>
          ) : null}

          {messages.map((m, idx) => (
            <div key={idx} className={`message ${m.role === "user" ? "user" : "bot"}`}>
              {m.text}
            </div>
          ))}

          {/* UI sections */}
          {showTopicGrid ? <div className="message bot">{renderTopicGrid()}</div> : null}
          {showSandboxIntroHelp ? <div className="message bot">{renderSandboxIntroHint()}</div> : null}

          {/* fallback quick actions (only when not in sandbox form) */}
          {!showSandboxForm && isSandboxNode(activeNode) ? <div className="message bot">{renderQuickActions()}</div> : null}

          <div ref={messagesEndRef} />
        </div>

        <div className="gaarsdal-chatbot-footer">
          {showSandboxForm ? (
            renderSandboxFooterForm()
          ) : (
            <>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Skriv her... (Enter = send, Shift+Enter = ny linje)"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void onSubmitText();
                  }
                }}
                disabled={isSending}
              />

              {/* Optional quick transitions if backend allows them */}
              {allowedTransitions.length > 0 ? (
                <div className="gaarsdal-chip-group" style={{ marginTop: 8 }}>
                  {allowedTransitions.slice(0, 8).map((t) => (
                    <button key={t} className="chip" type="button" disabled={isSending} onClick={() => void onTransition(t)}>
                      {t}
                    </button>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </>
  );
}
