import { useEffect, useRef, useState } from "react";
import {
  ChatBubbleOvalLeftEllipsisIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const debug = true; // ALTID ON I TESTFORLØB

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMessage: Message = {
      role: "user",
      content: text,
    };

    const nextMessages: Message[] = [...messages, userMessage];
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
        const assistantMessages: Message[] = [
          {
            role: "assistant",
            content: "— JAN (RAW) —\n" + data.jan_raw,
          },
          {
            role: "assistant",
            content: "— EVALUATOR —\n" + data.evaluator,
          },
          {
            role: "assistant",
            content: "— JAN (FINAL) —\n" + data.final,
          },
        ];

        setMessages((prev) => [...prev, ...assistantMessages]);
      } else {
        const finalMessage: Message = {
          role: "assistant",
          content: data.final,
        };
        setMessages((prev) => [...prev, finalMessage]);
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
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-green-700 text-white shadow flex items-center justify-center"
        >
          <ChatBubbleOvalLeftEllipsisIcon className="w-7 h-7" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[90vw] h-[70vh] bg-[#F6F5F2] border rounded-xl flex flex-col shadow-lg">
          <div className="flex justify-between items-center px-4 py-3 border-b bg-white">
            <span className="font-medium">Gaarsdal (debug)</span>
            <button onClick={() => setOpen(false)}>
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`whitespace-pre-wrap ${
                  m.role === "user" ? "text-right" : "text-left"
                }`}
              >
                <div className="inline-block bg-white border rounded-lg px-3 py-2">
                  {m.content}
                </div>
              </div>
            ))}
            {loading && <div>Skriver…</div>}
            <div ref={endRef} />
          </div>

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
              placeholder="Skriv…"
            />
          </div>
        </div>
      )}
    </>
  );
}
