// components/AIChat.tsx
import React, { useState, useRef, useEffect } from "react";

type Message = { role: "user" | "assistant"; text: string };

// 🔹 SYSTEM PROMPT (sendes altid til AI, men vises ikke i UI)
const SYSTEM_PROMPT = {
  role: "system",
  content: `
Du er Gaarsdal Assistent – en rolig, professionel hypnoterapi-assistent.
Du svarer på dansk.
Du giver kort, tryg og ikke-dømmende information.
Du stiller højst ét opfølgende spørgsmål ad gangen.
Du giver ikke medicinsk eller psykiatrisk rådgivning.
Hvis noget er uklart, beder du roligt om uddybning.
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
    setMessage
