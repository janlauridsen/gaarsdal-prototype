// UPDATED FILE: components/Chatbot.tsx
import { useEffect, useRef, useState } from "react";
import {
  PlusIcon,
  BackwardIcon,
  ForwardIcon,
  EnvelopeIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [firstOpen, setFirstOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const seen = localStorage.getItem("chatbot_seen");
    if (!seen) {
      setFirstOpen(true);
      localStorage.setItem("chatbot_seen", "1");
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage() {
    if (!input.trim()) return;
    setMessages((m) => [...m, { role: "user", content: input }]);
    setInput("");
    setFirstOpen(false);
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 p-4 rounded-full bg-accent text-white"
        >
          <ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-4 right-4 w-full max-w-sm bg-white rounded-xl shadow-lg flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <span className="text-sm font-medium">Chat</span>
            <div className="flex gap-1">
              <button className="p-3" aria-label="Udvid">
                <ForwardIcon className="w-6 h-6" />
              </button>
              <button
                className="p-3"
                aria-label="Luk"
                onClick={() => setOpen(false)}
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* First open chips */}
          {firstOpen && messages.length === 0 && (
            <div className="flex gap-2 px-3 py-2 overflow-x-auto">
              <button className="px-3 py-1 rounded-full bg-gray-100 text-sm">
                Kontakt
              </button>
              <button className="px-3 py-1 rounded-full bg-gray-100 text-sm">
                Brug af chatbotten
              </button>
              <button className="px-3 py-1 rounded-full bg-gray-100 text-sm">
                Forbehold
              </button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`text-sm p-2 rounded-lg max-w-[80%] ${
                  m.role === "user"
                    ? "ml-auto bg-accent text-white"
                    : "bg-gray-100"
                }`}
              >
                {m.content}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t p-2 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 border rounded px-2 py-1 text-sm"
              placeholder="Skriv her…"
            />
            <button
              onClick={sendMessage}
              className="px-3 py-1 bg-accent text-white rounded"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
