import { useEffect, useRef, useState } from "react";
import {
  ChatBubbleOvalLeftEllipsisIcon,
  XMarkIcon,
  PlusIcon,
  BackwardIcon,
  ForwardIcon,
  TrashIcon,
  ArrowsPointingOutIcon,
  HomeIcon,
  EnvelopeIcon,
  PhoneIcon,
  ExclamationTriangleIcon,
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
  const [stack, setStack] = useState<Conversation[]>([createConversation()]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const current = stack[index];
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const canGoBack = index > 0;
  const canGoForward = index < stack.length - 1;
  const canAdd = stack.length < MAX_SESSIONS;
  const canDelete = stack.length > 1;

  const btn = (enabled: boolean) =>
    `gaarsdal-icon-btn ${!enabled ? "gaarsdal-icon-disabled" : ""}`;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [current.messages, loading]);

  /* =====================
     INIT → ROOT
  ===================== */

  useEffect(() => {
    if (!open) return;
    if (current.messages.length > 0) return;

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
        setStack((prev) => {
          const next = [...prev];
          next[index] = {
            ...next[index],
            messages: [
              {
                role: "assistant",
                content:
                  data.message ??
                  "Velkommen. Du kan vælge en mulighed herunder eller skrive frit.",
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

  async function send(text?: string, chip?: string) {
    if (loading) return;
    if (!text && !chip) return;

    if (text && !chip) {
      setStack((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          messages: [...next[index].messages, { role: "user", content: text }],
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
          text,
          chip,
        }),
      });

      const data = await res.json();

      setStack((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          messages: [
            ...next[index].messages,
            {
              role: "assistant",
              content: data.message ?? "",
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
     DELETE SESSION
  ===================== */

  function deleteCurrentSession() {
    if (!canDelete) return;

    setStack((prev) => {
      const next = prev.filter((_, i) => i !== index);
      const newIndex = Math.min(index, next.length - 1);
      setIndex(newIndex);
      return next;
    });
  }

  /* =====================
     DERIVED: LAST ASSISTANT CHIPS
  ===================== */

  const lastAssistant = [...current.messages]
    .reverse()
    .find((m) => m.role === "assistant" && m.chips && m.chips.length > 0);

  /* =====================
     RENDER
  ===================== */

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 gaarsdal-launcher flex items-center justify-center"
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
                <img src="/jan.gif" alt="Chat" className="w-6 h-6" />
                <span>Gaarsdal</span>
              </div>

              <div className="flex gap-1">
                <button
                  className="gaarsdal-icon-btn"
                  onClick={() => setExpanded((v) => !v)}
                >
                  <ArrowsPointingOutIcon className="w-5 h-5" />
                </button>
                <button
                  className="gaarsdal-icon-btn"
                  onClick={() => setOpen(false)}
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </header>

            {/* MESSAGES */}
            <div className="messages">
              {current.messages.map((m, i) => (
                <div key={i} className={`message ${m.role}`}>
                  {m.content}
                </div>
              ))}
              {loading && <div className="text-sm opacity-60">Skriver…</div>}
              <div ref={messagesEndRef} />
            </div>

            {/* CHIPS (GENOPRETTET) */}
            {lastAssistant && (
              <div className="px-4 pb-2 flex gap-2 flex-wrap">
                {lastAssistant.chips!.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => send(undefined, c)}
                    className="text-xs px-3 py-1 rounded-full border bg-white"
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}

            {/* FOOTER */}
            <footer className="gaarsdal-chatbot-footer">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder="Skriv frit her…"
              />

              <div className="mt-3 space-y-2">
                <div className="flex justify-center gap-2">
                  <button className="gaarsdal-icon-btn">
                    <HomeIcon className="w-5 h-5" />
                  </button>
                  <button className="gaarsdal-icon-btn">
                    <EnvelopeIcon className="w-5 h-5" />
                  </button>
                  <button className="gaarsdal-icon-btn">
                    <PhoneIcon className="w-5 h-5" />
                  </button>
                  <button className="gaarsdal-icon-btn">
                    <ExclamationTriangleIcon className="w-5 h-5" />
                  </button>
                </div>

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

                <div className="flex justify-center gap-2">
                  <button
                    className={btn(canAdd)}
                    onClick={() =>
                      canAdd &&
                      setStack((s) => [...s, createConversation()])
                    }
                  >
                    <PlusIcon className="w-5 h-5" />
                  </button>

                  <button
                    className={btn(canGoBack)}
                    onClick={() => canGoBack && setIndex(index - 1)}
                  >
                    <BackwardIcon className="w-5 h-5" />
                  </button>

                  <button
                    className={btn(canGoForward)}
                    onClick={() =>
                      canGoForward && setIndex(index + 1)
                    }
                  >
                    <ForwardIcon className="w-5 h-5" />
                  </button>

                  <button
                    className={btn(canDelete)}
                    onClick={deleteCurrentSession}
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </footer>
          </div>
        </>
      )}
    </>
  );
}
