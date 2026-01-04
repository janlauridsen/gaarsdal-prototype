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
    <div className="w-full max-w-2xl mx-auto border rounded-lg p-4">
      <div className="space-y-3 mb-4">
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

      <div className="flex flex-wrap gap-2 mb-4">
        {CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => sendMessage(chip)}
            className="text-sm px-3 py-1 border rounded hover:bg-gray-100"
          >
            {chip}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Skriv dit spørgsmål…"
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading}
          className="px-4 py-2 border rounded bg-gray-800 text-white disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
