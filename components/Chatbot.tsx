"use client";

// components/Chatbot.tsx

import { useEffect, useRef, useState } from "react";
import {
  ChatBubbleOvalLeftEllipsisIcon,
  XMarkIcon,
  PlusIcon,
  BackwardIcon,
  ForwardIcon,
  TrashIcon,
  HomeIcon,
  PhoneIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  ArrowsPointingOutIcon,
} from "@heroicons/react/24/outline";

type Message = {
  role: "user" | "assistant";
  content: string;
};

let sessionCounter = 0;

function createSessionId() {
  sessionCounter += 1;
  return `session_${sessionCounter}`;
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sessionIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  /* INIT */
  useEffect(() => {
    if (!open) return;
    if (sessionIdRef.current) return;

    sessionIdRef.current = createSessionId();

    setMessages([
      {
        role: "assistant",
        content: "Velkommen. Vælg en mulighed herunder eller skriv frit.",
      },
    ]);
  }, [open]);

  /* SCROLL */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    if (!text || loading) return;

    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    // Midlertidig echo – engine kobles på senere
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Modtaget." },
      ]);
      setLoading(false);
    }, 400);
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          className="fixed bottom-6 right-6 w-14 h-14 gaarsdal-launcher flex items-center justify-center"
          onClick={() => setOpen(true)}
        >
          <ChatBubbleOvalLeftEllipsisIcon className="w-7 h-7" />
        </button>
      )}

      {open && (
        <>
          <div
            className="gaarsdal-overlay"
            onClick={() => {
              setOpen(false);
              setExpanded(false);
            }}
          />

          <div
            className={`gaarsdal-chatbot fixed flex flex-col ${
              expanded
                ? "inset-4 md:inset-10"
                : "bottom-24 right-6 w-96 max-w-[90vw] h-[70vh]"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <header className="gaarsdal-chatbot-header flex justify-between items-center">
              <span className="font-medium text-sm">Gaarsdal</span>

              <div className="flex gap-2">
                <button
                  className="gaarsdal-icon-btn"
                  onClick={() => setExpanded((v) => !v)}
                >
                  <ArrowsPointingOutIcon className="w-5 h-5" />
                </button>
                <button
                  className="gaarsdal-icon-btn"
                  onClick={() => setOpen(false)}
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </header>

            {/* MESSAGES */}
            <div className="messages">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`message ${m.role === "user" ? "user" : "bot"}`}
                >
                  {m.content}
                </div>
              ))}

              {loading && (
                <div className="text-sm opacity-60 mt-2">Skriver…</div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* FOOTER */}
            <footer className="gaarsdal-chatbot-footer">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder="Skriv frit her…"
              />

              <div className="flex justify-center gap-4 mt-3">
                <HomeIcon className="w-5 h-5" />
                <EnvelopeIcon className="w-5 h-5" />
                <PhoneIcon className="w-5 h-5" />
                <ExclamationTriangleIcon className="w-5 h-5" />
              </div>

              <div className="flex justify-center gap-4 mt-2">
                <PlusIcon className="w-5 h-5 opacity-40" />
                <BackwardIcon className="w-5 h-5 opacity-40" />
                <ForwardIcon className="w-5 h-5 opacity-40" />
                <TrashIcon className="w-5 h-5 opacity-40" />
              </div>
            </footer>
          </div>
        </>
      )}
    </>
  );
}
