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
  value?: string;
  action?: () => void;
};

const START_CHIPS: Chip[] = [
  { id: "experience", label: "Noget der fylder", value: "Jeg oplever noget, der fylder" },
  { id: "overview", label: "Overblik", value: "Jeg vil gerne have overblik" },
  { id: "contact", label: "Kontakt", value: "Hvordan kontakter jeg jer?" },
];

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [hasStarted, setHasStarted] = useState(false);
  const [hasSummarized, setHasSummarized] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  function resetSession() {
    setMessages([]);
    setInput("");
    setLoading(false);
    setHasStarted(false);
    setHasSummarized(false);
  }

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    // Guard: gentagen opsummering
    if (hasSummarized && content.toLowerCase().includes("opsummer")) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Jeg har allerede samlet overblikket for denne samtale. Du kan starte en ny samtale, hvis du ønsker.",
        },
      ]);
      return;
    }

    if (!hasStarted) setHasStarted(true);

    const userMessage: Message = { role: "user", content };
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
          contextReplay: nextMessages
            .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
            .join("\n"),
        }),
      });

      const data = await res.json();
      const output = data?.output ?? "Jeg har ikke et klart svar på det.";

      if (content.toLowerCase().includes("opsummer")) {
        setHasSummarized(true);
      }

      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: output,
        },
      ]);
    } catch {
      setMessages([
        ...nextMessages,
        { role: "assistant", content: "Der opstod en fejl." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.ctrlKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function renderChips() {
    if (loading) return null;

    // Før start
    if (!hasStarted) {
      return (
        <div className="flex flex-wrap gap-2 px-4 pb-2">
          {START_CHIPS.map((chip) => (
            <button
              key={chip.id}
              onClick={() => sendMessage(chip.value)}
              className="text-xs px-3 py-1 rounded-full border border-gray-300 hover:bg-gray-100"
            >
              {chip.label}
            </button>
          ))}
        </div>
      );
    }

    // Efter opsummering
    if (hasSummarized) {
      return (
        <div className="flex flex-wrap gap-2 px-4 pb-2">
          <button
            onClick={resetSession}
            className="text-xs px-3 py-1 rounded-full border border-gray-300 hover:bg-gray-100"
          >
            Genstart
          </button>
        </div>
      );
    }

    // Undervejs
    return (
      <div className="flex flex-wrap gap-2 px-4 pb-2">
        <button
          onClick={() => sendMessage("Kan du opsummere samtalen?")}
          className="text-xs px-3 py-1 rounded-full border border-gray-300 hover:bg-gray-100"
        >
          Opsummer
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-accent text-white shadow-lg flex items-center justify-center text-xl z-50"
        aria-label="Åbn chatbot"
      >
        💬
      </button>

      {open && (
        <div
          className="fixed bottom-20 right-4 sm:right-6 w-[95vw] sm:w-[420px] bg-white border border-gray-300 rounded-xl shadow-xl flex flex-col z-50"
          style={{ height: hasStarted ? "65vh" : "50vh" }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Velkommen</div>
              <div className="text-xs text-gray-500">
                Du kan skrive frit – eller starte med et valg
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Luk
            </button>
          </div>

          {/* Prolog */}
          {!hasStarted && (
            <div className="px-4 py-3 text-sm text-gray-600 border-b">
              Du er velkommen til at beskrive med egne ord, hvad der fylder for dig.
              Valgene herunder er blot forslag.
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto text-sm">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border ${
                  m.role === "user"
                    ? "bg-accent text-white ml-12"
                    : "bg-gray-50 text-gray-900 mr-12"
                }`}
                style={{ whiteSpace: "pre-wrap" }}
              >
                {m.content}
              </div>
            ))}

            {loading && (
              <div className="p-3 rounded-lg border bg-gray-100 text-gray-500 mr-12 italic">
                Systemet arbejder …
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chips */}
          {renderChips()}

          {/* Input */}
          <div className="p-4 border-t flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              placeholder="Skriv her…"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
              disabled={loading || hasSummarized}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || hasSummarized}
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
