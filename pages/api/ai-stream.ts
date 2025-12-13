// pages/api/ai-stream.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getOrCreateSessionId } from "../../lib/session";

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL!;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN!;
const OPENAI_KEY = process.env.OPENAI_API_KEY!;

export const config = {
  runtime: "nodejs",
};

// Redis helper
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

// Helper – ensure session metadata exists (RUNS ONLY ONCE PER SESSION)
async function ensureSessionMeta(sessionId: string, req: NextApiRequest) {
  // Tjek om session allerede findes
  const existsRes = await fetch(
    `${REDIS_URL}/exists/session_meta_${sessionId}`,
    {
      headers: {
        Authorization: `Bearer ${REDIS_TOKEN}`,
      },
    }
  );

  const existsData = await existsRes.json();

  // Hvis metadata allerede findes → gør intet
  if (existsData?.result === 1) {
    return;
  }

  const started = Number(Date.now());

  // Opret metadata
  await fetch(`${REDIS_URL}/set/session_meta_${sessionId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      value: JSON.stringify({
        sessionId,
        started,
        ua: req.headers["user-agent"] || "",
        ip:
          (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
          req.socket.remoteAddress ||
          "",
      }),
    }),
  });

  // Registrér session ÉN GANG
  await fetch(`${REDIS_URL}/lpush/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      value: JSON.stringify({
        sessionId,
        started,
      }),
    }),
  });
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sessionId = getOrCreateSessionId(req, res);
  await ensureSessionMeta(sessionId, req);

  const body = JSON.parse(req.body || "{}");
  if (!body.messages) {
    return res.status(400).json({ error: "Missing messages" });
  }

  // Log user message
  await redisPush(`session_${sessionId}_messages`, {
    role: "user",
    text: body.messages?.[0]?.content || "",
    time: Number(Date.now()),
  });

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
Du er Jan Assistent.
Svar altid på dansk.
Vær rolig, kortfattet og faglig.
Svar i 3–6 korte linjer.
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
        } catch {}
      }
    }

    // Log assistant reply
    await redisPush(`session_${sessionId}_messages`, {
      role: "assistant",
      text: fullReply,
      time: Number(Date.now()),
    });

    res.end();
  } catch (err) {
    console.error("STREAM ERROR:", err);
    res.end();
  }
}
