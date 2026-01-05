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

type Conversation = {
  messages: Message[];
};

const UI_WELCOME =
  "Velkommen – godt at se dig.\n\n" +
  "Du er velkommen til at stille spørgsmål eller beskrive noget, der fylder. " +
  "Vi tager det i dit tempo.";

function createConversation(): Conversation {
  return { messages: [] };
}

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
        body: JSON.stringify({
          messages: current.messages.concat({
            role: "user",
            content: text,
          }),
        }),
      });

      const data = await res.json();
      const answer = data?.answer ?? "";

      setStack((prev) => {
        const next = [...prev];
        next[index] = {
          messages: [
            ...next[index].messages,
            {
              role: "assistant",
              content:
                typeof answer === "string" && answer.trim()
                  ? answer
                  : "Jeg fik ikke formuleret et svar. Vil du prøve igen?",
            },
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
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-accent text-white shadow flex items-center justify-center"
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
            className={`fixed z-50 bg-bg flex flex-col border border-gray-300 rounded-xl
              ${
                expanded
                  ? "top-1/2 left-1/2 w-[90vw] max-w-[720px] max-h-[85vh] -translate-x-1/2 -translate-y-1/2"
                  : "bottom-24 right-6 w-96 max-w-[90vw] max-h-[70vh]"
              }`}
          >
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-3 border-b bg-white">
              <span className="font-medium">Gaarsdal</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="p-3"
                >
                  <ArrowsPointingOutIcon className="w-6 h-6" />
                </button>
                <button
                  onClick={() => {
                    setOpen(false);
                    setExpanded(false);
                  }}
                  className="p-3"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="overflow-y-auto p-4 space-y-3">
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
                  <div className="inline-block px-4 py-3 rounded-lg border bg-white text-sm whitespace-pre-wrap">
                    {m.content}
                  </div>
                </div>
              ))}

              {loading && <p className="text-sm">Skriver…</p>}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t bg-white p-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    sendMessage(input);
                  }
                }}
                rows={2}
                className="w-full border rounded-md px-3 py-2 text-sm resize-none"
                placeholder="Skriv dit spørgsmål…"
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
