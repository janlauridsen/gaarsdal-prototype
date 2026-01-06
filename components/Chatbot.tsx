import { useEffect, useRef, useState } from "react";
import {
  ChatBubbleOvalLeftEllipsisIcon,
  XMarkIcon,
  PlusIcon,
  BackwardIcon,
  ForwardIcon,
  TrashIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
} from "@heroicons/react/24/outline";

/* =========================
   CONFIG
   ========================= */
const DEBUG = false; // HARDLOCK. Skift manuelt ved test
const MAX_SESSIONS = 5;

/* =========================
   TYPES
   ========================= */
type Role = "user" | "assistant";

type Message = {
  role: Role;
  content: string;
};

type SessionMeta = {
  id: string;
  createdAt: number;
  lastActiveAt: number;
  turnCount: number;
  topicHint?: string;
};

type Session = {
  meta: SessionMeta;
  messages: Message[];
};

/* =========================
   CONSTANTS
   ========================= */
const UI_WELCOME =
  "Velkommen – godt at se dig.\n\n" +
  "Du er velkommen til at skrive frit.\n" +
  "Beskriv gerne det, der fylder mest for dig lige nu.";

/* =========================
   HELPERS
   ========================= */
function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function createSession(): Session {
  const now = Date.now();
  return {
    meta: {
      id: uid(),
      createdAt: now,
      lastActiveAt: now,
      turnCount: 0,
    },
    messages: [],
  };
}

/* =========================
   COMPONENT
   ========================= */
export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const [sessions, setSessions] = useState<Session[]>([createSession()]);
  const [index, setIndex] = useState(0);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const current = sessions[index];

  /* =========================
     AUTOSCROLL
     ========================= */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [current.messages, loading, expanded]);

  /* =========================
     SESSION ACTIONS
     ========================= */
  function canAddSession() {
    return sessions.length < MAX_SESSIONS;
  }

  function addSession() {
    if (!canAddSession()) return;
    setSessions((prev) => [...prev, createSession()]);
    setIndex(sessions.length);
    setInput("");
  }

  function deleteActiveSession() {
    if (sessions.length === 1) {
      setSessions([createSession()]);
      setIndex(0);
      setInput("");
      return;
    }

    setSessions((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next;
    });

    setIndex((i) => Math.max(0, i - 1));
    setInput("");
  }

  function goPrev() {
    setIndex((i) => Math.max(0, i - 1));
  }

  function goNext() {
    setIndex((i) => Math.min(sessions.length - 1, i + 1));
  }

  function jumpTo(i: number) {
    setIndex(i);
  }

  /* =========================
     SEND MESSAGE
     ========================= */
  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMessage: Message = { role: "user", content: text };

    setSessions((prev) => {
      const next = [...prev];
      const s = next[index];

      // topicHint sættes ved første brugerinput
      if (s.meta.turnCount === 0) {
        s.meta.topicHint = text.slice(0, 80);
      }

      s.messages = [...s.messages, userMessage];
      s.meta.turnCount += 1;
      s.meta.lastActiveAt = Date.now();
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

      const assistantText =
        DEBUG && data.final
          ? data.final
          : data.answer ?? "";

      setSessions((prev) => {
        const next = [...prev];
        next[index].messages = [
          ...next[index].messages,
          { role: "assistant", content: assistantText },
        ];
        next[index].meta.lastActiveAt = Date.now();
        return next;
      });
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     RENDER
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
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => {
              setOpen(false);
              setExpanded(false);
            }}
          />

          {/* Chat window */}
          <div
            className={`fixed z-50 gaarsdal-chatbot flex flex-col
              ${
                expanded
                  ? "inset-6"
                  : "bottom-24 right-6 w-96 max-w-[90vw] h-[70vh]"
              }`}
          >
            {/* Header */}
            <header className="flex justify-between items-center px-4 py-3">
              <span className="font-medium">Gaarsdal</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setExpanded((v) => !v)}
                  title={expanded ? "Formindsk" : "Forstør"}
                >
                  {expanded ? (
                    <ArrowsPointingInIcon className="w-5 h-5" />
                  ) : (
                    <ArrowsPointingOutIcon className="w-5 h-5" />
                  )}
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

            {/* Messages */}
            <div
              id="gaarsdal-chat-window"
              className="flex-1 overflow-y-auto p-4 space-y-3 messages"
            >
              {current.messages.length === 0 && (
                <div className="message bot whitespace-pre-wrap p-4">
                  {UI_WELCOME}
                </div>
              )}

              {current.messages.map((m, i) => (
                <div
                  key={i}
                  className={`message ${
                    m.role === "user"
                      ? "user ml-auto text-right"
                      : "bot mr-auto text-left"
                  } inline-block px-4 py-3 max-w-[85%] whitespace-pre-wrap`}
                >
                  {m.content}
                </div>
              ))}

              {loading && (
                <div className="text-sm opacity-60">Skriver…</div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input + navigation */}
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
                {/* Controls */}
                <div className="flex gap-3 items-center">
                  <button
                    onClick={addSession}
                    disabled={!canAddSession()}
                    title={
                      canAddSession()
                        ? "Ny samtale"
                        : "Maks 5 samtaler – slet en først"
                    }
                    className={!canAddSession() ? "opacity-40" : ""}
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
                    disabled={index === sessions.length - 1}
                    title="Næste samtale"
                    className={
                      index === sessions.length - 1 ? "opacity-40" : ""
                    }
                  >
                    <ForwardIcon className="w-5 h-5" />
                  </button>

                  <button
                    onClick={deleteActiveSession}
                    title="Slet aktiv samtale"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Session dots */}
                <div className="flex gap-1">
                  {sessions.map((s, i) => (
                    <button
                      key={s.meta.id}
                      onClick={() => jumpTo(i)}
                      title={
                        s.meta.topicHint
                          ? s.meta.topicHint
                          : "Tom samtale"
                      }
                      className={`w-2 h-2 rounded-full ${
                        i === index ? "bg-accent" : "bg-gray-300"
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
