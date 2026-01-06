/**
 * Chatbot.tsx
 * ------------------------------------------------------------
 * Version: 6.3
 *
 * ÆNDRINGER I DENNE VERSION (KUN META – INGEN LOGIKÆNDRINGER):
 * - Introducerer session-metadata pr. samtale (Conversation.meta)
 * - Stabil session-id
 * - Automatisk titel baseret på første brugerbesked
 * - createdAt / lastActiveAt timestamps
 * - turnCount (afledt)
 * - status: active | idle (UI-signal)
 * - Tooltips på stack-prikker baseret på metadata
 *
 * BEVIDST IKKE ÆNDRET:
 * - AI-flow
 * - Evaluator
 * - Debug
 * - Stack-logik
 * - UI-layout, styles, autoscroll, limits
 * ------------------------------------------------------------
 */

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

/* =========================
   Types
   ========================= */

type Message = {
  role: "user" | "assistant";
  content: string;
};

type SessionMeta = {
  id: string;
  title: string;
  createdAt: number;
  lastActiveAt: number;
  status: "active" | "idle";
  turnCount: number;
};

type Conversation = {
  meta: SessionMeta;
  messages: Message[];
};

/* =========================
   Constants
   ========================= */

const UI_WELCOME =
  "Velkommen – godt at se dig.\n\n" +
  "Du er velkommen til at skrive frit. " +
  "Beskriv gerne det, der fylder mest for dig lige nu.";

const DEBUG = false;
const MAX_SESSIONS = 5;

/* =========================
   Helpers
   ========================= */

function createConversation(index: number): Conversation {
  const now = Date.now();

  return {
    meta: {
      id: crypto.randomUUID(),
      title: `Samtale ${index + 1}`,
      createdAt: now,
      lastActiveAt: now,
      status: "idle",
      turnCount: 0,
    },
    messages: [],
  };
}

function deriveTitleFromText(text: string): string {
  return text
    .trim()
    .split(/\s+/)
    .slice(0, 6)
    .join(" ");
}

/* =========================
   Component
   ========================= */

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [stack, setStack] = useState<Conversation[]>([
    createConversation(0),
  ]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const current = stack[index];

  /* =========================
     Effects
     ========================= */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [current.messages, loading]);

  useEffect(() => {
    setStack((prev) =>
      prev.map((c, i) => ({
        ...c,
        meta: {
          ...c.meta,
          status: i === index ? "active" : "idle",
        },
      }))
    );
  }, [index]);

  /* =========================
     Navigation
     ========================= */

  function pushNewConversation() {
    if (stack.length >= MAX_SESSIONS) return;

    setStack((prev) => [
      ...prev,
      createConversation(prev.length),
    ]);
    setIndex(stack.length);
    setInput("");
  }

  function clearCurrentConversation() {
    setStack((prev) => {
      if (prev.length === 1) {
        return [createConversation(0)];
      }

      const next = prev.filter((_, i) => i !== index);

      return next.map((c, i) => ({
        ...c,
        meta: { ...c.meta, title: `Samtale ${i + 1}` },
      }));
    });

    setIndex((i) => Math.max(0, i - 1));
    setInput("");
  }

  function goPrev() {
    setIndex((i) => Math.max(0, i - 1));
  }

  function goNext() {
    setIndex((i) => Math.min(stack.length - 1, i + 1));
  }

  /* =========================
     Messaging
     ========================= */

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const now = Date.now();
    const userMessage: Message = { role: "user", content: text };

    setStack((prev) => {
      const next = [...prev];
      const convo = next[index];

      const isFirstUserMessage =
        convo.messages.filter((m) => m.role === "user").length === 0;

      next[index] = {
        ...convo,
        meta: {
          ...convo.meta,
          title: isFirstUserMessage
            ? deriveTitleFromText(text)
            : convo.meta.title,
          lastActiveAt: now,
          turnCount: Math.floor(
            (convo.messages.length + 1) / 2
          ),
        },
        messages: [...convo.messages, userMessage],
      };

      return next;
    });

    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...current.messages, userMessage],
          debug: DEBUG,
        }),
      });

      const data = await res.json();

      setStack((prev) => {
        const next = [...prev];
        const convo = next[index];

        next[index] = {
          ...convo,
          meta: {
            ...convo.meta,
            lastActiveAt: Date.now(),
            turnCount: Math.floor(
              (convo.messages.length + 2) / 2
            ),
          },
          messages: [
            ...convo.messages,
            { role: "assistant", content: data.answer ?? "" },
          ],
        };

        return next;
      });
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     Render
     ========================= */

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-accent text-white shadow flex items-center justify-center"
          aria-label="Åbn chat"
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
            className={`fixed z-50 gaarsdal-chatbot flex flex-col
              ${
                expanded
                  ? "inset-4 md:inset-10"
                  : "bottom-24 right-6 w-96 max-w-[90vw] h-[70vh]"
              }`}
          >
            <header className="flex justify-between items-center px-4 py-3">
              <span className="font-medium">Gaarsdal</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setExpanded((v) => !v)}
                  title="Forstør / formindsk"
                >
                  <ArrowsPointingOutIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setOpen(false);
                    setExpanded(false);
                  }}
                  title="Luk"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </header>

            <div
              id="gaarsdal-chat-window"
              className="flex-1 overflow-y-auto p-4 space-y-3 messages"
            >
              {current.messages.length === 0 && (
                <div className="message bot whitespace-pre-wrap p-4 max-w-[85%]">
                  {UI_WELCOME}
                </div>
              )}

              {current.messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${
                    m.role === "user"
                      ? "justify-end"
                      : "justify-start"
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
              ))}

              {loading && (
                <div className="text-sm opacity-60">Skriver…</div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <footer className="p-3 border-t">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                rows={2}
                className="w-full border rounded-md px-3 py-2 text-sm resize-none"
                placeholder="Skriv her…"
              />

              <div className="mt-3 flex justify-between items-center">
                <div className="flex gap-3 items-center">
                  <button
                    onClick={pushNewConversation}
                    disabled={stack.length >= MAX_SESSIONS}
                    title={
                      stack.length >= MAX_SESSIONS
                        ? "Maks. 5 samtaler"
                        : "Ny samtale"
                    }
                    className={
                      stack.length >= MAX_SESSIONS
                        ? "opacity-40 cursor-not-allowed"
                        : ""
                    }
                  >
                    <PlusIcon className="w-5 h-5" />
                  </button>

                  <button
                    onClick={goPrev}
                    disabled={index === 0}
                    title="Forrige samtale"
                    className={index === 0 ? "opacity-40" : ""}
                  >
                    <BackwardIcon className="w-5 h-5" />
                  </button>

                  <button
                    onClick={goNext}
                    disabled={index === stack.length - 1}
                    title="Næste samtale"
                    className={
                      index === stack.length - 1
                        ? "opacity-40"
                        : ""
                    }
                  >
                    <ForwardIcon className="w-5 h-5" />
                  </button>

                  <button
                    onClick={clearCurrentConversation}
                    title="Slet aktiv samtale"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex gap-1">
                  {stack.map((c, i) => (
                    <button
                      key={c.meta.id}
                      onClick={() => setIndex(i)}
                      title={`${c.meta.title}\nSidst aktiv: ${new Date(
                        c.meta.lastActiveAt
                      ).toLocaleString()}`}
                      className={`w-2 h-2 rounded-full ${
                        i === index
                          ? "bg-accent"
                          : "bg-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </footer>
          </div>
        </>
      )}
    </>
  );
}
