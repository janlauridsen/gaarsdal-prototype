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

/* =====================
   TYPER
===================== */

type ViewState = {
  node: string;
  kind: "MENU" | "STATIC" | "DIALOG";
  message: string;
  chips: string[];
  terminal: boolean;
};

type Conversation = {
  id: string;
  view?: ViewState;
};

const UI_WELCOME =
  "Velkommen.\n\nVælg en mulighed herunder for at fortsætte.";

const MAX_SESSIONS = 5;

/* =====================
   HELPERS
===================== */

function createConversation(): Conversation {
  return {
    id: crypto.randomUUID(),
  };
}

/* =====================
   COMPONENT
===================== */

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [stack, setStack] = useState<Conversation[]>([
    createConversation(),
  ]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentNode, setCurrentNode] = useState<string>("ROOT");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const current = stack[index];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [current.view, loading]);

  /* =====================
     SESSION CONTROLS
  ===================== */

  function pushNewConversation() {
    if (stack.length >= MAX_SESSIONS) return;
    setStack((prev) => [...prev, createConversation()]);
    setIndex(stack.length);
    setCurrentNode("ROOT");
    setInput("");
  }

  function clearCurrentConversation() {
    setStack((prev) => {
      if (prev.length === 1) return [createConversation()];
      const next = prev.filter((_, i) => i !== index);
      return next.length ? next : [createConversation()];
    });
    setIndex((i) => Math.max(0, i - 1));
    setCurrentNode("ROOT");
    setInput("");
  }

  function goPrev() {
    setIndex((i) => Math.max(0, i - 1));
  }

  function goNext() {
    setIndex((i) => Math.min(stack.length - 1, i + 1));
  }

  /* =====================
     CORE API CALL
  ===================== */

  async function send(payload: { text?: string; chip?: string }) {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: current.id,
          currentNode,
          ...payload,
        }),
      });

      const data: ViewState = await res.json();

      setStack((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          view: data,
        };
        return next;
      });

      setCurrentNode(data.node);
    } finally {
      setLoading(false);
    }
  }

  /* =====================
     RENDER
  ===================== */

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full gaarsdal-launcher flex items-center justify-center"
          aria-label="Åbn chat"
        >
          <ChatBubbleOvalLeftEllipsisIcon className="w-7 h-7" />
        </button>
      )}

      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => {
              setOpen(false);
              setExpanded(false);
            }}
          />

          <div
            className={`fixed z-50 gaarsdal-chatbot flex flex-col ${
              expanded
                ? "inset-4 md:inset-10"
                : "bottom-24 right-6 w-96 max-w-[90vw] h-[70vh]"
            }`}
          >
            {/* HEADER */}
            <header className="flex justify-between items-center px-4 py-3">
              <div className="flex items-center gap-2">
                <img
                  src="/jan.gif"
                  alt="Gaarsdal"
                  width={24}
                  height={24}
                  className="rounded-full opacity-80"
                />
                <span className="font-medium">Gaarsdal</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="gaarsdal-icon-btn"
                >
                  <ArrowsPointingOutIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setOpen(false);
                    setExpanded(false);
                  }}
                  className="gaarsdal-icon-btn"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </header>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {!current.view && (
                <div className="message bot whitespace-pre-wrap">
                  {UI_WELCOME}
                </div>
              )}

              {current.view && (
                <>
                  <div className="message bot whitespace-pre-wrap">
                    {current.view.message}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {current.view.chips.map((chip) => (
                      <button
                        key={chip}
                        onClick={() => send({ chip })}
                        className="text-sm px-3 py-1 rounded-full border bg-white hover:bg-gray-100"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {loading && (
                <div className="text-sm opacity-60">Skriver…</div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* FOOTER */}
            <footer className="p-3 border-t">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send({ text: input });
                    setInput("");
                  }
                }}
                rows={2}
                className="w-full border rounded-md px-3 py-2 text-sm resize-none"
                placeholder="Skriv her…"
              />

              <div className="mt-3 flex gap-3">
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
                <button onClick={clearCurrentConversation}>
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </footer>
          </div>
        </>
      )}
    </>
  );
}
