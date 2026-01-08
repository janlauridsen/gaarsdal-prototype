/**
 * Chatbot.tsx
 * TRIN 3 – Session-resume UX
 *
 * Additiv ændring:
 * - Avatar i chatbot-header (Jan)
 *
 * Intet andet ændret.
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
  evaluatorChips?: string[];
};

type Conversation = {
  id: string;
  messages: Message[];
  requiresResumeConfirmation?: boolean;
};

const UI_WELCOME =
  "Velkommen – godt at se dig.\n\n" +
  "Du er velkommen til at skrive frit. " +
  "Beskriv gerne det, der fylder mest for dig lige nu.";

const DEBUG = false;
const MAX_SESSIONS = 5;

function createConversation(): Conversation {
  return {
    id: crypto.randomUUID(),
    messages: [],
    requiresResumeConfirmation: false,
  };
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
        ...next[index],
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
          sessionId: current.id,
          debug: DEBUG,
        }),
      });

      const data = await res.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: data.answer ?? "",
        evaluatorChips: Array.isArray(data.evaluator?.chips)
          ? data.evaluator.chips.slice(0, 3)
          : [],
      };

      setStack((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          messages: [...next[index].messages, assistantMessage],
          requiresResumeConfirmation:
            data.requires_resume_confirmation ?? false,
        };
        return next;
      });
    } finally {
      setLoading(false);
    }
  }

  function handleChipClick(label: string) {
    sendMessage(label);
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
            className={`fixed z-50 gaarsdal-chatbot flex flex-col ${
              expanded
                ? "inset-4 md:inset-10"
                : "bottom-24 right-6 w-96 max-w-[90vw] h-[70vh]"
            }`}
          >
            {/* HEADER */}
            <header className="flex justify-between items-center px-4 py-3">
              <div className="flex items-center gap-2">
                <img
                  src="/jan.gif"
                  alt="Jan the man"
                  width={32}
                  height={32}
                  className="rounded-full opacity-90"
                />
                <span className="font-medium">Gaarsdal</span>
              </div>

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

            {/* MESSAGES */}
            <div
              id="gaarsdal-chat-window"
              className="flex-1 overflow-y-auto p-4 space-y-3 messages"
            >
              {current.requiresResumeConfirmation && (
                <div className="p-4 border rounded bg-yellow-50 text-sm">
                  <p className="mb-2">
                    Denne samtale er fra tidligere. Vil du genoptage den eller
                    starte en ny?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setStack((prev) => {
                          const next = [...prev];
                          next[index] = {
                            ...next[index],
                            requiresResumeConfirmation: false,
                          };
                          return next;
                        });
                      }}
                      className="px-3 py-1 border rounded"
                    >
                      Genoptag
                    </button>
                    <button
                      onClick={() => {
                        setStack((prev) => {
                          const next = [...prev];
                          next[index] = createConversation();
                          return next;
                        });
                      }}
                      className="px-3 py-1 border rounded"
                    >
                      Start ny
                    </button>
                  </div>
                </div>
              )}

              {!current.requiresResumeConfirmation &&
                current.messages.length === 0 && (
                  <div className="message bot whitespace-pre-wrap p-4 max-w-[85%]">
                    {UI_WELCOME}
                  </div>
                )}

              {!current.requiresResumeConfirmation &&
                current.messages.map((m, i) => {
                  const isLastBot =
                    m.role === "assistant" &&
                    i === current.messages.length - 1;

                  return (
                    <div key={i} className="space-y-2">
                      <div
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

                      {isLastBot &&
                        m.evaluatorChips &&
                        m.evaluatorChips.length > 0 && (
                          <div className="flex gap-2 flex-wrap pl-2">
                            {m.evaluatorChips.map((chip, ci) => (
                              <button
                                key={ci}
                                onClick={() => handleChipClick(chip)}
                                className="text-xs px-3 py-1 rounded-full border bg-white hover:bg-gray-100"
                                title="Forslag"
                              >
                                {chip}
                              </button>
                            ))}
                          </div>
                        )}
                    </div>
                  );
                })}

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
                    sendMessage(input);
                  }
                }}
                rows={2}
                className="w-full border rounded-md px-3 py-2 text-sm resize-none"
                placeholder="Skriv her…"
                disabled={current.requiresResumeConfirmation}
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
              </div>
            </footer>
          </div>
        </>
      )}
    </>
  );
}
