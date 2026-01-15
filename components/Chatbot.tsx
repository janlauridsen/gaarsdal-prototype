import { useEffect, useRef, useState } from "react";
import Image from "next/image";
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

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const currentNodeRef = useRef<string>("ROOT");

  const current = stack[index];

  /* =====================
     AUTOSCROLL
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
     RENDER
  ===================== */

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 gaarsdal-launcher flex items-center justify-center"
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
            <header className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <Image
                  src="/jan.gif"
                  alt="Jan"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <span className="font-medium">Gaarsdal</span>
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
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>

                  {m.role === "assistant" && m.chips?.length ? (
                    <div className="flex gap-2 flex-wrap pl-2">
                      {m.chips.map((c, ci) => (
                        <button
                          key={ci}
                          type="button"
                          onClick={() => send({ chip: c })}
                          className="text-xs px-3 py-1 rounded-full border bg-white"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* FOOTER */}
            <footer className="p-3 border-t space-y-3">
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

              {/* PRIMARY ICON ACTIONS */}
              <div className="flex justify-center gap-5">
                <HomeIcon className="w-5 h-5" />
                <EnvelopeIcon className="w-5 h-5" />
                <PhoneIcon className="w-5 h-5" />
                <ExclamationTriangleIcon className="w-5 h-5" />
              </div>

              {/* STACK CONTROLS */}
              <div className="flex justify-center gap-4">
                <PlusIcon className="w-5 h-5" />
                <BackwardIcon className="w-5 h-5" />
                <ForwardIcon className="w-5 h-5" />
                <TrashIcon className="w-5 h-5" />
              </div>
            </footer>
          </div>
        </>
      )}
    </>
  );
}
