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

  function sendInitialAssistantMessage() {
    setMessages([
      {
        role: "assistant",
        content:
          "Godt at se dig.\n\nDu er velkommen til at skrive frit om det, der fylder for dig. Hvis det er hjælpsomt, kan du også starte med et af de foreslåede valg herunder.",
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
          : "Jeg vil gerne hjælpe. Du er velkommen til at uddybe.";

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

  const showStartChips = userMessages.length === 0;

  function renderContextChips() {
    if (userMessages.length === 0) return null;

    const chips: { label: string; action: () => void }[] = [];

    if (
      lastUserMessage.includes("søvn") ||
      lastUserMessage.includes("sover")
    ) {
      chips.push({
        label: "Sammenhæng",
        action: () =>
          sendMessage(
            "Kan det hænge sammen med det, jeg allerede har nævnt?"
          ),
      });
    }

    if (
      lastUserMessage.includes("angst") ||
      lastUserMessage.includes("uro") ||
      lastUserMessage.includes("spændt")
    ) {
      chips.push({
        label: "Fortæl lidt mere",
        action: () => sendMessage("Jeg vil gerne uddybe"),
      });
    }

    chips.push({
      label: "Begrænsninger",
      action: () =>
        sendMessage(
          "Hvilke begrænsninger er der ved at bruge hypnoterapi i den her sammenhæng?"
        ),
    });

    chips.push({
      label: "Kontakt",
      action: () => sendMessage("Hvordan kontakter jeg jer?"),
    });

    return chips.map((chip, i) => (
      <Chip key={i} label={chip.label} onClick={chip.action} />
    ));
  }

  function resolveHeightClass() {
    if (userMessages.length <= 1) return "sm:h-[45vh]";
    if (userMessages.length <= 3) return "sm:h-[60vh]";
    return "sm:h-[75vh]";
  }

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          if (!hasOpened) {
            setHasOpened(true);
            sendInitialAssistantMessage();
          }
        }}
        className="fixed bottom-5 right-5 w-14 h-14 rounded-full bg-accent text-white shadow-lg flex items-center justify-center text-xl z-50"
        aria-label="Åbn chatbot"
      >
        💬
      </button>

      {open && (
        <div
          className={`
            fixed z-50 bg-white border border-gray-300 shadow-xl flex flex-col
            bottom-0 right-0 w-full h-full
            sm:bottom-24 sm:right-6 sm:w-[640px] ${resolveHeightClass()} sm:rounded-xl
          `}
        >
          <div className="px-4 py-3 border-b bg-gray-50 flex justify-between items-center">
            <div>
              <div className="text-sm font-medium">Velkommen</div>
              <div className="text-xs text-gray-600">Afklarende samtale</div>
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
