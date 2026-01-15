import { useEffect, useRef, useState } from "react";
import {
  ChatBubbleOvalLeftEllipsisIcon,
  XMarkIcon,
  PlusIcon,
  BackwardIcon,
  ForwardIcon,
  TrashIcon,
  ArrowsPointingOutIcon,
} from "@heroicons/react/24/outline";

/* =====================
   TYPES
===================== */

type Message = {
  role: "user" | "assistant";
  content: string;
  chips?: string[];
};

type Conversation = {
  id: string;
  messages: Message[];
};

/* =====================
   CONFIG
===================== */

const MAX_SESSIONS = 5;

/* =====================
   HELPERS
===================== */

function createConversation(): Conversation {
  return {
    id: crypto.randomUUID(),
    messages: [],
  };
}

/* =====================
   COMPONENT
===================== */

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const [stack, setStack] = useState<Conversation[]>([
    createConversation(),
  ]);
  const [index, setIndex] = useState(0);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const currentNodeRef = useRef<string>("ROOT");

  const current = stack[index] ?? stack[0];

  /* =====================
     SCROLL
  ===================== */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [current.messages, loading]);

  /* =====================
     INIT → ROOT
  ===================== */

  useEffect(() => {
    if (!open) return;
    if (current.messages.length > 0) return;

    currentNodeRef.current = "ROOT";

    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: current.id,
        currentNode: "ROOT",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        currentNodeRef.current = data.node;

        setStack((prev) => {
          const next = [...prev];
          next[index] = {
            ...next[index],
            messages: [
              {
                role: "assistant",
                content: data.message,
                chips: data.chips ?? [],
              },
            ],
          };
          return next;
        });
      })
      .catch(() => {});
  }, [open]);

  /* =====================
     SEND
  ===================== */

  async function send(params: { text?: string; chip?: string }) {
    if (loading) return;
    if (!params.text && !params.chip) return;

    if (params.text) {
      setStack((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          messages: [
            ...next[index].messages,
            { role: "user", content: params.text },
          ],
        };
        return next;
      });
    }

    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: current.id,
          currentNode: currentNodeRef.current,
          text: params.text ?? null,
          chip: params.chip ?? null,
        }),
      });

      const data = await res.json();
      currentNodeRef.current = data.node;

      setStack((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          messages: [
            ...next[index].messages,
            {
              role: "assistant",
              content: data.message,
              chips: data.chips ?? [],
            },
          ],
        };
        return next;
      });
    } finally {
      setLoading(false);
    }
  }

  /* =====================
     STACK CONTROLS (SAFE)
  ===================== */

  function addConversation() {
    if (stack.length >= MAX_SESSIONS) return;

    setStack((prev) => [...prev, createConversation()]);
    setIndex(stack.length);
  }

  function removeConversation() {
    if (stack.length === 1) return;

    setStack((prev) => {
      const next = prev.filter((_, i) => i !== index);
      const nextIndex = Math.max(0, index - 1);
      setIndex(nextIndex);
      return next;
    });
  }

  /* =====================
     RENDER
  ===================== */

  return (
    <>
      {!open && (
        <button
          type="button"
          className="fixed bottom-6 right-6 w-14 h-14 gaarsdal-launcher flex items-center justify-center"
          onClick={() => setOpen(true)}
        >
          <ChatBubbleOvalLeftEllipsisIcon className="w-7 h-7" />
        </button>
      )}

      {open && (
        <>
          <div
            className="gaarsdal-overlay"
            onClick={() => {
              setOpen(false);
              setExpanded(false);
            }}
          />

          <div
            className={`gaarsdal-chatbot fixed flex flex-col ${
              expanded
                ? "inset-4 md:inset-10"
                : "bottom-24 right-6 w-96 max-w-[90vw] h-[70vh]"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <header className="gaarsdal-chatbot-header flex justify-between items-center">
              <div className="flex items-center gap-2">
                <img
                  src="/jan.gif"
                  alt="Jan"
                  className="w-6 h-6 rounded-full"
                />
                <span className="font-medium text-sm">Gaarsdal</span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  className="gaarsdal-icon-btn"
                  title="Udvid"
                  onClick={() => setExpanded((v) => !v)}
                >
                  <ArrowsPointingOutIcon className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  className="gaarsdal-icon-btn"
                  title="Luk"
                  onClick={() => setOpen(false)}
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </header>

            {/* MESSAGES */}
            <div className="messages">
              {current.messages.map((m, i) => (
                <div key={i}>
                  <div
                    className={`message ${
                      m.role === "user" ? "user" : "bot"
                    }`}
                  >
                    {m.content}
                  </div>

                  {m.role === "assistant" && m.chips?.length ? (
                    <div className="flex gap-2 flex-wrap pl-2 mt-2">
                      {m.chips.map((c, ci) => (
                        <button
                          key={ci}
                          type="button"
                          className="text-xs px-3 py-1 rounded-full border bg-white"
                          onClick={() => send({ chip: c })}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}

              {loading && (
                <div className="text-sm opacity-60 mt-2">
                  Skriver…
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* FOOTER */}
            <footer className="gaarsdal-chatbot-footer">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send({ text: input });
                  }
                }}
                placeholder="Skriv frit her…"
              />

              {/* PRIMARY ICONS */}
              <div className="flex justify-center gap-4 mt-3">
                <span className="gaarsdal-icon-btn" title="Forside">🏠</span>
                <span className="gaarsdal-icon-btn" title="Mail">✉️</span>
                <span className="gaarsdal-icon-btn" title="Telefon">📞</span>
                <span className="gaarsdal-icon-btn" title="Akut">⚠️</span>
              </div>

              {/* STACK DOTS */}
              <div className="gaarsdal-stack-dots">
                {stack.map((_, i) => (
                  <div
                    key={i}
                    className={`gaarsdal-stack-dot ${
                      i === index ? "active" : ""
                    }`}
                  />
                ))}
              </div>

              {/* STACK CONTROLS */}
              <div className="flex justify-center gap-4">
                <button
                  type="button"
                  className={
                    stack.length >= MAX_SESSIONS
                      ? "gaarsdal-icon-btn gaarsdal-icon-disabled"
                      : "gaarsdal-icon-btn"
                  }
                  title="Ny samtale"
                  onClick={addConversation}
                >
                  <PlusIcon className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  className={
                    index === 0
                      ? "gaarsdal-icon-btn gaarsdal-icon-disabled"
                      : "gaarsdal-icon-btn"
                  }
                  title="Forrige"
                  onClick={() => setIndex((i) => Math.max(0, i - 1))}
                >
                  <BackwardIcon className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  className={
                    index === stack.length - 1
                      ? "gaarsdal-icon-btn gaarsdal-icon-disabled"
                      : "gaarsdal-icon-btn"
                  }
                  title="Næste"
                  onClick={() =>
                    setIndex((i) =>
                      Math.min(stack.length - 1, i + 1)
                    )
                  }
                >
                  <ForwardIcon className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  className={
                    stack.length === 1
                      ? "gaarsdal-icon-btn gaarsdal-icon-disabled"
                      : "gaarsdal-icon-btn"
                  }
                  title="Slet"
                  onClick={removeConversation}
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </footer>
          </div>
        </>
      )}
    </>
  );
}
