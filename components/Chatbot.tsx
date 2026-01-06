/**
 * Chatbot.tsx
 * ------------------------------------------------------------
 * VERSION: 6.1
 * BASELINE: v6.0 → v6.1
 *
 * FORMÅL
 * - UI-baseret chatbot med session stack (max 5 samtidige samtaler)
 * - Én bruger, flere sessions (stack), ét runtime
 * - Ingen persistence endnu (kommer i v6.2+)
 *
 * FUNKTIONER I DENNE VERSION
 * - Stack-baseret sessions (op til MAX_SESSIONS = 5)
 * - Aktiv session kan slettes uden at slette resten
 * - Klikbare stack-dots til navigation mellem sessions
 * - Forrige / næste navigation via pile
 * - Enlarge / collapse af chatvindue
 * - UI-velkomst vises KUN lokalt (sendes ikke til AI)
 * - Overlay bag chat (darkened HTML)
 * - Autoscroll til nyeste besked
 * - Debug-flag sendes eksplicit til backend
 *
 * BEVIDSTE FRAVALG / IKKE IMPLEMENTERET ENDNU
 * - Persistence (localStorage / backend)
 * - Session-metadata (titel, status, evaluering)
 * - Evaluator-chips i UI
 * - Log / audit
 *
 * VIGTIGT
 * - Denne fil er autoritativ baseline for v6.1
 * - Ændringer fremover SKAL ske oven på denne fil
 * - Ingen implicit refaktorering eller komprimering tilladt
 *
 * SIDST ÆNDRET
 * - Tilføjet MAX_SESSIONS limit + disable af "+"
 * - Korrekt sletning af KUN aktiv session
 * - Klikbare stack-dots
 * - Stabil enlarge-logik
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

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Conversation = {
  messages: Message[];
};

const UI_WELCOME =
  "Velkommen – godt at se dig.\n\n" +
  "Du er velkommen til at skrive frit. " +
  "Beskriv gerne det, der fylder mest for dig lige nu.";

const DEBUG = false;
const MAX_SESSIONS = 5;

function createConversation(): Conversation {
  return { messages: [] };
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [stack, setStack] = useState<Conversation[]>([createConversation()]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const current = stack[index];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [current.messages, loading]);

  function pushNewConversation() {
    if (stack.length >= MAX_SESSIONS) return;
    setStack((prev) => [...prev, createConversation()]);
    setIndex(stack.length);
    setInput("");
  }

  function clearCurrentConversation() {
    setStack((prev) => {
      if (prev.length === 1) return [createConversation()];
      const next = prev.filter((_, i) => i !== index);
      return next.length ? next : [createConversation()];
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

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMessage: Message = { role: "user", content: text };

    setStack((prev) => {
      const next = [...prev];
      next[index] = {
        messages: [...next[index].messages, userMessage],
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
        next[index] = {
          messages: [
            ...next[index].messages,
            { role: "assistant", content: data.answer ?? "" },
          ],
        };
        return next;
      });
    } finally {
      setLoading(false);
    }
  }

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
            {/* Header */}
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

            {/* Messages */}
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
                <div className="flex gap-3 items-center">
                  <button
                    onClick={pushNewConversation}
                    title={
                      stack.length >= MAX_SESSIONS
                        ? "Maks. 5 samtaler"
                        : "Ny samtale"
                    }
                    disabled={stack.length >= MAX_SESSIONS}
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
                      index === stack.length - 1 ? "opacity-40" : ""
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

                {/* Stack dots */}
                <div className="flex gap-1">
                  {stack.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setIndex(i)}
                      title={`Samtale ${i + 1}`}
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
