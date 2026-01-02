"use client";

import { useEffect, useRef, useState } from "react";

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

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll altid til bunden
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function sendAutoGreeting() {
    setMessages([
      {
        role: "assistant",
        content:
          "Velkommen.\n\nDu er velkommen til at skrive frit om det, der fylder for dig. Hvis det er hjælpsomt, kan du også starte med et af de foreslåede valg herunder.",
      },
    ]);
  }

  async function sendMessage(text?: string) {
    const messageText = text ?? input;
    if (!messageText.trim() || loading) return;

    const userMessage: Message = {
      role: "user",
      content: messageText,
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
          contextReplay: nextMessages
            .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
            .join("\n"),
        }),
      });

      const data = await res.json();

      const assistantContent =
        typeof data?.output === "string" && data.output.trim().length > 0
          ? data.output
          : "Jeg vil gerne hjælpe. Skriv gerne lidt mere om, hvad du har brug for.";

      setMessages([
        ...nextMessages,
        { role: "assistant", content: assistantContent },
      ]);
    } catch {
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: "Der opstod en teknisk fejl. Prøv igen om lidt.",
        },
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

  // Quick actions vises indtil første brugerbesked
  const showQuickActions =
    messages.filter((m) => m.role === "user").length === 0;

  return (
    <>
      {/* Chat-ikon */}
      <button
        onClick={() => {
          setOpen(true);
          if (!hasOpened) {
            setHasOpened(true);
            sendAutoGreeting();
          }
        }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-accent text-white shadow-lg flex items-center justify-center text-xl z-50"
        aria-label="Åbn chatbot"
      >
        💬
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 w-[640px] max-w-[95vw] h-[70vh] bg-white border border-gray-300 rounded-xl shadow-xl flex flex-col z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b bg-gray-50 flex justify-between items-center">
            <div>
              <div className="text-sm font-medium">Velkommen</div>
              <div className="text-xs text-gray-600">
                Afklarende samtale
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Luk
            </button>
          </div>

          {/* Beskeder */}
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

            {/* Quick actions */}
            {showQuickActions && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => sendMessage("Jeg vil gerne have overblik")}
                  className="px-3 py-2 rounded-full border bg-white hover:bg-gray-50 text-sm"
                >
                  Overblik
                </button>
                <button
                  onClick={() =>
                    sendMessage("Jeg vil forstå mine muligheder")
                  }
                  className="px-3 py-2 rounded-full border bg-white hover:bg-gray-50 text-sm"
                >
                  Muligheder
                </button>
                <button
                  onClick={() =>
                    sendMessage("Hvordan kontakter jeg jer?")
                  }
                  className="px-3 py-2 rounded-full border bg-white hover:bg-gray-50 text-sm"
                >
                  Kontakt
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
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
