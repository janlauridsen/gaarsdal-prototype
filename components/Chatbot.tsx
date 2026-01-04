import { useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const CHIPS = [
  "Hvad er hypnoterapi?",
  "Hvad kan I hjælpe med?",
  "Hvordan kontakter jeg jer?",
];

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const nextMessages: Message[] = [
      ...messages,
      { role: "user", content: text },
    ];

    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: nextMessages }),
    });

    const data = await res.json();

    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: data.answer || "Ingen respons." },
    ]);

    setLoading(false);
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gray-800 text-white flex items-center justify-center shadow-lg hover:bg-gray-700"
        aria-label="Åbn chatbot"
      >
        💬
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[90vw] bg-white border rounded-lg shadow-xl flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center px-4 py-2 border-b">
            <span className="font-medium">Gaarsdal Chat</span>
            <button
              onClick={() => setOpen(false)}
              className="text-sm text-gray-500 hover:text-gray-800"
            >
              Luk
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-sm text-gray-600">
                Stil et spørgsmål om Gaarsdal Hypnoterapi.
              </p>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={m.role === "user" ? "text-right" : "text-left"}
              >
                <div
                  className={
                    m.role === "user"
                      ? "inline-block bg-gray-200 px-3 py-2 rounded"
                      : "inline-block bg-gray-100 px-3 py-2 rounded"
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <p className="text-sm text-gray-500">Skriver…</p>
            )}
          </div>

          {/* Chips */}
          <div className="px-4 py-2 border-t flex flex-wrap gap-2">
            {CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => sendMessage(chip)}
                className="text-xs px-2 py-1 border rounded hover:bg-gray-100"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 border-t flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Skriv dit spørgsmål…"
              className="flex-1 border rounded px-3 py-2 text-sm"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading}
              className="px-3 py-2 border rounded bg-gray-800 text-white text-sm disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
