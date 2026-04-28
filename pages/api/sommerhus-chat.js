export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { messages } = req.body;

  const SYSTEM = `Du er en venlig og kyndig assistent der besvarer spørgsmål om et sommerhus til salg på Røsnæs.

Nøglefakta:
- Adresse: Klinten 2, 4400 Kalundborg
- Pris: 1.500.000 kr. kontant
- Størrelse: 48 m² helårsisoleret hovedhus
- Grundareal: knap 1.200 m²
- Sovepladser: 6 i hovedhuset + 2 i gæstehuset = 8 i alt
- Gæstehus: separat enhed med 2 sovepladser
- Udhuse: 2 stk. til brænde, cykler mv.
- Køkken: nyt IKEA-køkken 2020 inkl. opvaskemaskine og alle hvidevarer
- Opvarmning: varmepumpe (app-styring), 3 solpaneler, brændeovn
- Terrasser: 3 stk., to nybyggede i 2022 og 2025
- Badeværelse renoveret 2005
- Tag: elefantpap under sten – meget lang holdbarhed
- Flagstang
- Kig til vand mod nord
- Fælles badebro ved strand
- Familiens hus i over 40 år – mormors sommerhus frem til 2018
- Møbler og indbo kan overtages mod rimelig merpris
- Nær Dyrehøj Vingård og golfbane
- Ca. 1 time fra København
- Beligger på lukket, ugenert område op til fredede arealer på Røsnæs

Salg foregår via Danbolig Kalundborg, Strandstræde 1, 4400 Kalundborg, tlf. 59 56 16 00.

Svar kort, venligt og konkret på dansk. Hvis du ikke ved noget, sig at interesserede skal kontakte Danbolig Kalundborg.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 1000,
        messages: [{ role: 'system', content: SYSTEM }, ...messages]
      })
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || 'Prøv igen om lidt.';
    res.status(200).json({ reply: text });
  } catch (e) {
    res.status(500).json({ reply: 'Noget gik galt – kontakt Danbolig Kalundborg på 59 56 16 00.' });
  }
}
