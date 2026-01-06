import { useEffect, useRef, useState } from "react";
import {
  ChatBubbleOvalLeftEllipsisIcon,
  XMarkIcon,
  ArrowDownIcon,
} from "@heroicons/react/24/outline";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const [autoScroll, setAutoScroll] = useState(true);
  const [showJump, setShowJump] = useState(false);

  /* =========================
     SMART SCROLL DETECTION
     ========================= */

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      const distanceFromBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight;

      const nearBottom = distanceFromBottom < 120;

      setAutoScroll(nearBottom);
      setShowJump(!nearBottom);
    };

    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  /* =========================
     AUTO SCROLL ON NEW CONTENT
     ========================= */

  useEffect(() => {
    if (autoScroll) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, autoScroll]);

  /* =========================
     SEND MESSAGE
     ========================= */

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, { role: "user", content: text }] }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer ?? "" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     UI
     ========================= */

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-green-700 text-white shadow-lg flex items-center justify-center"
        >
          <ChatBubbleOvalLeftEllipsisIcon className="w-7 h-7" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-20 right-6 w-96 max-w-[90vw] h-[70vh] gaarsdal-chatbot flex flex-col z-50">
          {/* Header */}
          <header className="flex items-center justify-between px-4 py-3">
            <span className="font-medium">Gaarsdal</span>
            <button onClick={() => setOpen(false)}>
              <XMarkIcon className="w-6 h-6" />
            </button>
          </header>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="messages flex-1 overflow-y-auto px-4 py-3 space-y-3 relative"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`message ${m.role === "user" ? "user ml-auto" : "bot"} px-4 py-3 max-w-[85%]`}
              >
                {m.content}
              </div>
            ))}

            {loading && <div className="text-sm opacity-60">Skriver…</div>}

            <div ref={endRef} />
          </div>

          {/* Scroll-to-bottom hint */}
          {showJump && (
            <button
              onClick={() => {
                endRef.current?.scrollIntoView({ behavior: "smooth" });
                setAutoScroll(true);
              }}
              className="absolute bottom-24 right-4 bg-white border shadow rounded-full p-2"
              title="Scroll til nyeste"
            >
              <ArrowDownIcon className="w-5 h-5" />
            </button>
          )}

          {/* Input */}
          <footer className="p-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={2}
              placeholder="Skriv dit spørgsmål…"
              className="w-full resize-none rounded-md border px-3 py-2 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
            />
          </footer>
        </div>
      )}
    </>
  );
}
