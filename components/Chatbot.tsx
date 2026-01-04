import { useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const DUMMY_RESPONSE =
  "Dette er en foreløbig demo-version af chatbotten. Funktionalitet til svar er endnu ikke aktiveret.";

const DUMMY_CHIPS = [
  "Hvad er hypnoterapi?",
  "Hvad kan I hjælpe med?",
  "Hvordan kontakter jeg jer?",
];

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  function sendMessage(text: string) {
    if (!text.trim()) return;

    const userMessage: Message = { role: "user", content: text };

    const assistantMessage: Message = {
      role: "assistant",
      content: DUMMY_RESPONSE,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");
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
            className={
              m.role === "user"
                ? "text-right"
                : "text-left text-gray-800"
            }
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
      </div>

      {/* Dummy chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {DUMMY_CHIPS.map((chip) => (
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
          className="px-4 py-2 border rounded bg-gray-800 text-white"
        >
          Send
        </button>
      </div>
    </div>
  );
}
