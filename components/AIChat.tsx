// components/AIChat.tsx
import React, { useState, useRef, useEffect } from "react";

type Message = { role: "user" | "assistant"; text: string };

export default function AIChat({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      // gentle welcome message if empty
      if (messages.length === 0) {
        setMessages([
          {
            role: "assistant",
            text: "Hej — jeg er Gaarsdal Assistent. Hvordan kan jeg hjælpe dig i dag? (fx: 'Hvordan foregår en session?', 'Kan hypnose hjælpe mod søvnproblemer?')",
          },
        ]);
      }
    }
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  async function sendMessage() {
    if (!input.trim()) return;
    const userText = input.trim();
    setMessages((m) => [...m, { role: "user", text: userText }]);
    setInput("");
    setLoading(true);

    try {
      const resp = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: userText }],
        }),
      });
      const data = await resp.json();
      if (resp.ok && data.reply) {
        setMessages((m) => [...m, { role: "assistant", text: data.reply }]);
      } else {
        const err = data?.error || "Der opstod en fejl. Prøv igen senere.";
        setMessages((m) => [...m, { role: "assistant", text: `Beklager — ${err}` }]);
      }
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", text: "Netværksfejl — prøv igen." }]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50 w-96 max-w-full bg-white rounded-xl shadow-xl border p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-medium">Gaarsdal Assistent</div>
          <div className="text-xs text-muted">Hjælp og information om hypnoterapi</div>
        </div>
        <button onClick={onClose} className="text-muted hover:text-text">Luk</button>
      </div>

      <div className="flex-1 overflow-auto mb-3 space-y-3" style={{ maxHeight: 320 }}>
        {messages.map((m, i) => (
          <div key={i} className={`p-2 rounded ${m.role === "assistant" ? "bg-sage/10 self-start" : "bg-accent text-white self-end"}`}>
            <div className={m.role === "assistant" ? "text-sm text-text" : "text-sm"} dangerouslySetInnerHTML={{ __html: m.text }} />
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="mt-2">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Skriv dit spørgsmål..."
            className="flex-1 border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="bg-accent text-white px-3 py-2 rounded-md disabled:opacity-60"
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
        <div className="text-xs text-muted mt-2">
          Bemærk: AI-assistenten giver generel information — den erstatter ikke professionel behandling.
        </div>
      </div>
    </div>
  );
}
