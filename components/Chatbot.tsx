import { useEffect, useRef, useState } from "react";
import {
  XMarkIcon,
  ArrowsPointingOutIcon,
  ChatBubbleOvalLeftEllipsisIcon,
} from "@heroicons/react/24/outline";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // DEBUG ER ALTID ON
  const debug = true;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim()) return;

    const nextMessages: Message[] = [
      ...messages,
      { role: "user", content: text },
    ];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      const data = await res.json();

      if (debug) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "— JAN (RAW) —\n" + data.jan_raw },
          { role: "assistant", content: "— EVALUATOR —\n" + data.evaluator },
          { role: "assistant", content: "— JAN (FINAL) —\n" + data.final },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.answer },
        ]);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-accent text-white shadow-lg flex items-center justify-center"
        >
          <ChatBubbleOvalLeftEllipsisIcon className="w-7 h-7" />
        </button>
      )}

      {/* OVERLAY */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => {
            setOpen(false);
            setExpanded(false);
          }}
        />
      )}

      {/* CHAT WINDOW */}
      {open && (
        <div
          className={`fixed z-50 flex flex-col bg-bg border border-gray-300 shadow-xl
          ${
            expanded
              ? "inset-6 rounded-xl"
              : "bottom-24 right-6 w-[420px] max-w-[90vw] rounded-xl"
          }`}
        >
          {/* HEADER */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-white rounded-t-xl">
            <span className="font-medium">
              Gaarsdal {debug && "(debug)"}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setExpanded((v) => !v)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ArrowsPointingOutIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  setExpanded(false);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* MESSAGES */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-bg">
            {messages.map((m, i) => {
              const isDebug =
                m.content.startsWith("— JAN") ||
                m.content.startsWith("— EVALUATOR");

              return (
                <div
                  key={i}
                  className={m.role === "user" ? "text-right" : "text-left"}
                >
                  <div
                    className={`inline-block px-4 py-3 rounded-lg text-sm whitespace-pre-wrap border
                      ${
                        isDebug
                          ? "bg-gray-100 border-dashed border-gray-400 text-gray-800"
                          : "bg-white border-gray-300"
                      }`}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="text-sm text-gray-500">Skriver…</div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT */}
          <div className="border-t bg-white p-3 rounded-b-xl">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              rows={2}
              className="w-full border rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring"
              placeholder="Skriv dit spørgsmål…"
            />
          </div>
        </div>
      )}
    </>
  );
}
