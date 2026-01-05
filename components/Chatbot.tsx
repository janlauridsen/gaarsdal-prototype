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

type Role = "user" | "assistant";

type Message = {
  role: Role;
  content: string;
};

type Conversation = {
  messages: Message[];
};

function createConversation(): Conversation {
  return { messages: [] };
}

/**
 * DEBUG ER FAST TIL ON
 * Matcher api/chat.ts
 */
const DEBUG = true;

const UI_WELCOME =
  "Velkommen – godt at se dig.\n\n" +
  "Du er velkommen til at stille spørgsmål eller beskrive noget, der fylder. " +
  "Vi tager det i dit tempo.";

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
  const current = stack[index];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [current.messages, loading]);

  function pushNewConversation() {
    setStack((prev) => [...prev, createConversation()]);
    setIndex((prev) => prev + 1);
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

    const userMessage: Message = {
      role: "user",
      content: text,
    };

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
        }),
      });

      const data = await res.json();

      let assistantMessages: Message[] = [];

      if (DEBUG) {
        assistantMessages = [
          {
            role: "assistant",
            content: "— JAN (RAW) —\n" + data.jan_raw,
          },
          {
            role: "assistant",
            content: "— EVALUATOR —\n" + data.evaluator,
          },
          {
            role: "assistant",
            content: "— JAN (FINAL) —\n" + data.final,
          },
        ];
      } else {
        assistantMessages = [
          {
            role: "assistant",
            content: data.answer,
          },
        ];
      }

      setStack((prev) => {
        const next = [...prev];
        next[index] = {
          messages: [...next[index].messages, ...assistantMessages],
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
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-green-700 text-white shadow-lg flex items-center justify-center z-50"
        >
          <ChatBubbleOvalLeftEllipsisIcon className="w-7 h-7" />
        </button>
      )}

      {open && (
        <>
          {/* DARK OVERLAY */}
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => {
              setOpen(false);
              setExpanded(false);
            }}
          />

          <div
            className={`fixed z-50 flex flex-col gaarsdal-chatbot
              ${
                expanded
                  ? "inset-6 max-w-none h-[calc(100vh-3rem)]"
                  : "bottom-24 right-6 w-[380px] max-w-[90vw] h-[520px]"
              }
            `}
          >
            {/* HEADER */}
            <header className="flex justify-between items-center px-4 py-3">
              <span className="font-medium">Gaarsdal</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="p-2"
                >
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

            {/* MESSAGES */}
            <div
              id="gaarsdal-chat-window"
              className="messages flex-1 overflow-y-auto p-4 space-y-3"
            >
              {current.messages.length === 0 && (
                <div className="text-sm whitespace-pre-wrap bg-white border rounded-lg p-4">
                  {UI_WELCOME}
                </div>
              )}

              {current.messages.map((m, i) => (
                <div
                  key={i}
                  className={m.role === "user" ? "text-right" : "text-left"}
                >
                  <div
                    className={`message inline-block px-4 py-3 rounded-lg border text-sm whitespace-pre-wrap ${
                      m.role === "user"
                        ? "user"
                        : "bot bg-white"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {loading && <p className="text-sm">Skriver…</p>}
              <div ref={messagesEndRef} />
            </div>

            {/* INPUT */}
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
                <button
                  onClick={() =>
                    sendMessage("Hvordan kontakter jeg jer?")
                  }
                >
                  <EnvelopeIcon className="w-5 h-5" />
                </button>
              </div>
            </footer>
          </div>
        </>
      )}
    </>
  );
}
