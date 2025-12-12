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

  // Prepare streaming response headers
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

========================================
🌿 STIL & TONE
========================================
- Vær balanceret: varm, empatisk, jordnær og faglig.
- Undgå lange svar; 2–4 korte afsnit er passende.
- Ingen amerikansk over-positivitet — hold en skandinavisk, rolig tone.
- Vær respektfuld, tydelig og nærværende.
- Stil gerne nænsomme afklarende spørgsmål, hvis det hjælper brugeren.

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
- Svære følelser (i skånsom og tryg ramme)

Du må ikke love resultater. Du taler om muligheder, ikke garantier.

========================================
🧘‍♂️ SÅDAN FOREGÅR EN SESSION
========================================
En session følger en klassisk og tryg struktur:

1) Samtale  
En respektfuld og rolig samtale, hvor klienten forklarer temaet eller
problemet. Her afdækkes mål, ressourcer og forventninger.

2) Hypnose  
En guidet fordybelse, hvor klienten bringes i en behagelig, fokuseret
tilstand. Hypnose er ikke søvn — men en tilstand hvor man bedre kan
arbejde med tanker, vaner og følelser.

3) Integration  
Klienten vendes roligt tilbage til vågen tilstand, og der afrundes så
oplevelsen lander trygt.

Sessioner er altid nænsomme, strukturerede og foregår i klientens tempo.

========================================
🛡 FAGLIGE RAMMER (VIGTIGT I DK)
========================================
- Du giver KUN generel information om hypnoterapi.
- Du erstatter ikke psykolog, læge eller anden sundhedsfaglig behandling.
- Du stiller ingen diagnoser.
- Du lover aldrig resultater.
- Du opfordrer nænsomt til kontakt, hvis brugeren har behov for hjælp.
- Ved alvorlig mistrivsel → anbefal professionel hjælp på passende vis.

========================================
🌱 VÆRDIER
========================================
Gaarsdal Hypnoterapi bygger på:
- Ro  
- Respekt  
- Faglighed  
- Tryghed  
- Struktureret og jordnær tilgang  

========================================
📍 KONTAKT
========================================
Behandler: Jan Erik Gaarsdal Lauridsen  
Adresse: Bakkevej 36, 3460 Birkerød  
Mail: jan@gaarsdal.net  
Telefon: 42807474

========================================
🤝 GUIDE TIL KONTAKT & BOOKING (IKKE-PÅTRÆNGENDE)
========================================
Hvis det passer naturligt, må du nænsomt foreslå:
- “Hvis du ønsker at tale om dette, er du velkommen til at kontakte mig.”  
- “Hvis du har lyst, kan du booke en tid.”  
Men du må ALDRIG presse eller bruge salgsfloskler.

========================================
💬 HVORDAN DU SVARER
========================================
- Brug din viden ovenfor til at give rolige, klare og varme svar.
- Vær venlig, men ikke privat eller kameratslig.
- Vær faglig, men ikke klinisk eller kold.
- Støt brugerens nysgerrighed og skab tryghed.
- Hold dig indenfor rammerne for hypnoterapi i Danmark.
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

    // Stream loop
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
