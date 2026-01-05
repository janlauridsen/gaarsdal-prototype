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

function isMobile() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 768px)").matches;
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
  const [firstOpen, setFirstOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const current = stack[index] ?? stack[stack.length - 1];
  const mobile = isMobile();

  useEffect(() => {
    const seen = localStorage.getItem("chatbot_seen");
    if (!seen) {
      setFirstOpen(true);
      localStorage.setItem("chatbot_seen", "1");
    }
  }, []);

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

    setFirstOpen(false);

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
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Åbn chat"
          className="
            fixed bottom-6 right-6
            w-14 h-14 rounded-full
            bg-accent text-white
            shadow
            flex items-center justify-center
          "
        >
          <ChatBubbleOvalLeftEllipsisIcon className="w-7 h-7" />
        </button>
      )}

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: "rgba(0,0,0,0.14)" }}
          onClick={() => {
            setOpen(false);
            setExpanded(false);
          }}
        />
      )}

      {/* Chatbot */}
      {open && (
        <div
          className={`
            fixed z-50 bg-bg flex flex-col border border-gray-300
            shadow-[0_24px_48px_rgba(0,0,0,0.18),_0_6px_14px_rgba(0,0,0,0.08)]
            ${
              expanded && mobile
                ? "inset-0 rounded-none"
                : expanded && !mobile
                ? "bottom-12 right-12 w-[620px] h-[80vh] rounded-xl"
                : "bottom-24 right-6 w-96 max-w-[90vw] rounded-xl"
            }
          `}
        >
          {/* Header */}
          <div className="flex justify-between items-center px-4 py-3 border-b bg-white">
            <span className="font-medium">Gaarsdal</span>

            <div className="flex gap-1">
              <button
                className="p-3"
                aria-label="Udvid"
                onClick={() => setExpanded((v) => !v)}
              >
                <ArrowsPointingOutIcon className="w-6 h-6" />
              </button>

              <button
                className="p-3"
                aria-label="Luk chat"
                onClick={() => {
                  setOpen(false);
                  setExpanded(false);
                }}
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            id="gaarsdal-chat-window"
            className="flex-1 overflow-y-auto p-4 space-y-3"
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

          {/* Input + chips + navigation */}
          <div className="border-t bg-white p-3">
            {firstOpen && current.messages.length === 1 && (
              <div className="flex gap-2 mb-2 overflow-x-auto">
                <button
                  className="px-3 py-1 rounded-full bg-gray-100 text-sm"
                  onClick={() => sendMessage(CONTACT_TEXT)}
                >
                  Kontakt
                </button>
                <button className="px-3 py-1 rounded-full bg-gray-100 text-sm">
                  Brug af chatbotten
                </button>
                <button className="px-3 py-1 rounded-full bg-gray-100 text-sm">
                  Forbehold
                </button>
              </div>
            )}

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
                <button onClick={pushNewConversation}>
                  <PlusIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={goPrev}
                  disabled={index === 0}
                  className={index === 0 ? "opacity-30" : ""}
                >
                  <BackwardIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={goNext}
                  disabled={index === stack.length - 1}
                  className={index === stack.length - 1 ? "opacity-30" : ""}
                >
                  <ForwardIcon className="w-5 h-5" />
                </button>
              </div>

              <button onClick={() => sendMessage(CONTACT_TEXT)}>
                <EnvelopeIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
