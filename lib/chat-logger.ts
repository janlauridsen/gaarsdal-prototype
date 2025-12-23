import { redisAppend } from "./redis";

export async function logChatMessage(
  role: "user" | "assistant",
  text: string
) {
  const entry = {
    role,
    text,
    time: new Date().toISOString(),
  };

  await redisAppend("gaarsdal_chat_log", entry);
}
