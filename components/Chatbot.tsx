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

const MAX_STACK = 5;

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

  const canGoBack = index > 0;
  const canGoForward = index < stack.length - 1;
  const canDelete = stack.length > 1;
  const canAdd = stack.length < MAX_STACK;

  /* INIT SYSTEM MESSAGE */
  useEffect(() => {
    if (!open) return;
    if (current.messages.length > 0) return;

    appendSystem(
      "Velkommen. Vælg en mulighed herunder eller skriv frit."
    );
  }, [open]);

  function appendSystem(text: string) {
    setStack((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        messages: [
          ...next[index].messages,
          { role: "assistant", content: text },
        ],
      };
      return next;
    });
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [current.messages, loading]);

  function send(text: string) {
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
      appendSystem("Modtaget.");
      setLoading(false);
    }, 300);
  }

  function addConversation() {
    if (!canAdd) return;

    setStack((prev) => [...prev, createConversation()]);
    setIndex(stack.length);
  }

  function removeConversation() {
    if (!canDelete) return;

    setStack((prev) => prev.filter((_, i) => i !== index));
    setIndex((i) => Math.max(0, i - 1));
  }

  function primaryAction(label: string) {
    console.log("PRIMARY_ACTION:", label);
    appendSystem(`Handling valgt: ${label}`);
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
                  title="Udvid"
                  onClick={() => setExpanded((v) => !v)}
                >
                  <ArrowsPointingOutIcon className="w-5 h-5" />
                </button>
                <button
                  className="gaarsdal-icon-btn"
                  title="Luk"
                  onClick={() => setOpen(false)}
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </header>

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
                <button
                  className="gaarsdal-icon-btn"
                  title="Forside"
                  onClick={() => primaryAction("Forside")}
                >
                  <HomeIcon className="w-5 h-5" />
                </button>
                <button
                  className="gaarsdal-icon-btn"
                  title="Email"
                  onClick={() => primaryAction("Email")}
                >
                  <EnvelopeIcon className="w-5 h-5" />
                </button>
                <button
                  className="gaarsdal-icon-btn"
                  title="Telefon"
                  onClick={() => primaryAction("Telefon")}
                >
                  <PhoneIcon className="w-5 h-5" />
                </button>
                <button
                  className="gaarsdal-icon-btn"
                  title="Akut"
                  onClick={() => primaryAction("Akut")}
                >
                  <ExclamationTriangleIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="gaarsdal-stack-dots">
                {stack.map((_, i) => (
                  <div
                    key={i}
                    className={`gaarsdal-stack-dot ${
                      i === index ? "active" : ""
                    }`}
                  />
                ))}
              </div>

              <div className="flex justify-center gap-4">
                <button
                  className={
                    canAdd
                      ? "gaarsdal-icon-btn"
                      : "gaarsdal-icon-btn gaarsdal-icon-disabled"
                  }
                  title="Ny samtale"
                  onClick={addConversation}
                >
                  <PlusIcon className="w-5 h-5" />
                </button>

                <button
                  className={
                    canGoBack
                      ? "gaarsdal-icon-btn"
                      : "gaarsdal-icon-btn gaarsdal-icon-disabled"
                  }
                  title="Forrige"
                  onClick={() => canGoBack && setIndex(index - 1)}
                >
                  <BackwardIcon className="w-5 h-5" />
                </button>

                <button
                  className={
                    canGoForward
                      ? "gaarsdal-icon-btn"
                      : "gaarsdal-icon-btn gaarsdal-icon-disabled"
                  }
                  title="Næste"
                  onClick={() => canGoForward && setIndex(index + 1)}
                >
                  <ForwardIcon className="w-5 h-5" />
                </button>

                <button
                  className={
                    canDelete
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
