// pages/api/ai-stream.ts
import type { NextApiRequest, NextApiResponse } from "next";

// --- Redis client (Upstash) ---
const redisUrl = process.env.UPSTASH_REDIS_REST_URL!;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN!;

async function logToRedis(message: any) {
  try {
    await fetch(redisUrl + "/set", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${redisToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key: `chatlog:${Date.now()}`,   // simple unique key
        value: JSON.stringify(message),
      }),
    });
  } catch (err) {
    console.error("Redis log error:", err);
  }
}

export const config = {
  runtime: "nodejs",
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = JSON.parse(req.body || "{}");

  if (!body.messages) {
    return res.status(400).json({ error: "Missing messages" });
  }

  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_KEY) {
    return res.status(500).json({ error: "Missing OpenAI API key" });
  }

  // --- Log user message ---
  await logToRedis({
    type: "user_message",
    timestamp: Date.now(),
    content: body.messages,
  });

  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8",
    "Transfer-Encoding": "chunked",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
Du er *Gaarsdal Assistent* — en rolig, varm og fagligt ansvarlig hjælper
på Gaarsdal Hypnoterapi’s hjemmeside. Du svarer altid på dansk.

Hold svarene meget korte (maks 4–6 linjer), rolige og jordnære.
Du giver ikke behandling eller diagnoser — kun generel og tryg information.
Hvis noget kræver professionel vurdering, nænsomt anbefal kontakt.

Kort præsentation af stedet:
- Rolig og tryg ramme i Birkerød.
- Arbejde med stress, indre uro, søvn, vaner, selvtillid og indre ro.
- En session består af samtale → fordybelse → integration.

Værdier:
Ro • Respekt • Faglighed • Tryghed.

Kontakt:
jan@gaarsdal.net — 42807474
`
          },
          ...body.messages,
        ],
      }),
    });

    if (!response.body) {
      res.end();
      return;
    }

    const reader = response.body.getReader();
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
        } catch (err) {
          // ignore malformed lines
        }
      }
    }

    // --- Log AI reply ---
    await logToRedis({
      type: "assistant_reply",
      timestamp: Date.now(),
      content: fullReply,
    });

    res.end();
  } catch (error) {
    console.error("STREAM ERROR:", error);
    res.end();
  }
}
