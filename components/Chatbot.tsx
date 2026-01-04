import { useEffect, useRef, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const CONTACT_TEXT = "Hvordan kontakter jeg jer?";
const ACUTE_HELP_TEXT =
  "Hvis du har brug for akut hjælp:\n\n" +
  "- Ring 112 ved akut fare\n" +
  "- Livslinien: 70 201 201 (døgnåben)\n" +
  "- Børne- og Ungetelefonen: 116 111\n\n" +
  "Jeg kan ikke hjælpe i akutte situationer.";

const FORBEHOLD_TEXT =
  "Her er en kort og nøgtern forklaring af de forbehold, der gælder for brug af hypnoterapi.";

const QUICK_CHIPS = [
  "Hvad er hypnoterapi?",
  "Hvad kan I hjælpe med?",
];

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForbehold, setShowForbehold] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function resetChat() {
    setMessages([]);
    setInput("");
    setLoading(false);
    setShowForbehold(false);
  }

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    setShowForbehold(false);

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
    const answer = data.answer || "Ingen respons.";

    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: answer },
    ]);

    if (answer.toLowerCase().includes("læs evt. om forbehold")) {
      setShowForbehold(true);
    }

    setLoading(false);
  }

  return (
    <>
      {/* Floating launcher */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full border flex items-center justify-center"
        aria-label="Åbn chat"
      >
        💬
      </button>

      {open && (
        <div
          className={`fixed bottom-24 right-6 border rounded-lg flex flex-col bg-white ${
            expanded ? "w-[90vw] h-[80vh]" : "w-96 max-w-[90vw]"
          }`}
        >
          {/* Header */}
          <div className="flex justify-between items-center px-4 py-2 border-b">
            <span className="font-medium">Gaarsdal</span>
            <div className="flex gap-3">
              <button onClick={() => setExpanded((v) => !v)}>
                {expanded ? "↙" : "↗"}
              </button>
              <button onClick={() => setOpen(false)}>✕</button>
            </div>
          </div>

          {/* Messages */}
          <div
            id="gaarsdal-chat-window"
            className="flex-1 overflow-y-auto p-4 space-y-3"
            style={{ maxHeight: expanded ? "100%" : "500px" }}
          >
            {messages.length === 0 && (
              <p className="text-sm">
                Stil et spørgsmål om Gaarsdal Hypnoterapi.
              </p>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`${
                  m.role === "user" ? "text-right" : "text-left"
                } animate-fadeIn`}
              >
                <div className="inline-block px-3 py-2 rounded border text-sm whitespace-pre-wrap">
                  {m.content}
                </div>
              </div>
            ))}

            {loading && <p className="text-sm">Skriver…</p>}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick chips */}
          <div className="px-4 py-2 border-t flex flex-wrap gap-2">
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => sendMessage(chip)}
                className="text-xs px-2 py-1 border rounded"
              >
                {chip}
              </button>
            ))}

            {showForbehold && (
              <button
                onClick={() => sendMessage(FORBEHOLD_TEXT)}
                className="text-xs px-2 py-1 border rounded"
              >
                Forbehold
              </button>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.ctrlKey && !e.metaKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              rows={2}
              className="w-full border rounded px-3 py-2 text-sm resize-none"
              placeholder="Skriv dit spørgsmål…"
            />

            {/* Icon bar */}
            <div className="mt-2 flex justify-between items-center text-sm">
              <div className="flex gap-4">
                <button title="Luk chat" onClick={() => setOpen(false)}>
                  🏠
                </button>
                <button title="Kontakt" onClick={() => sendMessage(CONTACT_TEXT)}>
                  ✉
                </button>
              </div>

              <div className="flex gap-4">
                <button
                  title="Akut hjælp"
                  onClick={() => sendMessage(ACUTE_HELP_TEXT)}
                >
                  ⚠
                </button>
                <button title="Nulstil samtale" onClick={resetChat}>
                  🗑
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
