"use client";

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

type Conversation = {
  id: string;
  messages: Message[];
};

let conversationCounter = 0;
function createConversation(): Conversation {
  conversationCounter += 1;
  return { id: `conv_${conversationCounter}`, messages: [] };
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const [stack, setStack] = useState<Conversation[]>([
    createConversation(),
  ]);
  const [index, setIndex] = useState(0);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const current = stack[index];
  const hasMultiple = stack.length > 1;

  /* INIT SYSTEM MESSAGE */
  useEffect(() => {
    if (!open) return;
    if (current.messages.length > 0) return;

    setStack((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        messages: [
          {
            role: "assistant",
            content:
              "Velkommen. Vælg en mulighed herunder eller skriv frit.",
          },
        ],
      };
      return next;
    });
  }, [open]);

  /* SCROLL */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [current.messages, loading]);

  /* SEND */
  async function send(text: string) {
    if (!text || loading) return;

    setStack((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        messages: [
          ...next[index].messages,
          { role: "user", content: text },
        ],
      };
      return next;
    });

    setInput("");
    setLoading(true);

    setTimeout(() => {
      setStack((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          messages: [
            ...next[index].messages,
            { role: "assistant", content: "Modtaget." },
          ],
        };
        return next;
      });
      setLoading(false);
    }, 300);
  }

  /* STACK CONTROLS */
  function addConversation() {
    setStack((prev) => [...prev, createConversation()]);
    setIndex(stack.length);
  }

  function removeConversation() {
    if (!hasMultiple) return;

    setStack((prev) => prev.filter((_, i) => i !== index));
    setIndex((i) => Math.max(0, i - 1));
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
              <div className="flex items-center gap-2">
                <img
                  src="/jan.gif"
                  alt="Jan"
                  className="w-6 h-6 rounded-full"
                />
                <span className="font-medium text-sm">Gaarsdal</span>
              </div>

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
              {current.messages.map((m, i) => (
                <div
                  key={i}
                  className={`message ${
                    m.role === "user" ? "user" : "bot"
                  }`}
                >
                  {m.content}
                </div>
              ))}

              {loading && (
                <div className="text-sm opacity-60 mt-2">
                  Skriver…
                </div>
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

              {/* PRIMARY ICONS */}
              <div className="flex justify-center gap-4 mt-3">
                <HomeIcon className="w-5 h-5" />
                <EnvelopeIcon className="w-5 h-5" />
                <PhoneIcon className="w-5 h-5" />
                <ExclamationTriangleIcon className="w-5 h-5" />
              </div>

              {/* STACK CONTROLS */}
              <div className="flex justify-center gap-4 mt-3">
                <button
                  className="gaarsdal-icon-btn"
                  title="Ny samtale"
                  onClick={addConversation}
                >
                  <PlusIcon className="w-5 h-5" />
                </button>

                <button
                  className={
                    hasMultiple
                      ? "gaarsdal-icon-btn"
                      : "gaarsdal-icon-btn gaarsdal-icon-disabled"
                  }
                  title="Forrige"
                  onClick={() =>
                    hasMultiple &&
                    setIndex((i) => Math.max(0, i - 1))
                  }
                >
                  <BackwardIcon className="w-5 h-5" />
                </button>

                <button
                  className={
                    hasMultiple
                      ? "gaarsdal-icon-btn"
                      : "gaarsdal-icon-btn gaarsdal-icon-disabled"
                  }
                  title="Næste"
                  onClick={() =>
                    hasMultiple &&
                    setIndex((i) =>
                      Math.min(stack.length - 1, i + 1)
                    )
                  }
                >
                  <ForwardIcon className="w-5 h-5" />
                </button>

                <button
                  className={
                    hasMultiple
                      ? "gaarsdal-icon-btn"
                      : "gaarsdal-icon-btn gaarsdal-icon-disabled"
                  }
                  title="Slet"
                  onClick={removeConversation}
                >
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
