export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { messages } = req.body;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      system: `Du er en venlig assistent der besvarer spørgsmål om et sommerhus til salg på Røsnæs.

Nøglefakta:
- Adresse: Klinten 2, 4400 Kalundborg · Pris: 1.500.000 kr. kontant
- 55 m² helårsisoleret, grund knap 1.200 m²
- 6 sovepladser i huset + 2 i gæstehus = 8 i alt
- Nyt IKEA-køkken 2020 inkl. opvaskemaskine
- Varmepumpe (app-styring), 3 solpaneler, brændeovn
- 3 terrasser (nybyggede 2022 og 2025), badeværelse renoveret 2005
- Tag: elefantpap under sten, meget lang holdbarhed
- Udsigt til vandet mod nord, fælles badebro
- 40+ år i familien, mormors hus frem til 2018
- Nær Dyrehøj Vingård og golfbane, ca. 90 min fra København
- Møbler kan overtages mod rimelig merpris
- Salg via Danbolig Kalundborg, Strandstræde 1, tlf. 59 56 16 00

Svar kort og konkret på dansk. Ved tvivl: henvis til Danbolig Kalundborg.`,
      messages
    })
  });

  const data = await response.json();
  const text = data.content?.find(b => b.type === 'text')?.text || 'Kontakt Danbolig Kalundborg på 59 56 16 00.';
  res.status(200).json({ reply: text });
}
