"use client";

import { useState } from "react";

type Role = "user" | "assistant";

type Message = {
  role: Role;
  content: string;
};

function extractReply(data: any): string {
  if (!data) return "Ingen respons.";
  if (typeof data === "string") return data;
  if (data.reply) return data.reply;
  if (data.message) return data.message;
  if (data.content) return data.content;
  if (data.text) return data.text;
  return "Ingen respons.";
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
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

      const assistantMessage: Message = {
        role: "assistant",
        content: extractReply(data)
      };

      setMessages([...nextMessages, assistantMessage]);
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
    <>
      {/* Chat icon */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-accent text-white shadow-lg flex items-center justify-center text-xl z-50"
        aria-label="Åbn chat"
      >
        💬
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 w-80 bg-white border border-gray-200 rounded-xl shadow-xl flex flex-col z-50">
          <div className="flex justify-between items-center px-4 py-3 border-b">
            <span className="text-sm font-medium">Chat</span>
            <button
              onClick={() => setOpen(false)}
              className="text-sm text-gray-500"
            >
              Luk
            </button>
          </div>

          <div className="flex-1 p-3 space-y-2 overflow-y-auto text-sm">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg ${
                  m.role === "user"
                    ? "bg-accent text-white ml-8"
                    : "bg-gray-100 mr-8"
                }`}
              >
                {m.content}
              </div>
            ))}
          </div>

          <div className="p-3 border-t flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Skriv..."
              className="flex-1 border border-gray-300 rounded-lg px-2 py-1 text-sm"
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="bg-accent text-white px-3 rounded-lg text-sm disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
