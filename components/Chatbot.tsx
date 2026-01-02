"use client";

import { useEffect, useRef, useState } from "react";

type Role = "user" | "assistant";

type Message = {
  role: Role;
  content: string;
};

type Chip = {
  id: string;
  label: string;
  value: string;
};

const START_CHIPS: Chip[] = [
  { id: "overview", label: "Overblik", value: "Jeg vil gerne have overblik" },
  { id: "experience", label: "Noget fylder", value: "Jeg oplever noget, der fylder" },
  { id: "contact", label: "Kontakt", value: "Hvordan kontakter jeg jer?" },
];

const REFLECT_CHIPS: Chip[] = [
  { id: "summary", label: "Saml trådene", value: "Kan du samle trådene indtil nu?" },
  { id: "reset", label: "Genstart", value: "__RESET__" },
];

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function resetSession() {
    setMessages([]);
    setInput("");
  }

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    if (content === "__RESET__") {
      resetSession();
      return;
    }

    const nextMessages = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: content,
          contextReplay: nextMessages
            .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
            .join("\n"),
        }),
      });

      const data = await res.json();

      setMessages([
        ...nextMessages,
        { role: "assistant", content: data?.output ?? "—" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-accent text-white shadow-lg z-50"
      >
        💬
      </button>

      {open && (
        <div className="fixed bottom-20 right-4 w-[95vw] max-w-[420px] h-[65vh] bg-white border rounded-xl shadow-xl flex flex-col z-50">
          <div className="px-4 py-3 border-b flex justify-between">
            <div>
              <div className="text-sm font-medium">Velkommen</div>
              <div className="text-xs text-gray-500">
                Skriv frit eller brug forslagene
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-sm">Luk</button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-sm">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg ${
                  m.role === "user"
                    ? "bg-accent text-white ml-10"
                    : "bg-gray-100 mr-10"
                }`}
                style={{ whiteSpace: "pre-wrap" }}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="text-xs text-gray-400">Systemet arbejder…</div>
            )}
            <div ref={endRef} />
          </div>

          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {(messages.length === 0 ? START_CHIPS : REFLECT_CHIPS).map((c) => (
              <button
                key={c.id}
                onClick={() => sendMessage(c.value)}
                className="text-xs px-3 py-1 border rounded-full"
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="p-3 border-t flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.ctrlKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Skriv her…"
              rows={2}
              className="flex-1 border rounded px-2 py-1 text-sm"
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading}
              className="bg-accent text-white px-3 rounded text-sm"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
