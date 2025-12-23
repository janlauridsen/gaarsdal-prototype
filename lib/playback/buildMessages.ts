// lib/playback/buildMessages.ts

export type ChatMessage = {
  role: "system" | "user";
  content: string;
};

export function buildPlaybackMessages(
  prompt: string,
  userTurns: { userText: string }[]
): ChatMessage[] {
  return [
    { role: "system", content: prompt },
    ...userTurns.map((t) => ({
      role: "user" as const,
      content: t.userText,
    })),
  ];
}
