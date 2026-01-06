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
    setStack((prev) => [...prev, createConversation()]);
    setIndex(stack.length);
    setInput("");
  }

  function clearConversation() {
    setStack([createConversation()]);
    setIndex(0);
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
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setOpen(false)}
          />

          {/* Chat window */}
          <div
            className={`fixed z-50 bg-bg border border-gray-300 shadow flex flex-col gaarsdal-chatbot
              ${
                expanded
                  ? "inset-6 rounded-xl"
                  : "bottom-24 right-6 w-96 max-w-[90vw] h-[70vh] rounded-xl"
              }`}
          >
            {/* Header */}
            <header className="flex justify-between items-center px-4 py-3">
              <span className="font-medium">Gaarsdal</span>

              <div className="flex items-center gap-2">
                {/* Enlarge */}
                <button
                  title="Udvid"
                  aria-label="Udvid vindue"
                  onClick={() => setExpanded((v) => !v)}
                  className="text-gray-600 hover:text-gray-800 transition"
                >
                  <ArrowsPointingOutIcon className="w-5 h-5" />
                </button>

                {/* Close */}
                <button
                  onClick={() => {
                    setOpen(false);
                    setExpanded(false);
                  }}
                  title="Luk"
                  aria-label="Luk chat"
                  className="text-gray-600 hover:text-gray-800 transition"
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
                    m.role === "user" ? "user text-right ml-auto" : "bot"
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
                <div className="flex gap-3 items-center">
                  <button onClick={pushNewConversation} title="Ny samtale">
                    <PlusIcon className="w-5 h-5" />
                  </button>

                  <button
                    onClick={goPrev}
                    disabled={index === 0}
                    title="Forrige samtale"
                    className={`transition ${
                      index === 0
                        ? "opacity-30 cursor-not-allowed"
                        : "hover:opacity-80"
                    }`}
                  >
                    <BackwardIcon className="w-5 h-5" />
                  </button>

                  <button
                    onClick={goNext}
                    disabled={index === stack.length - 1}
                    title="Næste samtale"
                    className={`transition ${
                      index === stack.length - 1
                        ? "opacity-30 cursor-not-allowed"
                        : "hover:opacity-80"
                    }`}
                  >
                    <ForwardIcon className="w-5 h-5" />
                  </button>

                  <button onClick={clearConversation} title="Ryd samtaler">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Stack dots */}
                <div className="flex gap-2">
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
