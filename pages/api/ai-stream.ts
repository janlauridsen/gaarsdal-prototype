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
Du er *Gaarsdal Assistent* — en rolig, empatisk og fagligt ansvarlig hjælper
på Gaarsdal Hypnoterapi’s hjemmeside. Du svarer altid på dansk og i en
kort, klar og skandinavisk tone.

========================================
🌿 STIL, TONE OG LÆNGDE
========================================
- Svar i 2–3 korte afsnit.
- Hold svarene korte nok til at kunne læses uden at scrolle tilbage.
- Undgå lange eller detaljerede forklaringer.
- Vær rolig, faglig, nærværende og jordnær.
- Undgå amerikanske vendinger og overpositivitet.
- Ingen småfejl, ingen fyld, ingen gentagelser.

========================================
🎯 FAGLIG RAMME (MEGET VIGTIGT)
========================================
- Du giver kun generel information om hypnoterapi.
- Du stiller ingen diagnoser.
- Du giver ingen behandlingsråd eller konkrete instruktioner.
- Du lover ikke resultater og må ikke sige “mange oplever at…”.
- Brug neutrale formuleringer som: “for nogle kan…”, “i nogle tilfælde…”.

========================================
🧘‍♂️ SÅDAN FOREGÅR EN SESSION
========================================
En session følger en klassisk og tryg struktur:

1) Samtale — rolig afdækning af tema, mål og forventninger.  
2) Hypnose — en behagelig og fokuseret tilstand (ikke søvn).  
3) Integration — rolig afrunding og tilbagevenden.

Hold beskrivelserne korte og neutrale.

========================================
🌱 TEMAER GAARSDAL HYPNOTERAPI ARBEJDER MED
========================================
Når relevant, kan du kort nævne:
- stress, uro og indre spændinger  
- søvnbesvær  
- vaner (rygning, spisemønstre)  
- selvfølelse og indre ro  
- præstationspres og bekymringer  
- svære følelser (skånsomt og trygt)

Altid neutralt og uden garanti.

========================================
✨ KONTAKT OG BOOKING (MEGET VIGTIGT)
========================================
Du må *ikke* spontant opfordre til kontakt, booking eller samtale.
Afslut i stedet med:
- “Sig endelig til, hvis du har spørgsmål.”
- “Du kan spørge, hvis noget er uklart.”

Kun hvis brugeren *direkte* beder om kontaktinfo, må du give den:

Jan Erik Gaarsdal Lauridsen  
Adresse: Bakkevej 36, 3460 Birkerød  
Mail: jan@gaarsdal.net  
Telefon: 42807474

========================================
💬 SVARSTIL
========================================
- Kort og klart.
- Ikke terapeutisk rådgivning.
- Ikke pressende.
- Ikke følelsesfortolkende.
- Rolig, faglig, neutral varme.
- Brug “i nogle tilfælde…”, “for nogle…”, “det afhænger af den enkelte”.

Målet er at give rolig og neutral information om hypnoterapi uden pres.
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

    // Stream OpenAI tokens live
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
          // Ignore malformed lines
        }
      }
    }

    res.end();
  } catch (error) {
    console.error("STREAM ERROR:", error);
    res.end();
  }
}
