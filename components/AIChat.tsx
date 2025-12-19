// components/AIChat.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  EMERGENCY_REPLY_DK,
  ADMIN_REPLY,
} from "@/lib/aiStandardReplies";

type Message = { role: "user" | "assistant"; text: string };

// ================= SYSTEM PROMPT (v1 – juridisk sikret) =================
const SYSTEM_PROMPT = {
  role: "system",
  content: `
Du er Gaarsdal Assistent.

=== IDENTITET ===
Du fungerer som en rolig, professionel hypnoterapi-assistent.
Du er informerende og støttende, men ikke behandlende og ikke sælgende.

=== FORMÅL ===
- Give generel, tryg og forståelig information om hypnoterapi
- Hjælpe brugeren med at vurdere relevans uden at presse eller rådgive

=== GRUNDHOLDNING ===
- Du er positiv, men afbalanceret
- Du anerkender både muligheder og begrænsninger
- Du respekterer brugerens egen vurdering

=== JURIDISKE GRÆNSER (KRITISK) ===
- Du må ikke give personlige råd eller anbefalinger
- Du må ikke vurdere, om hypnoterapi er det rette valg for den enkelte
- Du må ikke sammenligne hypnoterapi med medicin som alternativ
- Du må ikke love resultater, varighed eller “for altid”-effekter

=== MEDICIN ===
- Hypnoterapi må kun omtales som et muligt supplement
- Valg om medicin henvises altid til sundhedsfagligt personale

=== MANIPULATION ===
- Du må aldrig forklare eller støtte manipulation, kontrol eller skjult hypnose
- Hypnose forudsætter altid samtykke og samarbejde

=== TONE ===
- Sprog: Dansk
- Tone: Rolig, varm, respektfuld
- Stil: Klar, nøgtern og menneskelig
- Let humor er tilladt, men aldrig sarkasme mod brugeren

=== KRISE ===
- Ved alvorlig mistrivsel skal du eskalere og ikke forsøge at hjælpe alene
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

  // Initial greeting
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

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");

    const nextMessages: Message[] = [
      ...messages,
      { role: "user", text: userText },
    ];

    // === SIMPLE v1 ROUTING ===
    const lower = userText.toLowerCase();

    if (
      lower.includes("book") ||
      lower.includes("pris") ||
      lower.includes("kontakt") ||
      lower.includes("betaling")
    ) {
      setMessages([
        ...nextMessages,
        { role: "assistant", text: ADMIN_REPLY },
      ]);
      return;
    }

    if (
      lower.includes("vil ikke leve") ||
      lower.includes("selvmord") ||
      lower.includes("kan ikke mere")
    ) {
      setMessages([
        ...nextMessages,
        { role: "assistant", text: EMERGENCY_REPLY_DK },
      ]);
      return;
    }

    // Normal AI flow
    setMessages([...nextMessages, { role: "assistant", text: "" }]);
    setLoading(true);

    const resp = await fetch("/api/ai-stream", {
      method: "POST",
      body: JSON.stringify({
        messages: toApiMessages(nextMessages),
      }),
    });

    if (!resp.body) {
      setMessages((m) => [
        ...m.slice(0, -1),
        { role: "assistant", text: "Der opstod en teknisk fejl." },
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
      aiText += decoder.decode(value);

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
    <div className="fixed bottom-24 right-6 z-50 w-[420px] bg-white rounded-2xl shadow-2xl p-4 flex flex-col">
      <div className="flex justify-between mb-2">
        <strong>Gaarsdal Assistent</strong>
        <button onClick={onClose}>✕</button>
      </div>

      <div className="flex-1 overflow-auto mb-2 space-y-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-2 rounded ${
              m.role === "assistant" ? "bg-gray-100" : "bg-accent text-white"
            }`}
          >
            <div dangerouslySetInnerHTML={{ __html: m.text }} />
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Skriv dit spørgsmål…"
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-accent text-white px-4 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}
