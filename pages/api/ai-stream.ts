// pages/api/ai-stream.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getOrCreateSessionId } from "../../lib/session";

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL!;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;
const OPENAI_KEY = process.env.OPENAI_API_KEY!;

export const config = {
  runtime: "nodejs",
};

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

async function ensureSessionMeta(sessionId: string, req: NextApiRequest) {
  await redisSet(`session_meta_${sessionId}`, {
    sessionId,
    started: Date.now(),
    ua: req.headers["user-agent"] || "",
    ip:
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      req.socket.remoteAddress ||
      "",
  });

  await redisPush("sessions", {
    sessionId,
    started: Date.now(),
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

  const userMessage = {
    role: "user",
    text: body.messages?.[0]?.content || "",
    time: Date.now(),
  };

  // LOG: Session + chatlogs
  await redisPush(`session_${sessionId}`, userMessage);
  await redisPush("chatlogs", { sessionId, ...userMessage });

  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8",
    "Transfer-Encoding": "chunked",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
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
Du er Gaarsdal Assistent — rolig, klar og kortfattet.
Svar altid på dansk.
Svar i 4–6 linjer.
Ingen behandlingsråd. Vær støttende, ikke lovende.
`,
          },
          ...body.messages,
        ],
      }),
    });

    if (!openaiRes.body) return res.end();

    const reader = openaiRes.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";

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
            fullText += token;
            res.write(token);
          }
        } catch {}
      }
    }

    const assistantMessage = {
      role: "assistant",
      text: fullText,
      time: Date.now(),
    };

    await redisPush(`session_${sessionId}`, assistantMessage);
    await redisPush("chatlogs", { sessionId, ...assistantMessage });

    res.end();
  } catch (err) {
    console.error("STREAM ERROR:", err);
    res.end();
  }
}
