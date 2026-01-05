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

function createConversation() {
  return { messages: [] as Message[] };
}

const UI_WELCOME =
  "Velkommen – godt at se dig.\n\n" +
  "Du er velkommen til at stille spørgsmål eller beskrive noget, der fylder. " +
  "Vi tager det i dit tempo.";

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [stack, setStack] = useState([createConversation()]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const current = stack[index];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [current.messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    setStack((prev) => {
      const next = [...prev];
      next[index] = {
        messages: [...next[index].messages, { role: "user", content: text }],
      };
      return next;
    });

    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: current.messages }),
      });

      const data = await res.json();

      setStack((prev) => {
        const next = [...prev];
        next[index] = {
          messages: [
            ...next[index].messages,
            { role: "assistant", content: data.answer },
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
          className="gaarsdal-launcher fixed bottom-6 right-6 w-14 h-14 flex items-center justify-center"
        >
          <ChatBubbleOvalLeftEllipsisIcon className="w-7 h-7" />
        </button>
      )}

      {open && (
        <>
          <div className="gaarsdal-overlay" onClick={() => setOpen(false)} />

          <div className="gaarsdal-chatbot bottom-24 right-6 w-96 max-w-[90vw]">
            <header className="flex justify-between items-center px-4 py-3">
              <span className="font-medium">Gaarsdal</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="gaarsdal-icon-btn"
                >
                  <ArrowsPointingOutIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="gaarsdal-icon-btn"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </header>

            <div className="messages">
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

              {loading && <p className="text-sm">Skriver…</p>}
              <div ref={messagesEndRef} />
            </div>

            <div className="gaarsdal-stack-dots">
              {stack.map((_, i) => (
                <span
                  key={i}
                  className={`gaarsdal-stack-dot ${
                    i === index ? "active" : ""
                  }`}
                />
              ))}
            </div>

            <footer>
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

              <div className="mt-3 flex justify-between">
                <button
                  onClick={() => {
                    setStack((s) => [...s, createConversation()]);
                    setIndex(stack.length);
                  }}
                  className="gaarsdal-icon-btn"
                >
                  <PlusIcon className="w-5 h-5" />
                </button>

                <button
                  onClick={() => sendMessage("Hvordan kontakter jeg jer?")}
                  className="gaarsdal-icon-btn"
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
