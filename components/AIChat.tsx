import React, { useState, useEffect, useRef } from "react";

type Message = {
  role: "user" | "assistant";
  text: string;
};

export default function AIChat({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const chatRef = useRef<HTMLDivElement | null>(null);

  // Scroll to TOP when assistant replies
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.role === "assistant" && chatRef.current) {
      chatRef.current.scrollTop = 0;
    }
  }, [messages]);

  // UI-only welcome message
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          text:
            "Hej — jeg er Gaarsdal Assistent.\n" +
            "Jeg kan hjælpe med en indledende afklaring af,\n" +
            "om hypnoterapi kan være relevant at overveje.",
        },
      ]);
    }
  }, [open, messages.length]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");

    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setLoading(true);

    const userHistory = messages
      .filter((m) => m.role === "user")
      .map((m) => ({ role: "user" as const, content: m.text }));

    try {
      const resp = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...userHistory, { role: "user", content: userText }],
        }),
      });

      const data = await resp.json();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Der opstod en teknisk fejl.\nPrøv igen senere.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50 w-[420px] max-w-full bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-100">
        <div>
          <div className="text-base font-semibold">Gaarsdal Assistent</div>
          <div className="text-xs text-muted">
            Indledende klinisk afklaring
          </div>
        </div>
        <button onClick={onClose} className="text-xl">✕</button>
      </div>

      {/* Messages */}
      <div
        ref={chatRef}
        className="flex-1 overflow-auto mb-3 pr-1 space-y-3"
        style={{ maxHeight: 300 }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`px-3 py-2 rounded-2xl max-w-[85%] text-sm whitespace-pre-wrap ${
              m.role === "assistant"
                ? "bg-gray-100 self-start"
                : "bg-accent text-white self-end"
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>

      {/* Input */}
      <div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Skriv dit spørgsmål…"
            className="flex-1 border rounded px-3 py-2"
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="bg-accent text-white px-4 py-2 rounded"
          >
            {loading ? "…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
