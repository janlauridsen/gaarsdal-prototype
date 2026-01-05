import { useEffect, useRef, useState } from "react";
import {
  ChatBubbleOvalLeftEllipsisIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

type Message = {
  role: "user" | "assistant";
  content: string;
  debug?: boolean;
};

const DEBUG = true;

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

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

      if (DEBUG && data.jan_raw && data.evaluator && data.final) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "— JAN (RAW) —\n" + data.jan_raw,
            debug: true,
          },
          {
            role: "assistant",
            content: "— EVALUATOR —\n" + data.evaluator,
            debug: true,
          },
          {
            role: "assistant",
            content: "— JAN (FINAL) —\n" + data.final,
            debug: true,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.answer ?? "",
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-accent text-white shadow flex items-center justify-center"
        >
          <ChatBubbleOvalLeftEllipsisIcon className="w-7 h-7" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[90vw] h-[70vh] bg-bg border border-gray-300 rounded-xl shadow flex flex-col z-50">
          {/* Header */}
          <div className="flex justify-between items-center px-4 py-3 border-b bg-white">
            <span className="font-medium">
              Gaarsdal {DEBUG && <span className="text-xs text-gray-400">(debug)</span>}
            </span>
            <button onClick={() => setOpen(false)} className="p-1">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => {
              const base =
                "whitespace-pre-wrap border rounded-lg px-3 py-2 leading-relaxed";
              const normal = "bg-white text-sm";
              const debugStyle =
                "bg-gray-100 border-dashed text-gray-700 text-xs font-mono";

              return (
                <div
                  key={i}
                  className={m.role === "user" ? "text-right" : "text-left"}
                >
                  <div
                    className={`${base} ${
                      m.debug ? debugStyle : normal
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })}

            {loading && <p className="text-sm text-gray-500">Skriver…</p>}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t bg-white p-3">
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
              className="w-full border rounded-md px-3 py-2 text-sm resize-none"
              placeholder="Skriv dit spørgsmål…"
            />
          </div>
        </div>
      )}
    </>
  );
}
