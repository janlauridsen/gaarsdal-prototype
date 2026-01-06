import { useEffect, useRef, useState } from "react";
import {
  ChatBubbleOvalLeftEllipsisIcon,
  XMarkIcon,
  PlusIcon,
  BackwardIcon,
  ForwardIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

/* ======================
   Types
====================== */

type Role = "user" | "assistant";

type Message = {
  role: Role;
  content: string;
};

type Conversation = {
  id: string;
  messages: Message[];
};

/* ======================
   Config (v5.2 locked)
====================== */

const MAX_SESSIONS = 5;
const DEBUG = false;

const UI_WELCOME =
  "Velkommen – godt at se dig.\n\n" +
  "Du er velkommen til at skrive frit.\n" +
  "Beskriv gerne det, der fylder mest for dig lige nu.";

/* ======================
   Helpers
====================== */

function createConversation(): Conversation {
  return {
    id: crypto.randomUUID(),
    messages: [],
  };
}

/* ======================
   Component
====================== */

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [stack, setStack] = useState<Conversation[]>([
    createConversation(),
  ]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const current = stack[index];

  /* ======================
     Autoscroll
  ====================== */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [current.messages, loading]);

  /* ======================
     Stack controls
  ====================== */

  function pushNewConversation() {
    if (stack.length >= MAX_SESSIONS) return;

    setStack((prev) => [...prev, createConversation()]);
    setIndex(stack.length);
    setInput("");
  }

  function deleteCurrentConversation() {
    if (stack.length === 1) {
      setStack([createConversation()]);
      setIndex(0);
      setInput("");
      return;
    }

    setStack((prev) => {
      const next = prev.filter((_, i) => i !== index);
      const nextIndex = Math.max(0, index - 1);
      setIndex(nextIndex);
      return next;
    });
  }

  function goPrev() {
    setIndex((i) => Math.max(0, i - 1));
  }

  function goNext() {
    setIndex((i) => Math.min(stack.length - 1, i + 1));
  }

  /* ======================
     Messaging
  ====================== */

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMessage: Message = {
      role: "user",
      content: text.trim(),
    };

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
          debug: DEBUG,
        }),
      });

      const data = await res.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: data.answer ?? "",
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

  /* ======================
     Render
  ====================== */

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
            onClick={() => setOpen(false)}
          />

          {/* Chat window */}
          <div className="fixed bottom-24 right-6 w-96 max-w-[90vw] h-[70vh] bg-bg border border-gray-300 rounded-xl shadow flex flex-col z-50 gaarsdal-chatbot">
            {/* Header */}
            <header className="flex justify-between items-center px-4 py-3">
              <span className="font-medium">Gaarsdal</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Luk chat"
                title="Luk"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
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
                  } max-w-[85%] px-4 py-3 whitespace-pre-wrap`}
                >
                  {m.content}
                </div>
              ))}

              {loading && (
                <div className="text-sm opacity-60">Skriver…</div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input + nav */}
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
                    title="Ny samtale"
                    disabled={stack.length >= MAX_SESSIONS}
                    className={
                      stack.length >= MAX_SESSIONS
                        ? "opacity-30 cursor-not-allowed"
                        : ""
                    }
                  >
                    <PlusIcon className="w-5 h-5" />
                  </button>

                  <button
                    onClick={goPrev}
                    disabled={index === 0}
                    title="Forrige"
                    className={index === 0 ? "opacity-30" : ""}
                  >
                    <BackwardIcon className="w-5 h-5" />
                  </button>

                  <button
                    onClick={goNext}
                    disabled={index === stack.length - 1}
                    title="Næste"
                    className={
                      index === stack.length - 1 ? "opacity-30" : ""
                    }
                  >
                    <ForwardIcon className="w-5 h-5" />
                  </button>

                  <button
                    onClick={deleteCurrentConversation}
                    title="Slet denne samtale"
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
