// pages/api/ai-stream.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getOrCreateSessionId } from "../../lib/session";

export const config = {
  runtime: "nodejs",
};

// ENV
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL!;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;
const OPENAI_KEY = process.env.OPENAI_API_KEY!;

// -------------------------------------------------------
// Redis helpers
// -------------------------------------------------------
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

async function redisSet(key: string, value: any) {
  await fetch(`${REDIS_URL}/set/${key}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ value: JSON.stringify(value) }),
  });
}

// -------------------------------------------------------
// Ensure metadata + register session (PATCH 6.6)
// -------------------------------------------------------
async function ensureSessionMeta(sessionId: string, req: NextApiRequest) {
  const now = Date.now();

  const meta = {
    sessionId,
    started: now,
    ua: req.headers["user-agent"] || "",
    ip:
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      req.socket.remoteAddress ||
      "",
  };

  // Save metadata
  await redisSet(`session_meta_${sessionId}`, meta);

  // Ensure session is pushed into the session list
  await redisPush("sessions", {
    sessionId,
    started: now,
  });
}

// -------------------------------------------------------
// MAIN HANDLER
// -------------------------------------------------------
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  // Create/get session ID via cookie
  const sessionId = getOrCreateSessionId(req, res);

  // Make sure metadata exists
  await ensureSessionMeta(sessionId, req);

  const body = JSON.parse(req.body || "{}");
  if (!body.messages)
    return res.status(400).json({ error: "Missing messages" });

  // Log USER message
  await redisPush(`session_${sessionId}_messages`, {
    role: "user",
    text: body.messages?.[0]?.content || "",
    time: Date.now(),
  });

  // Prepare streaming response
  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8",
    "Transfer-Encoding": "chunked",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });

  try {
    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
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
Du er Gaarsdal Assistent — en rolig, kortfattet og faglig hjælper.
Svar altid på dansk og aldrig med behandlingsråd.
Hold svarene korte (4–6 linjer).
`,
          },
          ...body.messages,
        ],
      }),
    });

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
        } catch {
          // ignore incomplete lines
        }
      }
    }

    // Log ASSISTANT message
    await redisPush(`session_${sessionId}_messages`, {
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
