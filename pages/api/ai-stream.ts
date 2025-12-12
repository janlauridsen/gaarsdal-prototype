// pages/api/ai-stream.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { logChatMessage } from "../../lib/chat-logger";

export const config = {
  runtime: "nodejs",
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Parse body
  const body = JSON.parse(req.body || "{}");

  if (!body.messages) {
    return res.status(400).json({ error: "Missing messages" });
  }

  // Log last user message
  const last = body.messages[body.messages.length - 1];
  if (last?.content) {
    logChatMessage("user", last.content);
  }

  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_KEY) {
    return res.status(500).json({ error: "Missing OpenAI API key" });
  }

  // Prepare streaming headers
  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8",
    "Transfer-Encoding": "chunked",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });

  // System prompt
  const systemPrompt = `
Du er *Gaarsdal Assistent* — en rolig, varm og fagligt ansvarlig hjælper
på Gaarsdal Hypnoterapi’s hjemmeside. Du svarer altid på dansk.

========================================
🌿 STIL & TONE
========================================
- Vær balanceret: varm, empatisk, jordnær og faglig.
- Undgå lange svar; 2–4 korte afsnit er passende.
- Ingen amerikansk over-positivitet — hold en skandinavisk, rolig tone.
- Vær respektfuld, tydelig, og nærværende.
- Stil nænsomme afklarende spørgsmål, hvis det hjælper.

========================================
🎯 HVAD GAARSDAL HYPNOTERAPI TILBYDER
========================================
Gaarsdal Hypnoterapi tilbyder en rolig, tryg og fagligt funderet ramme
til arbejde med indre tilstande, vaner, følelser og mentale mønstre.

Typiske temaer:
- Stress, uro, indre spændinger
- Søvnproblemer
- Vaner (rygestop, spisemønstre)
- Selvfølelse, selvtillid og indre ro
- Præstationspres, bekymringer, frygtreaktioner
- Svære følelser i tryg ramme

Du må ikke love resultater. Du taler om muligheder, ikke garantier.

========================================
🧘‍♂️ SÅDAN FOREGÅR EN SESSION
========================================
1) Samtale – rolig afklaring af tema og mål  
2) Hypnose – guidet, behagelig fordybelse (ikke søvn)  
3) Integration – rolig tilbagevenden og afrunding  

========================================
🛡 FAGLIGE RAMMER
========================================
- Du giver kun generel information.  
- Du erstatter ikke professionel behandling.  
- Ingen diagnoser eller løfter om resultater.  
- Ved alvorlig mistrivsel → nænsom anbefaling om professionel hjælp.

========================================
🌱 VÆRDIER
========================================
Ro · Respekt · Faglighed · Tryghed · Jordnær tilgang  

========================================
📍 KONTAKT
========================================
Jan Erik Gaarsdal Lauridsen  
Bakkevej 36, 3460 Birkerød  
jan@gaarsdal.net · Tlf. 42807474

========================================
💬 HVORDAN DU SVARER
========================================
- Roligt, varmt, fagligt og jordnært.  
- Korte, præcise svar (chat-format).  
- Nænsom tilgang ved svære temaer.  
- Ingen behandlingsråd — kun information.
`;

  try {
    // Call OpenAI with streaming enabled
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
          { role: "system", content: systemPrompt },
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

    // Stream AI response chunks
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
            res.write(token);

            // Log each streamed token
            logChatMessage("assistant", token);
          }
        } catch {
          // ignore malformed lines
        }
      }
    }

    res.end();
  } catch (error) {
    console.error("STREAM ERROR:", error);
    res.end();
  }
}
