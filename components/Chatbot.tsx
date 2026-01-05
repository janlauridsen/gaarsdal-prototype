import { useEffect, useRef, useState } from "react";
import {
  PlusIcon,
  BackwardIcon,
  ForwardIcon,
  EnvelopeIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  XMarkIcon,
  ArrowsPointingOutIcon,
} from "@heroicons/react/24/outline";

/* =========================
   Types
   ========================= */

type Role = "user" | "assistant";

type Message = {
  role: Role;
  content: string;
};

type Conversation = {
  id: number;
  messages: Message[];
};

/* =========================
   UI-only constants
   (NEVER sent to AI)
   ========================= */

const UI_WELCOME = `Velkommen – godt at se dig.

Du er velkommen til at stille spørgsmål eller beskrive noget, der fylder.
Vi tager det i dit tempo.`;

/* =========================
   Helpers
   ========================= */

function createConversation(id: number): Conversation {
  return { id, messages: [] };
}

function isMobile() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 768px)").matches;
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
  const mobile = isMobile();

  /* =========================
     Scroll to bottom on update
     ========================= */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [current.messages, loading]);

  /* =========================
     Stack navigation
     ========================= */

  function pushNewConversation() {
    setStack((prev) => {
      const nextId = prev.length;
      return [...prev, createConversation(nextId)];
    });
    setIndex(stack.length);
    setInput("");
  }

  function goPrev() {
    setIndex((i) => Math.max(0, i - 1));
  }

  function goNext() {
    setIndex((i) => Math.min(stack.length - 1, i + 1));
  }

  /* =========================
     Send message
     ========================= */

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMessage: Message = {
      role: "user",
      content: text.trim(),
    };

    // 1. Append USER message locally
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
      // IMPORTANT:
      // Only REAL messages are sent to API.
      // UI_WELCOME is NOT included anywhere.
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...current.messages, userMessage],
        }),
      });

      const data = await res.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: data.answer ?? "",
      };

      // 2. Append ASSISTANT message
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

  /* =========================
     Render
     ========================= */

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-accent text-white shadow flex items-center justify-center"
        >
          <ChatBubbleOvalLeftEllipsisIcon className="w-7 h-7" />
        </button>
      )}

      {open && (
        <div
          className={`fixed z-50 gaarsdal-chatbot flex flex-col
            ${
              expanded && mobile
                ? "inset-0 rounded-none"
                : expanded
                ? "bottom-12 right-12 w-[620px] h-[80vh] rounded-xl"
                : "bottom-24 right-6 w-96 max-w-[90vw] rounded-xl"
            }`}
        >
          {/* Header */}
          <header className="flex justify-between items-center px-4 py-3">
            <span className="font-medium">Gaarsdal</span>
            <div className="flex gap-1">
              <button onClick={() => setExpanded((v) => !v)} className="p-2">
                <ArrowsPointingOutIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  setExpanded(false);
                }}
                className="p-2"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Messages */}
          <div className="messages flex-1 overflow-y-auto p-4 space-y-3">
            {/* UI-only welcome */}
            {current.messages.length === 0 && (
              <div className="message bot whitespace-pre-wrap">
                {UI_WELCOME}
              </div>
            )}

            {current.messages.map((m, i) => (
              <div
                key={i}
                className={`message ${
                  m.role === "user" ? "user text-right ml-auto" : "bot"
                } max-w-[85%] px-4 py-3`}
              >
                {m.content}
              </div>
            ))}

            {loading && <p className="text-sm opacity-60">Skriver…</p>}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <footer className="p-3">
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
              placeholder="Skriv dit spørgsmål…"
            />

            <div className="mt-3 flex justify-between items-center">
              <div className="flex gap-2">
                <button onClick={pushNewConversation}>
                  <PlusIcon className="w-5 h-5" />
                </button>
                <button onClick={goPrev} disabled={index === 0}>
                  <BackwardIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={goNext}
                  disabled={index === stack.length - 1}
                >
                  <ForwardIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Stack indicator dots */}
              <div className="flex gap-1">
                {stack.map((_, i) => (
                  <span
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i === index ? "bg-green-700" : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={() => sendMessage("Hvordan kontakter jeg jer?")}
              >
                <EnvelopeIcon className="w-5 h-5" />
              </button>
            </div>
          </footer>
        </div>
      )}
    </>
  );
}
