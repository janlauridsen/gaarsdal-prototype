"use client";

import { useState } from "react";

type Role = "user" | "assistant";

type Message = {
  role: Role;
  content: string;
};

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendAutoGreeting() {
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: "Chatten er åbnet",
          contextReplay: "",
          mode: "PRODUCT",
        }),
      });

      const data = await res.json();

      setMessages([
        {
          role: "assistant",
          content:
            data?.output ||
            "Velkommen. Du kan skrive frit om det, du gerne vil have overblik over.",
        },
      ]);
    } catch {
      setMessages([
        {
          role: "assistant",
          content:
            "Velkommen. Du kan skrive frit om det, du gerne vil have overblik over.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: userMessage.content,
          contextReplay: messages
            .map((m) => `${m.role.toUpperCase()}:\n${m.content}`)
            .join("\n\n"),
          mode: "PRODUCT",
        }),
      });

      const data = await res.json();

      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: data?.output || "Ingen respons.",
        },
      ]);
    } catch {
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: "Der opstod en fejl.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Chat icon */}
      <button
        onClick={() => {
          setOpen(true);

          if (!hasOpened) {
            setHasOpened(true);
            sendAutoGreeting();
          }
        }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-accent text-white shadow-lg flex items-center justify-center z-50"
        aria-label="Åbn samtale"
      >
        Samtale
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 w-[640px] max-w-[95vw] h-[70vh] bg-white border border-gray-300 rounded-xl shadow-xl flex flex-col z-50">
          {/* HEADER */}
          <div className="flex justify-between items-center px-4 py-3 border-b">
            <div>
              <div className="text-sm font-medium">
                Velkommen 
              </div>
              <div className="text-xs text-gray-500">
               Godt at se dig - hvad kan jeg hjælpe med?
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-sm text-gray-500"
            >
              Luk
            </button>
          </div>

          {/* MESSAGES */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto text-sm">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border ${
                  m.role === "user"
                    ? "bg-accent text-white ml-20"
                    : "bg-gray-50 text-gray-900 mr-20"
                }`}
                style={{ whiteSpace: "pre-wrap" }}
              >
                {m.content}
              </div>
            ))}
          </div>

          {/* INPUT */}
          <div className="p-4 border-t flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={3}
              placeholder="Skriv her, hvad du gerne vil have overblik over…"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="bg-accent text-white px-4 rounded-lg text-sm disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
