// components/AIChat.tsx
import React, { useState, useRef, useEffect } from "react";

type Message = { role: "user" | "assistant"; text: string };

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
  const endRef = useRef<HTMLDivElement | null>(null);

  // Scroll to TOP of the new message (Patch 6.4)
  const scrollToTopOfLast = () => {
    const container = document.getElementById("gaarsdal-chat-window");
    if (!container) return;
    container.scrollTop = container.scrollHeight - container.clientHeight - 9999;
    setTimeout(() => {
      container.scrollTop = 0;
    }, 10);
  };

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          text: "Hej — jeg er Gaarsdal Assistent. Du kan stille spørgsmål om hypnoterapi, hvis du har lyst.",
        },
      ]);
    }
  }, [open]);

  useEffect(() => {
    scrollToTopOfLast();
  }, [messages]);

  async function sendMessage() {
    if (!input.trim()) return;

    const userText = input.trim();
    setInput("");

    // Add user message
    setMessages((m) => [...m, { role: "user", text: userText }]);

    // Add placeholder AI bubble
    setMessages((m) => [...m, { role: "assistant", text: "" }]);
    setLoading(true);

    const resp = await fetch("/api/ai-stream", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: userText }],
      }),
    });

    if (!resp.body) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Der opstod en fejl med forbindelsen." },
      ]);
      setLoading(false);
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

      // Live update last assistant message
      setMessages((m) => {
        const updated = [...m];
        updated[updated.length - 1] = { role: "assistant", text: aiText };
        return updated;
      });
    }

    setLoading(false);
  }

  if (!open) return null;

  return (
    <div
      className="
      fixed bottom-24 right-6 z-50 
      w-[420px] max-w-full
      bg-white rounded-2xl shadow-2xl border border-gray-200
      p-4 flex flex-col
    "
    >
      {/* HEADER */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-100">
        <div>
          <div className="text-base font-semibold text-text">Gaarsdal Assistent</div>
          <div className="text-xs text-muted">Kort og rolig information</div>
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
        id="gaarsdal-chat-window"
        className="flex-1 overflow-auto mb-3 pr-1 space-y-3"
        style={{ maxHeight: 300 }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`
              px-3 py-2 rounded-2xl max-w-[85%] text-sm leading-snug
              ${m.role === "assistant"
                ? "bg-gray-100 text-text self-start"
                : "bg-accent text-white self-end"
              }
            `}
          >
            <div dangerouslySetInnerHTML={{ __html: m.text }} />
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* INPUT */}
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
              focus:outline-none focus:ring-2 focus:ring-accent/40
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
          AI'en giver kort og generel information.
        </div>
      </div>
    </div>
  );
}
