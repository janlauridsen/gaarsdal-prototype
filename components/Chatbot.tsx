import { useEffect, useRef, useState } from "react";
import {
  PlusIcon,
  BackwardIcon,
  ForwardIcon,
  EnvelopeIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Conversation = {
  messages: Message[];
};

const CONTACT_TEXT = "Hvordan kontakter jeg jer?";

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content:
    "Velkommen – godt at se dig.\n\n" +
    "Du er velkommen til at stille spørgsmål, dele tanker eller beskrive noget, der fylder. " +
    "Det kan være helt kort eller mere udfoldet. Vi tager det i dit tempo.",
};

function createConversation(): Conversation {
  return { messages: [WELCOME_MESSAGE] };
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [stack, setStack] = useState<Conversation[]>(() => [
    createConversation(),
  ]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const current = stack[index] ?? stack[stack.length - 1];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [current.messages, loading]);

  function pushNewConversation() {
    setStack((prev) => {
      const next = [...prev, createConversation()];
      setIndex(next.length - 1);
      return next;
    });
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
      const answer =
        data.answer || "Der opstod en fejl. Prøv igen senere.";

      setStack((prev) => {
        const next = [...prev];
        next[index] = {
          messages: [
            ...next[index].messages,
            { role: "assistant", content: answer },
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
      {/* Launcher */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Åbn chat"
        className="
          fixed bottom-6 right-6
          w-14 h-14 rounded-full
          bg-accent text-white
          shadow
          hover:bg-accent/90
          transition
          flex items-center justify-center
        "
      >
        <ChatBubbleOvalLeftEllipsisIcon className="w-7 h-7" />
      </button>

      {open && (
        <div
          className="
            fixed bottom-24 right-6
            w-96 max-w-[90vw]
            border border-gray-300
            rounded-xl
            shadow-sm
            bg-bg
            flex flex-col
          "
        >
          {/* Header */}
          <div className="flex justify-between items-center px-4 py-3 border-b bg-white rounded-t-xl">
            <span className="font-medium">Gaarsdal</span>
            <button onClick={() => setOpen(false)} aria-label="Luk chat">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div
            id="gaarsdal-chat-window"
            className="flex-1 overflow-y-auto p-4 space-y-3"
            style={{ maxHeight: "500px" }}
          >
            {current.messages.map((m, i) => (
              <div
                key={i}
                className={`${
                  m.role === "user" ? "text-right" : "text-left"
                } animate-fadeIn`}
              >
                <div className="inline-block px-4 py-3 rounded-lg border bg-white text-sm whitespace-pre-wrap">
                  {m.content}
                </div>
              </div>
            ))}

            {loading && <p className="text-sm">Skriver…</p>}
            <div ref={messagesEndRef} />
          </div>

          {/* Input + navigation */}
          <div className="border-t bg-white p-3 rounded-b-xl">
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

            <div className="mt-3 flex justify-between items-center">
              <div className="flex gap-2">
                <button title="Ny samtale" onClick={pushNewConversation}>
                  <PlusIcon className="w-5 h-5" />
                </button>
                <button
                  title="Tidligere samtale"
                  onClick={goPrev}
                  disabled={index === 0}
                  className={index === 0 ? "opacity-30" : ""}
                >
                  <BackwardIcon className="w-5 h-5" />
                </button>
                <button
                  title="Senere samtale"
                  onClick={goNext}
                  disabled={index === stack.length - 1}
                  className={index === stack.length - 1 ? "opacity-30" : ""}
                >
                  <ForwardIcon className="w-5 h-5" />
                </button>
              </div>

              <button title="Kontakt" onClick={() => sendMessage(CONTACT_TEXT)}>
                <EnvelopeIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Stack indicator */}
            <div className="mt-2 flex justify-center gap-1">
              {stack.map((_, i) => (
                <span
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i === index ? "bg-accent" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
