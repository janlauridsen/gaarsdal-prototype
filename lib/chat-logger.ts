// lib/chat-logger.ts
import { redisPush } from "./redis";

export async function logChatMessage(role: "user" | "assistant", text: string) {
  const timestamp = Date.now();
  const entry = {
    role,
    text,
    time: new Date(timestamp).toISOString(),
  };

  await redisPush("gaarsdal_chat_log", entry);
}
