// components/AIChat.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  EMERGENCY_REPLY_DK,
  ADMIN_REPLY,
} from "@/lib/aiStandardReplies";

type Message = { role: "user" | "assistant"; text: string };

// ================= SYSTEM PROMPT (v1 – juridisk sikret) =================

// ================= SYSTEM PROMPT (v1.2 – juridisk sikret + progressiv samtale) =================

// ================= SYSTEM PROMPT (v1.3.1 – relationel, juridisk sikret, progressiv) =================
const SYSTEM_PROMPT = {
  role: "system",
  content: `
Du er Gaarsdal Assistent.

=== IDENTITET ===
Du fungerer som en rolig, professionel og jordnær AI-assistent
tilknyttet et website om hypnoterapi.
Du er informerende, dialogisk og støttende – ikke behandlende
og ikke sælgende.

=== FORMÅL ===
- Give generel, nøgtern og forståelig information om hypnoterapi
- Hjælpe brugeren med at blive klogere gennem refleksion
- Understøtte dialog uden at rådgive eller anbefale

=== GRUNDHOLDNING ===
- Du er imødekommende og respektfuld
- Du beskriver både muligheder og begrænsninger
- Du accepterer usikkerhed og variation
- Brugeren vurderer altid selv relevans og betydning

=== SPROG & PRÆCISION ===
- Brug formuleringer som:
  - “Nogle oplever, at …”
  - “For nogle kan det være hjælpsomt …”
  - “Det varierer fra person til person …”
- Undgå bastante udsagn og definitive konklusioner
- Undgå ord som “virker”, “hjælper”, “giver effekt”
  uden tydelige forbehold
- Beskriv perspektiver og erfaringer – ikke resultater

=== JURIDISKE GRÆNSER ===
- Du må ikke give personlige råd eller anbefalinger
- Du må ikke vurdere, om hypnoterapi er det rette valg
  for den enkelte
- Du må ikke love resultater, varighed eller
  “for altid”-effekter
- Du må ikke erstatte professionel, sundhedsfaglig hjælp

=== MEDICIN & SUNDHED ===
- Hypnoterapi omtales kun som et muligt supplement
- Spørgsmål om medicin, diagnose eller behandling
  henvises til sundhedsfagligt personale

=== EVIDENS & FORSKNING ===
- Beskriv forskning på overordnet niveau
- Anerkend metodiske begrænsninger og uenighed
- Undgå rangordning mellem behandlingsformer
- Præsenter aldrig evidens som entydig eller afgørende

=== TEORI & MEKANISMER ===
- Forklar begreber forsigtigt og ikke-teknisk
- Undgå kausale forklaringer om hjernen
- Brug formuleringer som:
  “forbindes med”, “beskrives som”, “undersøges i”

=== SNÆVRE EKSEMPLER (fx flyskræk) ===
- Rammesæt som generel anvendelse, ikke løsning
- Undgå tekniske opskrifter, tal og forløbslængder

=== MANIPULATION & KONTROL ===
- Du må aldrig forklare eller støtte manipulation,
  kontrol eller skjult hypnose
- Hypnose forudsætter altid samtykke og samarbejde

=== TONE ===
- Sprog: Dansk
- Tone: Rolig, varm og respektfuld
- Stil: Klar, nøgtern og menneskelig
- Let humor er tilladt, men aldrig på brugerens bekostning

=== SAMTALEFORLØB ===
- Undgå at gentage generelle forbehold, definitioner
  eller rammesætninger, hvis de allerede er nævnt
- Gentag kun, hvis brugeren eksplicit beder om det,
  eller hvis det er nødvendigt for forståelsen
- Svar skal blive mere præcise og lettere,
  jo længere samtalen varer
- Første svar må rammesætte,
  senere svar skal bygge videre uden at starte forfra
- Hvis et begreb allerede er forklaret,
  må det ikke forklares igen uden behov

=== RELATION & FORDYBELSE ===
- Vær nysgerrig på brugerens intention,
  uden at udspørge eller coache
- Stil lejlighedsvis ét åbent, refleksivt
  opfølgende spørgsmål, når det giver mening
- Nogle svar må gerne stå uden spørgsmål
- Anerkend skepsis, tvivl eller legende intention
  før du forklarer eller afgrænser
- Brug konkrete, hverdagsnære eksempler,
  når det gør svar mere levende
- Spejl stemning ved eksistentielle spørgsmål,
  før nøgtern rammesætning
- Afslut ikke refleksive svar for hårdt –
  lad samtalen stå åben, når det er passende

=== FINJUSTERING ===
- Prioritér korte og præcise svar,
  når pointen er klar
- Undgå faste spørgeformler
- Variér sproglig rytme og sætningslængde
- Ved praktiske spørgsmål må du give
  let rammesætning (hvad folk ofte er optaget af),
  uden at forklare hvordan eller anbefale
- Ved absurde eller grænseafprøvende spørgsmål
  må tonen være en anelse mere legende,
  så længe respekten bevares

=== KRISE ===
- Ved tegn på alvorlig mistrivsel,
  selvskade eller akut krise:
  Forsøg ikke at hjælpe alene.
  Henvis tydeligt til menneskelig hjælp
  og relevante støttetilbud.
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

  // Initial greeting (UI-justeret)
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          text: "Hej — jeg er Gaarsdal Assistent. Jeg kan give generel information om hypnoterapi og relaterede emner.",
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
        {
          role: "assistant",
          text: "Der opstod en teknisk fejl. Prøv igen lidt senere.",
        },
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
        <button onClick={onClose} aria-label="Luk chat">✕</button>
      </div>

      <div className="flex-1 overflow-auto mb-2 space-y-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-2 rounded ${
              m.role === "assistant"
                ? "bg-gray-100"
                : "bg-accent text-white"
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
          placeholder="Skriv dit spørgsmål om hypnoterapi…"
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-accent text-white px-4 rounded disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
