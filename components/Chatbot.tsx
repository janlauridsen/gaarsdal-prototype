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

function createConversation(): Conversation {
  return { messages: [] };
}

const UI_WELCOME =
  "Velkommen – godt at se dig.\n\n" +
  "Du er velkommen til at stille spørgsmål eller beskrive noget, der fylder. " +
  "Vi tager det i dit tempo.";

const CONTACT_ANSWER =
  "Du er velkommen til at kontakte mig direkte.\n\n" +
  "Telefon: +45 42 80 74 74\n" +
  "E-mail: jan@gaarsdal.net\n\n" +
  "Du kan også bruge kontaktformularen på:\nhttps://gaarsdal.net/kontakt";

function isContactIntent(text: string) {
  const t = text.toLowerCase();
  return (
    t.includes("kontakt") ||
    t.includes("ringe") ||
    t.includes("skrive") ||
    t.includes("tale med jan")
  );
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

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const current = stack[index];
  const mobile = isMobile();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [current.messages, loading]);

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

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    // Kontakt short-circuit
    if (isContactIntent(text)) {
      setStack((prev) => {
        const next = [...prev];
        next[index] = {
          messages: [
            ...next[index].messages,
            { role: "user", content: text },
            { role: "assistant", content: CONTACT_ANSWER },
          ],
        };
        return next;
      });
      setInput("");
      return;
    }

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
      const answer = data.answer ?? "";

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
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => {
              setOpen(false);
              setExpanded(false);
            }}
          />

          {/* Chat window */}
          <div
            className={`fixed z-50 bg-bg flex flex-col border border-gray-300
              ${
                expanded && mobile
                  ? "inset-0 rounded-none"
                  : expanded
                  ? "bottom-12 right-12 w-[620px] h-[80vh] rounded-xl"
                  : "bottom-24 right-6 w-96 max-w-[90vw] rounded-xl"
              }
            `}
          >
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-3 border-b bg-white">
              <span className="font-medium">Gaarsdal</span>
              <div className="flex gap-1">
                <button onClick={() => setExpanded((v) => !v)} className="p-3">
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
            <div
              className="flex-1 overflow-y-auto p-4 space-y-3"
              style={{ minHeight: 0 }}
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
                  <div className="inline-block px-4 py-3 rounded-lg border bg-white text-sm whitespace-pre-wrap">
                    {m.content}
                  </div>
                </div>
              ))}

              {loading && <p className="text-sm">Skriver…</p>}
              <div ref={messagesEndRef} />
            </div>

            {/* Input + navigation */}
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
                <button onClick={() => sendMessage("Hvordan kontakter jeg jer?")}>
                  <EnvelopeIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
