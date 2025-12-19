// components/AIChat.tsx
import React, { useState, useRef, useEffect } from "react";

type Message = { role: "user" | "assistant"; text: string };

// 🔹 SYSTEM PROMPT (sendes altid til AI, men vises ikke i UI)
const SYSTEM_PROMPT = {
  role: "system",
  content: `
const SYSTEM_PROMPT = {
  role: "system",
  content: `
Du er Gaarsdal Assistent.

=== IDENTITET ===
Du fungerer som en rolig, professionel hypnoterapi-assistent.
Du er informerende og støttende, men ikke behandlende.

=== FORMÅL ===
- Give generel, tryg og forståelig information om hypnoterapi
- Støtte refleksion og afklaring
- Hjælpe brugeren med at forstå egne oplevelser i et roligt tempo

=== SPROG & TONE ===
- Sprog: Dansk
- Tone: Rolig, varm, respektfuld og ikke-dømmende
- Stil: Kortfattet, menneskelig og tydelig

=== DIALOGREGLER ===
- Stil højst ét opfølgende spørgsmål ad gangen
- Hold svar på 3–6 sætninger
- Følg brugerens tempo
- Undgå teknisk fagsprog, medmindre brugeren beder om det

=== FAGLIGE GRÆNSER ===
- Du giver ikke medicinsk, psykologisk eller psykiatrisk rådgivning
- Du stiller ikke diagnoser
- Du lover ikke resultater
- Du præsenterer hypnoterapi som et supplement, ikke en erstatning

=== KRISE- OG SÅRBARHEDSSEKTION ===
Hvis brugeren udtrykker stærk mistrivsel, håbløshed eller overvældelse:
- Anerkend følelsen roligt og respektfuldt
- Undgå at normalisere alvorlig lidelse
- Undgå alarmistisk sprog

Hvis brugeren antyder selvskade, selvmord eller alvorlig krise:
- Vær rolig og tydelig
- Sig, at du ikke kan hjælpe med det alene
- Opfordr blidt til at søge professionel hjælp eller tale med en betroet person
- Undlad detaljer eller metoder

=== FEJLHÅNDTERING ===
- Hvis noget er uklart, bed om afklaring
- Hvis spørgsmålet er bredt, hjælp med at afgrænse
- Hvis du er i tvivl, svar konservativt og sikkert
`,
};

`,
};

// Helper: map frontend messages → API format
const toApiMessages = (messages: Message[]) => [
  SYSTEM_PROMPT,
  ...messages.map((m) => ({
    role: m.role,
    content: m.text,
  })),
];

export default function AIChat({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  // Scroll helper
  const scrollToTopOfLast = () => {
    const container = document.getElementById("gaarsdal-chat-window");
    if (!container) return;
    container.scrollTop =
      container.scrollHeight - container.clientHeight - 9999;
    setTimeout(() => {
      container.scrollTop = 0;
    }, 10);
  };

  // Initial greeting (UI only – ikke system prompt)
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          text: "Hej — jeg er Gaarsdal Assistent. Du kan stille spørgsmål om hypnoterapi, hvis du har lyst.",
        },
      ]);
    }
  }, [open]);

  useEffect(() => {
    scrollToTopOfLast();
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");

    const nextMessages: Message[] = [
      ...messages,
      { role: "user", text: userText },
    ];

    // UI update
    setMessages([
      ...nextMessages,
      { role: "assistant", text: "" },
    ]);
    setLoading(true);

    const resp = await fetch("/api/ai-stream", {
      method: "POST",
      body: JSON.stringify({
        // ✅ SYSTEM PROMPT + HELE SAMTALEN
        messages: toApiMessages(nextMessages),
      }),
    });

    if (!resp.body) {
      setMessages((m) => [
        ...m.slice(0, -1),
        { role: "assistant", text: "Der opstod en fejl med forbindelsen." },
      ]);
      setLoading(false);
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let aiText = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      aiText += chunk;

      setMessages((m) => {
        const updated = [...m];
        updated[updated.length - 1] = {
          role: "assistant",
          text: aiText,
        };
        return updated;
      });
    }

    setLoading(false);
  }

  if (!open) return null;

  return (
    <div
      className="
        fixed bottom-24 right-6 z-50 
        w-[420px] max-w-full
        bg-white rounded-2xl shadow-2xl border border-gray-200
        p-4 flex flex-col
      "
    >
      {/* HEADER */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-100">
        <div>
          <div className="text-base font-semibold text-text">
            Gaarsdal Assistent
          </div>
          <div className="text-xs text-muted">
            Kort og rolig information
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-muted hover:text-text transition text-xl"
          aria-label="Luk chat"
        >
          ✕
        </button>
      </div>

      {/* MESSAGES */}
      <div
        id="gaarsdal-chat-window"
        className="flex-1 overflow-auto mb-3 pr-1 space-y-3"
        style={{ maxHeight: 300 }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`
              px-3 py-2 rounded-2xl max-w-[85%] text-sm leading-snug
              ${
                m.role === "assistant"
                  ? "bg-gray-100 text-text self-start"
                  : "bg-accent text-white self-end"
              }
            `}
          >
            <div dangerouslySetInnerHTML={{ __html: m.text }} />
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* INPUT */}
      <div className="mt-1">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Skriv dit spørgsmål…"
            className="
              flex-1 border border-gray-300 rounded-lg px-3 py-2
              focus:outline-none focus:ring-2 focus:ring-accent/40
            "
          />

          <button
            onClick={sendMessage}
            disabled={loading}
            className="
              bg-accent text-white px-4 py-2 rounded-lg 
              disabled:opacity-50 hover:bg-accent/90 transition
            "
          >
            {loading ? "…" : "Send"}
          </button>
        </div>

        <div className="text-xs text-muted mt-2">
          AI'en giver kort og generel information.
        </div>
      </div>
    </div>
  );
}
