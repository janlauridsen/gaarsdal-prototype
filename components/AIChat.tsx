// components/AIChat.tsx
import React, { useState, useEffect } from "react";

type Message = {
  role: "user" | "assistant";
  text: string;
};

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

  // Initial UI-only welcome message
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          text:
            "Hej — jeg er Gaarsdal Assistent. " +
            "Jeg kan hjælpe med en indledende afklaring af, " +
            "om hypnoterapi kan være relevant at overveje.",
        },
      ]);
    }
  }, [open]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");

    // Update UI immediately
    setMessages((m) => [...m, { role: "user", text: userText }]);
    setLoading(true);

    try {
      const resp = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // 🔒 KUN user-beskeden sendes
          messages: [{ role: "user", content: userText }],
        }),
      });

      if (!resp.ok) {
        throw new Error("API error");
      }

      const data = await resp.json();

      setMessages((m) => [
        ...m,
        { role: "assistant", text: data.reply },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text:
            "Der opstod en teknisk fejl. " +
            "Prøv igen eller kontakt klinikken.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50 w-[420px] max-w-full bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 flex flex-col">
      {/* HEADER */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-100">
        <div>
          <div className="text-base font-semibold text-text">
            Gaarsdal Assistent
          </div>
          <div className="text-xs te
