import { useEffect, useRef, useState } from "react";
import {
  HomeIcon,
  PlusIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  EnvelopeIcon,
  ChatBubbleOvalLeftEllipsisIcon,
} from "@heroicons/react/24/outline";

/* ---------- typer ---------- */

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Conversation = {
  id: string;
  messages: Message[];
  startedAt: number;
};

/* ---------- konstanter ---------- */

const CONTACT_TEXT = "Hvordan kontakter jeg jer?";

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content:
    "Velkommen – godt at se dig.\n\n" +
    "Du er velkommen til at stille spørgsmål, dele tanker eller beskrive noget, der fylder. " +
    "Det kan være helt kort eller mere udfoldet. Vi tager det i dit tempo.",
};

/* ---------- helpers ---------- */

function newConversation(): Conversation {
  return {
    id: crypto.randomUUID(),
    messages: [WELCOME_MESSAGE],
    startedAt: Date.now(),
  };
}

/* ---------- komponent ---------- */

export default function Chatbot() {
  const [open, setOpen] = useState(false);

  // stack + cursor
  const [stack, setStack] = useState<Conversation[]>([newConversation()]);
  const [index, setIndex] = useState(0);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const current = stack[index];

  /* ---------- scroll ---------- */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [current.messages, loading]);

  /* ---------- navigation ---------- */

  function pushNewConversation() {
    const next = newConversation();
    setStack((prev) => [...prev.slice(0, index + 1), next]);
    setIndex((prev) => prev + 1);
    setInput("");
  }

  function goBack() {
    if (index > 0) setIndex(index - 1);
  }

  function goForward() {
    if (index < stack.length - 1) setIndex(index + 1);
  }

  function goHome() {
    setIndex(stack.length - 1);
  }

  /* ---------- messaging ---------- */

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: "user", content: text };

    const updatedStack = [...stack];
    updatedStack[index] = {
      ...current,
      messages: [...current.messages, userMsg],
    };

    setStack(updatedStack);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedStack[index].messages }),
      });

      const data = await res.json();
      const answer =
        data.answer || "Der opstod en fejl. Prøv igen senere.";

      updatedStack[index] = {
        ...updatedStack[index],
        messages: [
          ...updatedStack[index].messages,
          { role: "assistant", content: answer },
        ],
      };

      setStack([...updatedStack]);
    } finally {
      setLoading(false);
    }
  }

  /* ---------- render ---------- */

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
        <div className="fixed bottom-24 right-6 w-96 max-w-[90vw] border rounded-lg bg-white flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center px-4 py-2 border-b">
            <span className="font-medium">Gaarsdal</span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Luk chat"
              className="text-lg"
            >
              ✕
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
                <div className="inline-block px-3 py-2 rounded border text-sm whitespace-pre-wrap">
                  {m.content}
                </div>
              </div>
            ))}

            {loading && <p className="text-sm">Skriver…</p>}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t">
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
              className="w-full border rounded px-3 py-2 text-sm resize-none"
              placeholder="Skriv dit spørgsmål…"
            />

            {/* Navigation bar */}
            <div className="mt-2 flex justify-between items-center">
              <div className="flex gap-2">
                {/* Ny samtale */}
                <button onClick={pushNewConversation} aria-label="Ny samtale">
                  <PlusIcon className="w-5 h-5" />
                </button>

                {/* Tilbage */}
                <button
                  onClick={goBack}
                  disabled={index === 0}
                  aria-label="Tilbage"
                  className={index === 0 ? "opacity-30" : ""}
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                </button>

                {/* Frem */}
                <button
                  onClick={goForward}
                  disabled={index === stack.length - 1}
                  aria-label="Frem"
                  className={index === stack.length - 1 ? "opacity-30" : ""}
                >
                  <ArrowRightIcon className="w-5 h-5" />
                </button>

                {/* Home */}
                <button
                  onClick={goHome}
                  disabled={index === stack.length - 1}
                  aria-label="Home"
                  className={index === stack.length - 1 ? "opacity-30" : ""}
                >
                  <HomeIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Kontakt */}
              <button
                onClick={() => sendMessage(CONTACT_TEXT)}
                aria-label="Kontakt"
              >
                <EnvelopeIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
