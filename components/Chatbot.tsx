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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  function sendAutoGreeting() {
    setMessages([
      {
        role: "assistant",
        content: "Godt at se dig. Du er velkommen til at skrive frit her.",
      },
    ]);
  }

  async function sendMessage(text?: string) {
    const messageText = text ?? input;
    if (!messageText.trim() || loading) return;

    const userMessage: Message = { role: "user", content: messageText };
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

  const userMessages = messages.filter((m) => m.role === "user");
  const lastUserMessage =
    userMessages.length > 0
      ? userMessages[userMessages.length - 1].content.toLowerCase()
      : "";

  // --- START-CHIPS ---
  const showStartChips = userMessages.length === 0;

  // --- KONTEKST-CHIPS ---
  function renderContextChips() {
    if (userMessages.length === 0) return null;

    if (
      lastUserMessage.includes("angst") ||
      lastUserMessage.includes("uro") ||
      lastUserMessage.includes("nervøs")
    ) {
      return (
        <>
          <Chip label="Fortæl lidt mere" onClick={() => sendMessage("Jeg vil gerne uddybe")} />
          <Chip label="Muligheder" onClick={() => sendMessage("Hvilke muligheder findes der?")} />
        </>
      );
    }

    if (
      lastUserMessage.includes("søvn") ||
      lastUserMessage.includes("sover")
    ) {
      return (
        <>
          <Chip label="Hvad kan påvirke søvn?" onClick={() => sendMessage("Hvad kan påvirke søvn?")} />
          <Chip label="Muligheder" onClick={() => sendMessage("Hvilke muligheder findes der?")} />
        </>
      );
    }

    if (
      lastUserMessage.includes("tak") ||
      lastUserMessage.includes("farvel")
    ) {
      return (
        <>
          <Chip label="Kontakt" onClick={() => sendMessage("Hvordan kontakter jeg jer?")} />
          <Chip label="Afslut" onClick={() => setOpen(false)} />
        </>
      );
    }

    return null;
  }

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          if (!hasOpened) {
            setHasOpened(true);
            sendAutoGreeting();
          }
        }}
        className="fixed bottom-5 right-5 w-14 h-14 rounded-full bg-accent text-white shadow-lg flex items-center justify-center text-xl z-50"
        aria-label="Åbn chatbot"
      >
        💬
      </button>

      {open && (
        <div
          className="
            fixed z-50 bg-white border border-gray-300 shadow-xl flex flex-col
            bottom-0 right-0 w-full h-full
            sm:bottom-24 sm:right-6 sm:w-[640px] sm:h-[70vh] sm:rounded-xl
          "
        >
          <div className="px-4 py-3 border-b bg-gray-50 flex justify-between items-center">
            <div>
              <div className="text-sm font-medium">Velkommen</div>
              <div className="text-xs text-gray-600">
                Godt at se dig – hvad kan jeg hjælpe med?
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Luk
            </button>
          </div>

          <div className="flex-1 p-4 space-y-4 overflow-y-auto text-sm">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border ${
                  m.role === "user"
                    ? "bg-accent text-white ml-10 sm:ml-20"
                    : "bg-gray-50 text-gray-900 mr-10 sm:mr-20"
                }`}
                style={{ whiteSpace: "pre-wrap" }}
              >
                {m.content}
              </div>
            ))}

            {showStartChips && (
              <div className="flex flex-wrap gap-2 pt-2">
                <Chip label="Overblik" onClick={() => sendMessage("Jeg vil gerne have overblik")} />
                <Chip label="Muligheder" onClick={() => sendMessage("Jeg vil forstå mine muligheder")} />
                <Chip label="Kontakt" onClick={() => sendMessage("Hvordan kontakter jeg jer?")} />
                <Chip label="Noget der fylder" onClick={() => sendMessage("Der er noget, der fylder for mig")} />
              </div>
            )}

            {!showStartChips && (
              <div className="flex flex-wrap gap-2 pt-2">
                {renderContextChips()}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              placeholder="Skriv her…"
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

function Chip({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-full border bg-white hover:bg-gray-50 text-sm"
    >
      {label}
    </button>
  );
}
