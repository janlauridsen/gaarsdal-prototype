import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Role = "user" | "assistant" | "system";

type ChatMessage = {
  role: Role;
  content: string;
  ts?: string;
};

type ConversationState = {
  conversation_id: string;
  revision: number;
  active_node: string;
  active_node_message: string;
  allowed_transitions: string[];
  status: "active" | "completed";
  meta: Record<string, any>;
};

type ChatApiResponse = {
  ok: boolean;
  state: ConversationState;
  assistant_message?: string;
  error?: string;
};

type SandboxFormValues = {
  topic: string;
  goal: string;
  time_patterns: string;
  situational_triggers: string;
  relational_patterns: string;
  preferred_tone: string;
  support_direction: string;
  interest_in_methods: string;
};

const DEFAULT_SANDBOX_FORM: SandboxFormValues = {
  topic: "",
  goal: "",
  time_patterns: "",
  situational_triggers: "",
  relational_patterns: "",
  preferred_tone: "",
  support_direction: "",
  interest_in_methods: "",
};

function buildKeyValuePayload(values: SandboxFormValues): string {
  // Backend forventer "key: value" pr linje.
  // Vi sender kun felter der ikke er tomme.
  const lines: string[] = [];
  (Object.keys(values) as (keyof SandboxFormValues)[]).forEach((k) => {
    const v = (values[k] ?? "").toString().trim();
    if (v.length > 0) lines.push(`${k}: ${v}`);
  });
  return lines.join("\n");
}

function nowIso(): string {
  try {
    return new Date().toISOString();
  } catch {
    return "";
  }
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);

  const [state, setState] = useState<ConversationState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sandbox wizard UI
  const [sandboxForm, setSandboxForm] = useState<SandboxFormValues>(DEFAULT_SANDBOX_FORM);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const initOnceRef = useRef(false);

  const activeNode = state?.active_node ?? "UNKNOWN";

  const isSandboxIntro = activeNode === "DEV_SANDBOX_INTRO";
  const isSandboxForm = activeNode === "DEV_SANDBOX_FORM";
  const isSandboxDone = activeNode === "DEV_SANDBOX_DONE";

  const canGoHome = useMemo(() => {
    const allowed = state?.allowed_transitions ?? [];
    return allowed.includes("HOME");
  }, [state]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [isOpen, messages, scrollToBottom]);

  const appendMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const callChatApi = useCallback(
    async (payload: any): Promise<ChatApiResponse> => {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Undgå at smide JSON parse-fejl ved fx HTML error pages
      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        data = { ok: false, error: `Non-JSON response (${res.status})`, raw: text };
      }

      if (!res.ok) {
        return {
          ok: false,
          state: data?.state ?? payload?.state ?? null,
          error: data?.error ?? `Request failed (${res.status})`,
        };
      }

      return data as ChatApiResponse;
    },
    []
  );

  const systemInit = useCallback(async () => {
    setError(null);
    setIsSending(true);
    try {
      const payload = {
        state: null,
        input_type: "SYSTEM_INIT",
        user_input: "",
      };

      const data = await callChatApi(payload);
      if (!data.ok) {
        setError(data.error ?? "Init failed");
        setIsSending(false);
        return;
      }

      setState(data.state);

      // Vis første bot-besked
      const msg = data.state?.active_node_message ?? "Velkommen.";
      appendMessage({ role: "assistant", content: msg, ts: nowIso() });
    } catch (e: any) {
      setError(e?.message ?? "Init error");
    } finally {
      setIsSending(false);
    }
  }, [appendMessage, callChatApi]);

  useEffect(() => {
    // Init kun når chatbot åbnes første gang (mere realistisk + mindre støj i logs)
    if (!isOpen) return;
    if (initOnceRef.current) return;
    initOnceRef.current = true;
    void systemInit();
  }, [isOpen, systemInit]);

  const sendUserInput = useCallback(
    async (userText: string, inputType: "FREE_TEXT" | "EXPLICIT_TRANSITION" = "FREE_TEXT") => {
      if (!state) {
        setError("No state yet. Open chatbot to initialize.");
        return;
      }

      const trimmed = userText.trim();
      if (!trimmed && inputType === "FREE_TEXT") return;

      setError(null);
      setIsSending(true);

      if (inputType === "FREE_TEXT") {
        appendMessage({ role: "user", content: trimmed, ts: nowIso() });
      } else {
        // EXPlicit transitions vises ikke som "user text" i UI; men du kan ændre det, hvis du vil
      }

      try {
        const payload =
          inputType === "EXPLICIT_TRANSITION"
            ? { state, input_type: "EXPLICIT_TRANSITION", user_input: `EXPLICIT_TRANSITION:${trimmed}` }
            : { state, input_type: "FREE_TEXT", user_input: trimmed };

        const data = await callChatApi(payload);

        if (!data.ok) {
          setError(data.error ?? "Send failed");
          setIsSending(false);
          return;
        }

        setState(data.state);

        const botMsg =
          data.assistant_message ??
          data.state?.active_node_message ??
          "OK";

        appendMessage({ role: "assistant", content: botMsg, ts: nowIso() });

        // Hvis vi er i sandbox form, så gem sidste submit i UI som “draft”
        if (data.state?.active_node === "DEV_SANDBOX_FORM") {
          // behold brugerens felter
        }

        setInput("");
      } catch (e: any) {
        setError(e?.message ?? "Send error");
      } finally {
        setIsSending(false);
      }
    },
    [appendMessage, callChatApi, state]
  );

  const onSubmitText = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      await sendUserInput(input, "FREE_TEXT");
    },
    [input, sendUserInput]
  );

  const onClickHome = useCallback(async () => {
    if (!canGoHome) return;
    await sendUserInput("HOME", "EXPLICIT_TRANSITION");
  }, [canGoHome, sendUserInput]);

  const submitSandboxForm = useCallback(async () => {
    const payload = buildKeyValuePayload(sandboxForm);
    if (!payload.trim()) {
      setError("Udfyld mindst ét felt før du sender.");
      return;
    }
    await sendUserInput(payload, "FREE_TEXT");
  }, [sandboxForm, sendUserInput]);

  // UI helpers
  const headerSubtitle = useMemo(() => {
    if (!state) return "—";
    return state.active_node;
  }, [state]);

  return (
    <>
      {/* Launcher (lukket som default) */}
      {!isOpen && (
        <button
          type="button"
          aria-label="Åbn chat"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-900 hover:bg-neutral-50 active:scale-[0.99]"
        >
          Gaarsdal Chat
        </button>
      )}

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-3rem)] rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-neutral-900 truncate">Gaarsdal Chat</div>
              <div className="text-xs text-neutral-500 truncate">{headerSubtitle}</div>
            </div>

            <div className="flex items-center gap-2">
              {canGoHome && (
                <button
                  type="button"
                  onClick={onClickHome}
                  className="rounded-lg border border-neutral-200 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-50"
                >
                  HOME
                </button>
              )}
              <button
                type="button"
                aria-label="Luk"
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-neutral-200 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-50"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="h-[420px] bg-neutral-50">
            <div className="h-full overflow-y-auto px-3 py-3 space-y-2">
              {messages.map((m, idx) => {
                const isUser = m.role === "user";
                return (
                  <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    <div
                      className={[
                        "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                        isUser
                          ? "bg-neutral-900 text-white"
                          : "bg-white text-neutral-900 border border-neutral-200",
                      ].join(" ")}
                    >
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    </div>
                  </div>
                );
              })}
              {error && (
                <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  Fejl: {error}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Footer / Input area */}
          <div className="border-t border-neutral-200 bg-white px-3 py-3">
            {/* Sandbox: Intro quick actions */}
            {isSandboxIntro && (
              <div className="mb-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => sendUserInput("ok", "FREE_TEXT")}
                  className="rounded-xl bg-neutral-900 px-3 py-2 text-xs font-medium text-white hover:bg-neutral-800"
                  disabled={isSending}
                >
                  Start (OK)
                </button>
                {canGoHome && (
                  <button
                    type="button"
                    onClick={onClickHome}
                    className="rounded-xl border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-800 hover:bg-neutral-50"
                    disabled={isSending}
                  >
                    Tilbage (HOME)
                  </button>
                )}
              </div>
            )}

            {/* Sandbox: Wizard-form UI */}
            {isSandboxForm ? (
              <div className="space-y-2">
                <div className="text-xs text-neutral-600">
                  Udfyld felterne (sendes som <span className="font-mono">key: value</span> til backend).
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <label className="text-xs text-neutral-700">
                    Topic
                    <input
                      value={sandboxForm.topic}
                      onChange={(e) => setSandboxForm((p) => ({ ...p, topic: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
                      placeholder="fx alkohol om aftenen"
                    />
                  </label>

                  <label className="text-xs text-neutral-700">
                    Goal
                    <input
                      value={sandboxForm.goal}
                      onChange={(e) => setSandboxForm((p) => ({ ...p, goal: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
                      placeholder="fx drikke mindre"
                    />
                  </label>

                  <label className="text-xs text-neutral-700">
                    Time patterns
                    <input
                      value={sandboxForm.time_patterns}
                      onChange={(e) => setSandboxForm((p) => ({ ...p, time_patterns: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
                      placeholder="fx aftenen"
                    />
                  </label>

                  <label className="text-xs text-neutral-700">
                    Situational triggers
                    <input
                      value={sandboxForm.situational_triggers}
                      onChange={(e) => setSandboxForm((p) => ({ ...p, situational_triggers: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
                      placeholder="fx arbejdsstress"
                    />
                  </label>

                  <label className="text-xs text-neutral-700">
                    Relational patterns
                    <input
                      value={sandboxForm.relational_patterns}
                      onChange={(e) => setSandboxForm((p) => ({ ...p, relational_patterns: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
                      placeholder="fx familien"
                    />
                  </label>

                  <label className="text-xs text-neutral-700">
                    Preferred tone
                    <input
                      value={sandboxForm.preferred_tone}
                      onChange={(e) => setSandboxForm((p) => ({ ...p, preferred_tone: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
                      placeholder="fx rolig og direkte"
                    />
                  </label>

                  <label className="text-xs text-neutral-700">
                    Support direction
                    <input
                      value={sandboxForm.support_direction}
                      onChange={(e) => setSandboxForm((p) => ({ ...p, support_direction: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
                      placeholder="fx ro før jeg kommer hjem"
                    />
                  </label>

                  <label className="text-xs text-neutral-700">
                    Interest in methods
                    <input
                      value={sandboxForm.interest_in_methods}
                      onChange={(e) => setSandboxForm((p) => ({ ...p, interest_in_methods: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
                      placeholder="fx gåtur; pause; registrering"
                    />
                  </label>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={submitSandboxForm}
                    disabled={isSending}
                    className="flex-1 rounded-xl bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
                  >
                    Send
                  </button>

                  <button
                    type="button"
                    onClick={() => setSandboxForm(DEFAULT_SANDBOX_FORM)}
                    disabled={isSending}
                    className="rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-60"
                  >
                    Ryd
                  </button>
                </div>
              </div>
            ) : (
              // Normal chat input (også i sandbox done, hvor man typisk vælger HOME)
              <form onSubmit={onSubmitText} className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={2}
                  placeholder={isSandboxDone ? "Vælg HOME for at fortsætte…" : "Skriv her…"}
                  className="flex-1 resize-none rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
                  disabled={isSending}
                />
                <button
                  type="submit"
                  disabled={isSending || !input.trim()}
                  className="rounded-xl bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
                >
                  Send
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
