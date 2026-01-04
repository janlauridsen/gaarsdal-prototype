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

type Conversation = {
  id: string;
  messages: Message[];
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [index, setIndex] = useState(0);
  const [stack, setStack] = useState<number[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const conversation = conversations[index];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  async function sendMessage() {
    if (!input.trim()) return;

    const newMessage: Message = { role: "user", content: input };
    const updatedConversation: Conversation = {
      id: conversation?.id ?? crypto.randomUUID(),
      messages: [...(conversation?.messages ?? []), newMessage],
    };

    const updatedConversations = [...conversations];
    updatedConversations[index] = updatedConversation;

    setConversations(updatedConversations);
    setInput("");

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: updatedConversation.messages }),
    });

    const data = await res.json();

    updatedConversation.messages.push({
      role: "assistant",
      content: data.message,
    });

    setConversations([...updatedConversations]);
  }

  return (
    <div className="gaarsdal-chatbot">
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-green-700 text-white p-3 rounded-full shadow-lg"
        >
          <ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6" />
        </button>

        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-end p-6">
            <div className="w-full max-w-md h-[80vh] bg-white rounded-xl shadow-xl flex flex-col">
              <header className="flex items-center justify-between p-4">
                <span className="font-semibold">Chat</span>
                <button onClick={() => setIsOpen(false)}>
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </header>

              <div
                id="gaarsdal-chat-window"
                className="messages flex-1 overflow-y-auto p-4 space-y-3"
              >
                {conversation?.messages.map((m, i) => (
                  <div
                    key={i}
                    className={`message ${
                      m.role === "user" ? "user ml-auto" : "bot mr-auto"
                    } max-w-[80%] p-3 rounded-lg animate-fadeIn`}
                  >
                    {m.content}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <footer className="p-4 flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  className="flex-1 border rounded-lg px-3 py-2"
                  placeholder="Skriv her…"
                />
                <button
                  onClick={sendMessage}
                  className="gaarsdal-primary-button px-4 rounded-lg"
                >
                  Send
                </button>
              </footer>

              <div className="flex items-center justify-between p-3 border-t">
                <button
                  onClick={() => setIndex(Math.max(index - 1, 0))}
                  disabled={index === 0}
                >
                  <BackwardIcon className="w-5 h-5" />
                </button>

                <div className="flex gap-1">
                  {stack.map((_, i) => (
                    <span
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i === index ? "bg-accent" : "bg-gray-300"
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={() =>
                    setIndex(Math.min(index + 1, conversations.length - 1))
                  }
                  disabled={index >= conversations.length - 1}
                >
                  <ForwardIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    </div>
  );
}
