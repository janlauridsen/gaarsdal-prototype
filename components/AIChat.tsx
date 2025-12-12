// components/AIChat.tsx
import React, { useState, useRef, useEffect } from "react";

type Message = { role: "user" | "assistant"; text: string };

export default function AIChat({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false); // PATCH 5
  const endRef = useRef<HTMLDivElement | null>(null);

  // Start med en venlig besked
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          text: "Hej — jeg er Gaarsdal Assistent. Hvordan kan jeg hjælpe dig i dag?",
        },
      ]);
    }
  }, [open]);

  // Automatisk scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, typing]);

  // Streaming message handler
  async function sendMessage() {
    if (!input.trim()) return;

    const userText = input.trim();
    setInput("");

    // Tilføj brugerbesked
    setMessages((m) => [...m, { role: "user", text: userText }]);

    // Tilføj tom AI-boble
    setMessages((m) => [...m, { role: "assistant", text: "" }]);

    setLoading(true);
    setTyping(true); // PATCH 5

    const resp = await fetch("/api/ai-stream", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: userText }],
      }),
    });

    if (!resp.body) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: "Beklager — der opstod en fejl under streaming.",
        },
      ]);
      setLoading(false);
      setTyping(false); // PATCH 5
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let aiText = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      aiText += chunk;

      // Live opdatering af sidste AI-besked
      setMessages((m) => {
        const updated = [...m];
        updated[updated.length - 1] = {
          role: "assistant",
          text: aiText,
        };
        return updated;
      });
    }

    setLoading(false);
    setTyping(false); // PATCH 5
  }

  if (!open) return null;

  return (
    <div
      className="
      fixed bottom-24 right-6 z-50 w-96 max-w-full
      bg-white rounded-2xl shadow-2xl border border-gray-200
      p-4 flex flex-col transition-all
    "
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-100">
        <div>
          <div className="text-base font-semibold text-text">Gaarsdal Assistent</div>
          <div className="text-xs text-muted">Svar om hypnoterapi</div>
        </div>
        <button
          onClick={onClose}
          className="text-muted hover:text-text transition"
          aria-label="Luk chat"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto mb-4 space-y-3 pr-1" style={{ maxHeight: 340 }}>
        {messages.map((m, i) => (
          <div
            key={i}
            className={`
              px-3 py-2 rounded-xl max-w-[80%]
              animate-fadeIn
              ${
                m.role === "assistant"
                  ? "bg-gray-100 text-text self-start"
                  : "bg-accent text-white self-end"
              }
            `}
          >
            <div
              className="text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: m.text }}
            />
          </div>
        ))}

        {/* Typing indicator */}
        {typing && (
          <div
            className="
              px-3 py-2 rounded-xl bg-gray-100 text-text text-sm 
              self-start animate-pulse max-w-[60%]
            "
          >
            Assistenten skriver…
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="mt-1">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Skriv dit spørgsmål…"
            className="
              flex-1 border border-gray-300 rounded-lg px-3 py-2
              focus:outline-none focus:ring-2 focus:ring-accent/50
            "
          />

          <button
            onClick={sendMessage}
            disabled={loading}
            className="
              bg-accent text-white px-4 py-2 rounded-lg 
              disabled:opacity-50 hover:bg-accent/90 transition
            "
          >
            {loading ? "…" : "Send"}
          </button>
        </div>

        <div className="text-xs text-muted mt-2">
          AI'en giver generel information — ikke behandling.
        </div>
      </div>
    </div>
  );
}
