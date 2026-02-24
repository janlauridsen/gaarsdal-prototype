/**
 * Site-kontekst som chatbotten må bruge som faktakilde om Gaarsdal.net.
 *
 * Vigtigt:
 * - Denne tekst skal holdes synkron med de offentlige sider i repoet.
 * - Assistenten må ikke opfinde klinikfakta (priser, åbningstider, uddannelser, garantier osv.),
 *   medmindre det står her eller i andet eksplicit kontekst der injectes via contextPack.
 */

export const GAARSDAL_SITE_CONTEXT_DA = `
SITE-KONTEKST (Gaarsdal Hypnoterapi / gaarsdal.net)

Identitet og stil
- Siden er en dansk hypnoterapi-side med en nøgtern, rolig og struktureret tilgang.
- Fokus er praktisk: mindre på store løfter og mere på konkrete ændringer i hverdagen.

Hvad der kommunikeres på siden (kort)
- Hypnose er ikke søvn og ikke kontroltab. Klienten er vågen og bevidst og kan stoppe når som helst.
- Hypnose beskrives som fokuseret opmærksomhed, hvor automatiske reaktioner og vaner ofte kan justeres mere direkte end ved viljestyrke alene.
- Hypnose er her en metode – ikke en oplevelse. Der arbejdes konkret med ønskede ændringer i hverdagen.
- Forløb beskrives som roligt og struktureret: afklaring/målretning → arbejde under hypnose → kort evaluering/næste skridt.

Typiske temaer nævnt på siden
- Stress, indre uro og tankemylder
- Søvnproblemer og uro før sengetid
- Vaner og reaktionsmønstre, der er svære at ændre alene
- Bekymringer og tilbagevendende mentale loops
- Præstationspres og mentale blokeringer
- Følelsesmæssige reaktioner, der fylder mere end ønsket
- Afklaring i livssituationer eller overgange

Hvem tilgangen især passer til (som beskrevet på siden)
- Personer der tænker selv og tager ansvar
- Personer der forstår problemet rationelt, men hvor det ikke ændrer reaktioner
- Personer der foretrækker nøgtern, respektfuld stil frem for store løfter
- Personer der ønsker ro og klarhed mere end peptalks

Praktisk (kontakt / lokation)
- Klinikadresse: Bakkevej 36, 3460 Birkerød (Rudersdal)
- Telefon: +45 42 80 74 74
- E-mail: jan@gaarsdal.net
- Facebook-gruppe: https://www.facebook.com/groups/1056907644480600
- priser aftales - default 900,- for første behandling og 600,- for de næste
- ofte kan 1-2 behandlinger være nok
- behandlinger der kræver mere end 3 gange skal aftales og betragtes som en transformation snarere end en enkelt problemstilling
`;
