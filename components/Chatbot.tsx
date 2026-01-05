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

/** UI-only welcome. Must NEVER be sent to API */
const UI_WELCOME =
  "Velkommen – godt at se dig.\n\n" +
  "Du er velkommen til at stille spørgsmål eller beskrive noget, der fylder. " +
  "Vi tager det i dit tempo.";

const CONTACT_QUESTION = "Hvordan kontakter jeg jer?";

const DEBUG = false; // 🔥 altid ON i testforløb

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const [stack, setStack] = useState<Conversation[]>(() => [
    createConversation(),
  ]);
  const [index, setIndex] = useState(0);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const current = stack[index];

  /** Scroll to bottom on new content */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [current.messages, loading]);

  function pushConversation() {
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

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMessage: Message = { role: "user", content: text };

    // append user message first
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
      } else if (data.answer) {
        assistantMessages.push({
          role: "assistant",
          content: data.answer,
        });
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
      {open && <div className="gaarsdal-overlay" />}

      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-green-700 text-white shadow flex items-center justify-center z-40"
        >
          <ChatBubbleOvalLeftEllipsisIcon className="w-7 h-7" />
        </button>
      )}

      {open && (
        <div
          className={`gaarsdal-chatbot ${
            expanded
              ? "bottom-6 right-6 w-[620px] h-[80vh]"
              : "bottom-24 right-6 w-96 max-w-[90vw]"
          }`}
        >
          {/* Header */}
          <header className="flex justify-between items-center px-4 py-3">
            <span className="font-medium">
              Gaarsdal {DEBUG && "(debug)"}
            </span>
            <div className="flex gap-2">
              <button
                className="gaarsdal-icon-btn"
                onClick={() => setExpanded((v) => !v)}
              >
                <ArrowsPointingOutIcon className="w-5 h-5" />
              </button>
              <button
                className="gaarsdal-icon-btn"
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
          <div id="gaarsdal-chat-window" className="messages">
            {current.messages.length === 0 && (
              <div className="message bot whitespace-pre-wrap">
                {UI_WELCOME}
              </div>
            )}

            {current.messages.map((m, i) => (
              <div
                key={i}
                className={`message ${m.role === "user" ? "user" : "bot"}`}
              >
                {m.content}
              </div>
            ))}

            {loading && <div className="text-sm opacity-70">Skriver…</div>}
            <div ref={messagesEndRef} />
          </div>

          {/* Stack dots */}
          <div className="gaarsdal-stack-dots">
            {stack.map((_, i) => (
              <div
                key={i}
                className={`gaarsdal-stack-dot ${
                  i === index ? "active" : ""
                }`}
              />
            ))}
          </div>

          {/* Footer */}
          <footer>
            <textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Skriv dit spørgsmål…"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
            />

            <div className="mt-3 flex justify-between items-center">
              <div className="flex gap-2">
                <button onClick={pushConversation}>
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

              <button onClick={() => sendMessage(CONTACT_QUESTION)}>
                <EnvelopeIcon className="w-5 h-5" />
              </button>
            </div>
          </footer>
        </div>
      )}
    </>
  );
}
