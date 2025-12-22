// components/AIChat.tsx
import React, { useState, useEffect } from "react";

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

  // UI-only welcome message
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          text:
            "Hej — jeg er Gaarsdal Assistent. " +
            "Jeg kan hjælpe med en indledende afklaring af, " +
            "om hypnoterapi kan være relevant at overveje.",
        },
      ]);
    }
  }, [open, messages.length]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");

    // Add user message to UI
    setMessages((m) => [...m, { role: "user", text: userText }]);
    setLoading(true);

    try {
      const resp = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: userText }],
        }),
      });

      if (!resp.ok) {
        throw new Error("API error");
      }

      const data = await resp.json();

      setMessages((m) => [
        ...m,
        { role: "assistant", text: data.reply },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text:
            "Der opstod en teknisk fejl. " +
            "Prøv igen eller kontakt klinikken.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50 w-[420px] max-w-full bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 flex flex-col">
      {/* HEADER */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-100">
        <div>
          <div className="text-base font-semibold text-text">
            Gaarsdal Assistent
          </div>
          <div className="text-xs text-muted">
            Kort og rolig information
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-muted hover:text-text transition text-xl"
          aria-label="Luk chat"
        >
          ✕
        </button>
      </div>

      {/* MESSAGES */}
      <div
        className="flex-1 overflow-auto mb-3 pr-1 space-y-3"
        style={{ maxHeight: 300 }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`px-3 py-2 rounded-2xl max-w-[85%] text-sm leading-snug ${
              m.role === "assistant"
                ? "bg-gray-100 text-text self-start"
                : "bg-accent text-white self-end"
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>

      {/* INPUT */}
      <div className="mt-1">
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
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40"
          />

          <button
            onClick={sendMessage}
            disabled={loading}
            className="bg-accent text-white px-4 py-2 rounded-lg disabled:opacity-50 hover:bg-accent/90 transition"
          >
            {loading ? "…" : "Send"}
          </button>
        </div>

        <div className="text-xs text-muted mt-2">
          AI&apos;en giver kort og generel information.
        </div>
      </div>
    </div>
  );
}
