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

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ApiResponse = {
  answer: string;
  jan_raw?: string;
  evaluator?: string;
  final?: string;
};

function createConversation() {
  return [] as Message[];
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [stack, setStack] = useState<Message[][]>([createConversation()]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messages = stack[index];

  const DEBUG = true; // HARD-ON

  /* =========================
     Auto-scroll
     ========================= */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /* =========================
     Stack controls
     ========================= */
  function pushNewConversation() {
    setStack((prev) => [...prev, createConversation()]);
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

    const nextMessages: Message[] = [
      ...messages,
      { role: "user", content: text },
    ];

    setStack((prev) => {
      const copy = [...prev];
      copy[index] = nextMessages;
      return copy;
    });

    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      const data: ApiResponse = await res.json();

      const assistantMessages: Message[] = [];

      if (DEBUG && data.jan_raw && data.evaluator && data.final) {
        assistantMessages.push(
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
          }
        );
      } else {
        assistantMessages.push({
          role: "assistant",
          content: data.answer,
        });
      }

      setStack((prev) => {
        const copy = [...prev];
        copy[index] = [...nextMessages, ...assistantMessages];
        return copy;
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
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-green-700 text-white shadow flex items-center justify-center"
        >
          <ChatBubbleOvalLeftEllipsisIcon className="w-7 h-7" />
        </button>
      )}

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => {
            setOpen(false);
            setExpanded(false);
          }}
        />
      )}

      {/* Chat window */}
      {open && (
        <div
          className={`fixed z-50 gaarsdal-chatbot flex flex-col
            ${
              expanded
                ? "inset-6 max-w-none max-h-none"
                : "bottom-24 right-6 w-[380px] max-h-[70vh]"
            }
          `}
        >
          {/* Header */}
          <header className="flex justify-between items-center px-4 py-3">
            <span className="font-medium">
              Gaarsdal {DEBUG && "(debug)"}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setExpanded((v) => !v)}>
                <ArrowsPointingOutIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  setExpanded(false);
                }}
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Messages */}
          <div
            id="gaarsdal-chat-window"
            className="messages flex-1 overflow-y-auto px-4 py-3 space-y-3"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`message ${
                  m.role === "user" ? "user ml-auto" : "bot"
                } max-w-[85%] px-4 py-3 rounded-lg whitespace-pre-wrap`}
              >
                {m.content}
              </div>
            ))}

            {loading && (
              <div className="text-sm opacity-70">Skriver…</div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer */}
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
              className="w-full rounded-md border px-3 py-2 text-sm resize-none"
              placeholder="Skriv dit spørgsmål…"
            />

            <div className="mt-2 flex justify-between items-center">
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
                  sendMessage("Hvordan kan jeg komme i kontakt med dig?")
                }
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
