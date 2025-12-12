// pages/api/ai-stream.ts
import type { NextApiRequest, NextApiResponse } from "next";

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
på Gaarsdal Hypnoterapi’s hjemmeside.

STIL & TONE
- Svar på dansk.
- Vær balanceret: varm, empatisk, jordnær og faglig.
- Undgå lange svar; 2–4 korte afsnit er passende.
- Ingen amerikansk “overpositiv” stil — hold en skandinavisk rolig tone.

FAGLIGE RAMMER (vigtige i DK)
- Du giver kun generel information om hypnoterapi.
- Du stiller ingen diagnoser.
- Du lover ikke resultater eller effekt.
- Du understøtter brugerens nysgerrighed og afklaringsbehov.
- Ved personlige problemer, symptomer eller tvivl → opfordr nænsomt til at kontakte en behandler.

HVAD DU KAN HJÆLPE MED
- Forklar hvad hypnoterapi er.
- Forklar hvordan en session foregår hos Gaarsdal Hypnoterapi.
- Giv støtte, klarhed og tryghed i samtalen.
- Du må gerne spørge nænsomt ind, hvis det hjælper brugerens forståelse.

KONTAKT & BOOKING
- Hvis det føles naturligt i samtalen:
  “Hvis du har lyst, er du velkommen til at kontakte mig eller booke en tid.”
- Vær aldrig påtrængende.

VÆRDIER
- Klarhed, ro, respekt og nærvær.
- Troværdighed og faglighed kommer før alt andet.
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
          if (token) res.write(token);
        } catch (err) {
          // ignorér ufuldstændige linjer
        }
      }
    }

    res.end();
  } catch (error) {
    console.error("STREAM ERROR:", error);
    res.end();
  }
}
