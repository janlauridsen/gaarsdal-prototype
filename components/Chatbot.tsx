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

type EngineResponse = {
  message?: string;
  actions?: { actionId: string; label: string }[];
};

type Message = {
  role: "user" | "assistant";
  content: string;
  actions?: EngineResponse["actions"];
};

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sessionIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  /** ✅ CLIENT-ONLY SESSION INIT */
  useEffect(() => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = Math.random().toString(36).slice(2);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /** INITIAL SYSTEM KICK */
  useEffect(() => {
    if (!open) return;
    if (messages.length > 0) return;
    send({ actionId: "home" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function send(params: { text?: string; actionId?: string }) {
    if (loading) return;
    if (!params.text && !params.actionId) return;
    if (!sessionIdRef.current) return;

    if (params.text) {
      setMessages(m => [...m, { role: "user", content: params.text! }]);
    }

    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          text: params.text ?? null,
          actionId: params.actionId ?? null,
        }),
      });

      const data: EngineResponse = await res.json();

      setMessages(m => [
        ...m,
        {
          role: "assistant",
          content: data.message ?? "",
          actions: data.actions,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          className="fixed bottom-6 right-6 gaarsdal-launcher"
          onClick={() => setOpen(true)}
        >
          <ChatBubbleOvalLeftEllipsisIcon className="w-7 h-7" />
        </button>
      )}

      {open && (
        <div
          className={`fixed gaarsdal-chatbot flex flex-col ${
            expanded
              ? "inset-4 md:inset-10"
              : "bottom-24 right-6 w-96 h-[70vh]"
          }`}
        >
          <header className="gaarsdal-chatbot-header flex justify-between items-center">
            <div className="flex items-center gap-2">
              <img src="/jan.gif" className="w-6 h-6 rounded-full" />
              <span>Gaarsdal</span>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setExpanded(v => !v)}>
                <ArrowsPointingOutIcon className="w-5 h-5" />
              </button>
              <button onClick={() => setOpen(false)}>
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </header>

          <div className="messages">
            {messages.map((m, i) => (
              <div key={i}>
                <div className={`message ${m.role}`}>{m.content}</div>
                {m.role === "assistant" &&
                  m.actions?.map(a => (
                    <button
                      key={a.actionId}
                      onClick={() => send({ actionId: a.actionId })}
                      className="text-xs px-3 py-1 rounded-full border bg-white mr-2 mt-2"
                    >
                      {a.label}
                    </button>
                  ))}
              </div>
            ))}
            {loading && <div className="text-sm opacity-60">Skriver…</div>}
            <div ref={messagesEndRef} />
          </div>

          <footer className="gaarsdal-chatbot-footer">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send({ text: input });
                }
              }}
              placeholder="Skriv her…"
            />

            <div className="flex justify-center gap-4 mt-3">
              <button onClick={() => send({ actionId: "home" })}><HomeIcon className="w-5 h-5" /></button>
              <button onClick={() => send({ actionId: "contact_mail" })}><EnvelopeIcon className="w-5 h-5" /></button>
              <button onClick={() => send({ actionId: "contact_phone" })}><PhoneIcon className="w-5 h-5" /></button>
              <button onClick={() => send({ actionId: "emergency" })}><ExclamationTriangleIcon className="w-5 h-5" /></button>
            </div>

            <div className="flex justify-center gap-4 mt-2">
              <button onClick={() => send({ actionId: "create_task" })}><PlusIcon className="w-5 h-5" /></button>
              <button onClick={() => send({ actionId: "switch_task" })}><BackwardIcon className="w-5 h-5" /></button>
              <button onClick={() => send({ actionId: "switch_task" })}><ForwardIcon className="w-5 h-5" /></button>
              <button onClick={() => send({ actionId: "close_task" })}><TrashIcon className="w-5 h-5" /></button>
            </div>
          </footer>
        </div>
      )}
    </>
  );
}
