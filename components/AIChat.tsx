// components/AIChat.tsx
import React, { useState, useRef, useEffect } from "react";

type Message = { role: "user" | "assistant"; text: string };

export default function AIChat({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          text: "Hej — jeg er Gaarsdal Assistent. Hvordan kan jeg hjælpe dig i dag? (fx: 'Hvordan foregår en session?', 'Kan hypnose hjælpe mod søvnproblemer?')",
        },
      ]);
    }
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  async function sendMessage() {
    if (!input.trim()) return;

    const userText = input.trim();
    setInput("");

    // Tilføj brugerens besked
    setMessages((m) => [...m, { role: "user", text: userText }]);

    // Tilføj tom AI-boble
    setMessages((m) => [...m, { role: "assistant", text: "" }]);
    setLoading(true);

    const resp = await fetch("/api/ai-stream", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: userText }],
      }),
    });

    if (!resp.body) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Beklager — der opstod en streamingfejl." },
      ]);
      setLoading(false);
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let aiText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      aiText += chunk;

      // Opdater sidste assistent-svar live
      setMessages((m) => {
        const updated = [...m];
        updated[updated.length - 1] = { role: "assistant", text: aiText };
        return updated;
      });
    }

    setLoading(false);
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
        {messages.map((m,
