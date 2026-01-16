// components/Chatbot.tsx

import { useEffect, useRef, useState } from "react";
import {
  ChatBubbleOvalLeftEllipsisIcon,
  XMarkIcon,
  PlusIcon,
  BackwardIcon,
  ForwardIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

type EngineOutput = {
  output?: {
    type: "summary";
    payload: {
      purpose: string;
      data: Record<string, unknown>;
    };
  };
  message?: string;
  actions?: Array<{
    actionId: string;
    label: string;
  }>;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  actions?: EngineOutput["actions"];
};

type Conversation = {
  id: string;
  messages: Message[];
};

const MAX_SESSIONS = 5;

function createConversation(): Conversation {
  return {
    id: crypto.randomUUID(),
    messages: [],
  };
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [stack, setStack] = useState<Conversation[]>([
    createConversation(),
  ]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const current = stack[index];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [current.messages, loading]);

  async function send(params: { text?: string; actionId?: string }) {
    if (loading) return;
    if (!params.text && !params.actionId) return;

    if (params.text) {
      setStack((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          messages: [
            ...next[index].messages,
            { role: "user", content: params.text },
          ],
        };
        return next;
      });
    }

    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: current.id,
          text: params.text ?? null,
          actionId: params.actionId ?? null,
        }),
      });

      const data: EngineOutput = await res.json();

      setStack((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          messages: [
            ...next[index].messages,
            {
              role: "assistant",
              content:
                data.output?.payload.purpose ??
                data.message ??
                "",
              actions: data.actions,
            },
          ],
        };
        return next;
      });
    } finally {
      setLoading(false);
    }
  }

  function addConversation() {
    if (stack.length >= MAX_SESSIONS) return;
    setStack((prev) => [...prev, createConversation()]);
    setIndex(stack.length);
  }

  function removeConversation() {
    if (stack.length === 1) return;
    setStack((prev) => prev.filter((_, i) => i !== index));
    setIndex((i) => Math.max(0, i - 1));
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
        <div className="fixed bottom-24 right-6 w-96 h-[70vh] gaarsdal-chatbot">
          <header className="gaarsdal-chatbot-header flex justify-between">
            <span>Gaarsdal</span>
            <button onClick={() => setOpen(false)}>
              <XMarkIcon className="w-5 h-5" />
            </button>
          </header>

          <div className="messages">
            {current.messages.map((m, i) => (
              <div key={i}>
                <div className={`message ${m.role}`}>
                  {m.content}
                </div>

                {m.role === "assistant" &&
                  m.actions?.map((a) => (
                    <button
                      key={a.actionId}
                      onClick={() =>
                        send({ actionId: a.actionId })
                      }
                      className="text-xs px-3 py-1 rounded-full border bg-white mr-2 mt-2"
                    >
                      {a.label}
                    </button>
                  ))}
              </div>
            ))}

            {loading && (
              <div className="text-sm opacity-60">
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
                  send({ text: input });
                }
              }}
              placeholder="Skriv her…"
            />

            <div className="flex justify-center gap-4 mt-3">
              <button onClick={addConversation}>
                <PlusIcon className="w-5 h-5" />
              </button>
              <button onClick={() => setIndex((i) => Math.max(0, i - 1))}>
                <BackwardIcon className="w-5 h-5" />
              </button>
              <button onClick={() => setIndex((i) => Math.min(stack.length - 1, i + 1))}>
                <ForwardIcon className="w-5 h-5" />
              </button>
              <button onClick={removeConversation}>
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </footer>
        </div>
      )}
    </>
  );
}
