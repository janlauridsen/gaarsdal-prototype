// pages/api/ai-stream.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getOrCreateSessionId } from "../../lib/session";

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL!;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;
const OPENAI_KEY = process.env.OPENAI_API_KEY!;

export const config = {
  runtime: "nodejs",
};

// Helper to push to Redis (LPUSH)
async function redisPush(key: string, value: any) {
  await fetch(`${REDIS_URL}/lpush/${key}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ value: JSON.stringify(value) }),
  });
}

// Save session metadata + register session
async function ensureSessionMeta(sessionId: string, req: NextApiRequest) {
  await fetch(`${REDIS_URL}/set/session_meta_${sessionId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      value: JSON.stringify({
        sessionId,
        started: Date.now(),
        ua: req.headers["user-agent"] || "",
        ip:
          (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
          req.socket.remoteAddress ||
          "",
      }),
    }),
  });

  // Register session in a list (for admin)
  await redisPush("chatlogs", {
    sessionId,
    type: "session-start",
    time: Date.now(),
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const sessionId = getOrCreateSessionId(req, res);

  await ensureSessionMeta(sessionId, req);

  const body = JSON.parse(req.body || "{}");
  if (!body.messages)
    return res.status(400).json({ error: "Missing messages" });

  const userText = body.messages?.[0]?.content || "";

  // Log USER message
  await redisPush("chatlogs", {
    sessionId,
    role: "user",
    text: userText,
    time: Date.now(),
  });

  await redisPush(`session_${sessionId}`, {
    role: "user",
    text: userText,
    time: Date.now(),
  });

  // Send streaming response
  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8",
    "Transfer-Encoding": "chunked",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });

  try {
    const aiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          stream: true,
          messages: [
            {
              role: "system",
              content: `
Du er Gaarsdal Assistent — rolig, kortfattet, varm og faglig.
Svar på dansk. Brug 4–6 linjer. Ingen behandlingsråd.
`,
            },
            ...body.messages,
          ],
        }),
      }
    );

    if (!aiResponse.body) return res.end();

    const reader = aiResponse.body.getReader();
    const decoder = new TextDecoder();
    let fullReply = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk
        .split("\n")
        .map((l) => l.replace(/^data: /, "").trim())
        .filter((l) => l && l !== "[DONE]");

      for (const line of lines) {
        try {
          const json = JSON.parse(line);
          const token = json.choices?.[0]?.delta?.content;
          if (token) {
            fullReply += token;
            res.write(token);
          }
        } catch {}
      }
    }

    // Log ASSISTANT reply
    await redisPush("chatlogs", {
      sessionId,
      role: "assistant",
      text: fullReply,
      time: Date.now(),
    });

    await redisPush(`session_${sessionId}`, {
      role: "assistant",
      text: fullReply,
      time: Date.now(),
    });

    res.end();
  } catch (err) {
    console.error("STREAM ERROR:", err);
    res.end();
  }
}
