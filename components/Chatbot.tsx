"use client";

import { useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const nextMessages: Message[] = [
      ...messages,
      { role: "user", content: input }
    ];

    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages })
      });

      const data = await res.json();

      setMessages([
        ...nextMessages,
        { role: "assistant", content: data.reply ?? "Ingen respons." }
      ]);
    } catch {
      setMessages([
        ...nextMessages,
        { role: "assistant", content: "Der opstod en fejl." }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white">
      <div className="space-y-3 mb-4 max-h-[400px] overflow-y-auto">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`text-sm p-3 rounded-lg ${
              m.role === "user"
                ? "bg-accent text-white ml-8"
                : "bg-gray-100 text-text mr-8"
            }`}
          >
            {m.content}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Skriv dit spørgsmål…"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />

        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-accent text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
