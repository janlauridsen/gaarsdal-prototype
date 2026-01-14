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
  const [stack, setStack] = useState<Conversation[]>([createConversation()]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  /** 🔒 KILDE TIL SANDHED FOR NODE */
  const currentNodeRef = useRef<string>("ROOT");

  const current = stack[index];

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

        const assistantMessage: Message = {
          role: "assistant",
          content:
            data.message ??
            "Velkommen. Du kan vælge en mulighed herunder eller skrive frit.",
          chips: data.chips ?? [],
        };

        setStack((prev) => {
          const next = [...prev];
          next[index] = {
            ...next[index],
            messages: [assistantMessage],
          };
          return next;
        });
      })
      .catch(() => {});
  }, [open]);

  /* =====================
     SEND (KONTRAKTFAST)
  ===================== */

  async function send(params: { text?: string; chip?: string }) {
    if (loading) return;
    if (!params.text && !params.chip) return;

    /* USER MESSAGE (kun ved tekst) */
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

      /** 🔒 opdater node */
      currentNodeRef.current = data.node;

      const assistantMessage: Message = {
        role: "assistant",
        content: data.message ?? "",
        chips: data.chips ?? [],
      };

      setStack((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          messages: [...next[index].messages, assistantMessage],
        };
        return next;
      });
    } finally {
      setLoading(false);
    }
  }

  /* =====================
     RENDER
  ===================== */

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full gaarsdal-launcher flex items-center justify-center"
        >
          <ChatBubbleOvalLeftEllipsisIcon className="w-7 h-7" />
        </button>
      )}

      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => {
              setOpen(false);
              setExpanded(false);
            }}
          />

          <div
            className={`fixed z-50 gaarsdal-chatbot flex flex-col ${
              expanded
                ? "inset-4 md:inset-10"
                : "bottom-24 right-6 w-96 max-w-[90vw] h-[70vh]"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <header className="flex justify-between items-center px-4 py-3">
              <span className="font-medium">Gaarsdal</span>
              <div className="flex gap-2">
                <button onClick={() => setExpanded((v) => !v)}>
                  <ArrowsPointingOutIcon className="w-5 h-5" />
                </button>
                <button onClick={() => setOpen(false)}>
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </header>

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {current.messages.map((m, i) => (
                <div key={i} className="space-y-2">
                  <div
                    className={`flex ${
                      m.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`message ${
                        m.role === "user" ? "user" : "bot"
                      } px-4 py-3 max-w-[85%] whitespace-pre-wrap`}
                    >
                      {m.content}
                    </div>
                  </div>

                  {m.role === "assistant" &&
                    m.chips &&
                    m.chips.length > 0 && (
                      <div className="flex gap-2 flex-wrap pl-2">
                        {m.chips.map((c, ci) => (
                          <button
                            key={ci}
                            onClick={() => send({ chip: c })}
                            className="text-xs px-3 py-1 rounded-full border bg-white"
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              ))}

              {loading && (
                <div className="text-sm opacity-60">Skriver…</div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* FOOTER */}
            <footer className="p-3 border-t">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send({ text: input });
                  }
                }}
                rows={2}
                className="w-full border rounded-md px-3 py-2 text-sm resize-none"
                placeholder="Skriv frit her…"
              />

              <div className="mt-3 flex gap-3">
                <button
                  disabled={stack.length >= MAX_SESSIONS}
                  className="gaarsdal-icon-btn disabled:opacity-30"
                  onClick={() =>
                    setStack((prev) =>
                      prev.length < MAX_SESSIONS
                        ? [...prev, createConversation()]
                        : prev
                    )
                  }
                >
                  <PlusIcon className="w-5 h-5" />
                </button>

                <button
                  disabled={index === 0}
                  className="gaarsdal-icon-btn disabled:opacity-30"
                  onClick={() => setIndex((i) => Math.max(0, i - 1))}
                >
                  <BackwardIcon className="w-5 h-5" />
                </button>

                <button
                  disabled={index === stack.length - 1}
                  className="gaarsdal-icon-btn disabled:opacity-30"
                  onClick={() =>
                    setIndex((i) =>
                      Math.min(stack.length - 1, i + 1)
                    )
                  }
                >
                  <ForwardIcon className="w-5 h-5" />
                </button>

                <button
                  disabled={stack.length === 1}
                  className="gaarsdal-icon-btn disabled:opacity-30"
                  onClick={() =>
                    setStack((prev) =>
                      prev.length === 1
                        ? prev
                        : prev.filter((_, i) => i !== index)
                    )
                  }
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
