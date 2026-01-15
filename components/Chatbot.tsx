import { useEffect, useRef, useState } from "react";
import {
  ChatBubbleOvalLeftEllipsisIcon,
  XMarkIcon,
  PlusIcon,
  BackwardIcon,
  ForwardIcon,
  TrashIcon,
  ArrowsPointingOutIcon,
} from "@heroicons/react/24/outline";

/* =====================
   TYPES
===================== */

type Message = {
  role: "user" | "assistant";
  content: string;
  chips?: string[];
};

type Conversation = {
  id: string;
  messages: Message[];
};

/* =====================
   CONFIG
===================== */

const MAX_SESSIONS = 5;

/* =====================
   HELPERS
===================== */

function createConversation(): Conversation {
  return {
    id: crypto.randomUUID(),
    messages: [],
  };
}

/* =====================
   COMPONENT
===================== */

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [stack, setStack] = useState<Conversation[]>([createConversation()]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const currentNodeRef = useRef<string>("ROOT");

  const current = stack[index];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [current.messages, loading]);

  /* =====================
     INIT → ROOT
  ===================== */

  useEffect(() => {
    if (!open) return;
    if (current.messages.length > 0) return;

    currentNodeRef.current = "ROOT";

    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: current.id,
        currentNode: "ROOT",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        currentNodeRef.current = data.node;

        setStack((prev) => {
          const next = [...prev];
          next[index] = {
            ...next[index],
            messages: [
              {
                role: "assistant",
                content: data.message,
                chips: data.chips ?? [],
              },
            ],
