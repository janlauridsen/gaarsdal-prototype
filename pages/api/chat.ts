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
  { id: "questions", label: "Spørgsmål", value: "Jeg har spørgsmål om hypnoterapi" },
  { id: "experience", label: "Noget der fylder", value: "Jeg oplever noget, der fylder" },
  { id: "contact", label: "Kontakt", value: "Hvordan kontakter jeg jer?" },
];

const END_CHIPS: Chip[] = [
  { id: "summary", label: "Opsummer", value: "Kan du opsummere samtalen?" },
  { id: "reset", label: "Genstart", value: "__RESET__" },
];

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const userTurns = messages.filter((m) => m.role === "user").length;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  function resetSession() {
    setMessages([]);
    setInput("");
    setLoading(false);
  }

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    if (content === "__RESET__") {
      resetSession();
      return;
    }

    const userMessage: Message = {
      role: "user",
      content,
    };

    const nextMessages: Message[] = [...messages, userMessage];
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

      const assistantMessage: Message = {
        role: "assistant",
        content: data?.output ?? "Jeg har ikke et klart svar på det.",
      };

      setMessages([...nextMessages, assistantMessage]);
    } catch {
      const errorMessage: Message = {
        role: "assistant",
        content: "Der opstod en fejl.",
      };
      setMessages([...nextMessages, errorMessage]);
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
    const chips = userTurns < 1 ? START_CHIPS : END_CHIPS;

    return (
      <div className="flex flex-wrap gap-2 px-4 pb-2">
        {chips.map((chip) => (
          <button
            key={chip.id}
            onClick={() => sendMessage(chip.value)}
            disabled={loading}
            className="text-xs px-3 py-1 rounded-full border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
          >
            {chip.label}
          </button>
        ))}
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
        <div className="fixed bottom-20 right-4 sm:right-6 w-[95vw] sm:w-[420px] h-[70vh] bg-white border border-gray-300 rounded-xl shadow-xl flex flex-col z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Godt at se dig</div>
              <div className="text-xs text-gray-500">
                Du kan skrive frit eller vælge herunder
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Luk
            </button>
          </div>

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
              <div className="text-xs text-gray-400">Svarer …</div>
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
              placeholder="Skriv her… (Enter = send, Ctrl+Enter = ny linje)"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
            />
            <button
              onClick={() => sendMessage()}
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
