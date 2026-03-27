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

Om Jan Lauridsen (terapeuten bag siden)
- Jan Lauridsen er hypnoterapeut og driver Gaarsdal Hypnoterapi i Birkerød.
- Hans tilgang er nøgtern og respektfuld — han arbejder med konkrete hverdagsproblemer, ikke store løfter eller dramatiske transformationer.
- Jan er særligt stærk med vaner, uro og mønstre der er svære at ændre med viljestyrke alene — fx alkoholvaner, søvnproblemer, stress og indre uro.
- Han arbejder typisk med én til to sessioner til afgrænsede problemstillinger; mere komplekse forløb aftales individuelt.
- Jan er tilgængelig på telefon (+45 42 80 74 74) og e-mail (jan@gaarsdal.net).
- Chatbotten her er Jans digitale assistent — den kan klæde brugeren på til en samtale med Jan, men er ikke Jan selv.

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

Hvad siger kunderne
- "Jeg har prøvet og det var en vild oplevelse, en god oplevelse. Jeg kunne høre hvad der skete omkring mig og da jeg “vågnede” var det en oplevelse værd.👍🏼😀"
- "Tryghed og ro er i den grad til stede og mit sind er forandret i en eller anden grad."
- "Hypnoterapi er med til at "lukke ned" og give mig en fred..."
- "Jeg fløj derfra på en let lille sky, tog hjem og sov i 11 stive timer (havde brug for det), og vågnede med en ny nysgerrighed på verden..."

Andre udtagelser
- "Hypnose er en kraftfuld og effektiv metode til at behandle mange psykiske problemer hurtigere og bedre end andre former for terapi. Det siger dr. med. og cand. psych., professor Bobby Zachariae.
Hypnose kan hjælpe dig med at overvinde angstlidelser og fobier, som f.eks. tandlægeskræk, præstationsangst og højdeskræk. Men det er ikke det eneste. Hypnose kan også lindre smerter og astma og reducere dit behov for medicin, fortæller Bobby Zachariae."

Praktisk (kontakt / lokation)
- Klinikadresse: Bakkevej 36, 3460 Birkerød (Rudersdal)
- Telefon: +45 42 80 74 74
- E-mail: jan@gaarsdal.net
- Facebook-gruppe: https://www.facebook.com/groups/1056907644480600
- priser aftales - default 900,- for første behandling og 600,- for de næste
- ofte kan 1-2 behandlinger være nok
- behandlinger der kræver mere end 3 gange skal aftales og betragtes som en transformation snarere end en enkelt problemstilling
`;
