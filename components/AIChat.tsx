import React, { useState, useEffect, useRef } from "react";

type Message = {
  role: "user" | "assistant";
  text: string;
};

type ChatState = "welcome" | "orienting" | "screening" | "closed";

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
  const [chatState, setChatState] = useState<ChatState>("welcome");

  const chatRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);

  /* ----------------------------------
     SMART SCROLL HANDLING
  ---------------------------------- */
  function handleScroll() {
    if (!chatRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = chatRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom < 80;
  }

  useEffect(() => {
    if (!chatRef.current) return;
    if (shouldAutoScrollRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  /* ----------------------------------
     WELCOME MESSAGE
  ---------------------------------- */
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          text:
            "Hej – jeg er Gaarsdal Assistent.\n" +
            "Jeg kan hjælpe med en kort, indledende afklaring af dine spørgsmål.",
        },
      ]);
      setChatState("orienting");
    }
  }, [open, messages.length]);

  /* ----------------------------------
     SEND MESSAGE
  ---------------------------------- */
  async function sendMessage() {
    if (!input.trim() || loading || chatState === "closed") return;

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
          state: chatState,
          messages: [...userHistory, { role: "user", content: userText }],
        }),
      });

      const data = await resp.json();
      const replyText: string = data.reply ?? "";

      // Tjek for v4.3-afslutning
      const isClosing = replyText
        .trim()
        .startsWith("Ud fra det, du har beskrevet, er det primært afklaret, at");

      setMessages((prev) => [...prev, { role: "assistant", text: replyText }]);

      if (isClosing) {
        setChatState("closed");
      } else if (chatState === "orienting") {
        setChatState("screening");
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Der opstod en teknisk fejl. Prøv igen senere.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50 w-[440px] max-w-[95vw] bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-100">
        <div>
          <div className="text-base font-semibold">Gaarsdal Assistent</div>
          <div className="text-xs text-muted">
            Indledende afklaring
          </div>
        </div>
        <button onClick={onClose} className="text-xl">✕</button>
      </div>

      {/* Messages */}
      <div
        ref={chatRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto mb-3 pr-1 space-y-3"
        style={{ maxHeight: 420 }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`px-3 py-2 rounded-2xl max-w-[85%] text-sm whitespace-pre-wrap ${
              m.role === "assistant"
                ? "bg-gray-100 self-start"
                : "bg-accent text-white self-end ml-auto"
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>

      {/* Input */}
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
          placeholder={
            chatState === "closed"
              ? "Screeningen er afsluttet"
              : "Skriv dit spørgsmål…"
          }
          disabled={chatState === "closed"}
          className="flex-1 border rounded px-3 py-2 disabled:bg-gray-100"
        />
        <button
          onClick={sendMessage}
          disabled={loading || chatState === "closed"}
          className="bg-accent text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}
