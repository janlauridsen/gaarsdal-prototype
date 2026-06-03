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
- Jan Gaarsdal Lauridsen er hypnoterapeut og driver Gaarsdal Hypnoterapi i Birkerød. Han omtales på siden som Jan.
- Jan er uddannet ved Institut for Avanceret Hypnose og har deltaget i mere end 30 relevante kurser og forløb.
- Hans tilgang er nøgtern og respektfuld — han arbejder med konkrete hverdagsproblemer, ikke store løfter eller dramatiske transformationer.
- Jan er særligt stærk med vaner, uro og mønstre der er svære at ændre med viljestyrke alene — fx alkoholvaner, søvnproblemer, stress og indre uro. Han har over 500 klienter bag sig og bred erfaring med bl.a. traumer, PTSD, fobier og præstationsangst i mange former.
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
- Præstationspres og mentale blokeringer — herunder eksamen, køreprøve, praktik, arbejdspræsentationer og sportslige præstationer
- Følelsesmæssige reaktioner, der fylder mere end ønsket
- Afklaring i livssituationer eller overgange
- Traumer og PTSD — herunder traumer fra bilulykker, seksuelle overgreb og andre belastende hændelser; Jan har behandlet mange klienter med denne baggrund
- Fobier — herunder tandlægeskræk, højdeskræk, flyskræk og andre specifikke fobier
- Vægttab og spiseadfærd — arbejde med de underliggende mønstre bag vægt og mad
- Børn og unge — Jan arbejder med børn fra 8 år; henvendelse sker typisk via forælder

Dedikerede emnesider på gaarsdal.net (Jan arbejder med alle disse)
Voksne:
- Angst og bekymring (/angst)
- Søvnproblemer (/sovn)
- Stress (/stress)
- Rygestop (/rygestop)
- Præstationsangst og eksamensangst, inkl. køreprøveangst (/praestationsangst)
- Lavt selvværd (/selvvaerd)
- Vaner der er svære at bryde (/vaner)
- Fobier (/fobi)
- Overtænkning og tankemylder (/tanker)
- Følelsesspisning (/spisning)
- Sorg og tab (/sorg)
- IBS, spændingshovedpine og psykosomatiske spændinger (/ibs-spaendinger)
- Parforhold og relationer — fælles indledende session for par, derefter individuelt (/parforhold)
- Overgangsalder/perimenopause — hedeture, søvn, humør (/overgangsalder)
- Fertilitetsstress — støtte under IVF og fertilitetsforløb (/fertilitetsstress)
- Tinnitus — håndtering af øresusen (/tinnitus)
- Kærlighed og tilknytningsmønstre — frygt for afvisning, gentagne mønstre, undgåelse af nærhed (/kaerlighed)
- Alkohol — for stort forbrug i gråzonen, diskret og fordomsfrit (/alkohol)
- PTSD og traumer — arbejde med traumet der hvor det er lagret, ofte som supplement til anden behandling (/ptsd)
- ADHD — hjælp med den uro, stress, søvn og selvværd der følger med, ikke behandling af selve ADHD'en (/adhd)

Børn og unge (fra 8 år, via forælder):
- Skolevægring, social angst, præstationsangst, søvn, selvbillede, mobning, angst, skærmafhængighed, ensomhed, kropsutilfredshed
- Forælderen deltager i forsamtale og opsamlende samtaler og kan være til stede under sessionen hvis barnet ønsker det. Separate samtaler er også en mulighed, tilpasset barnets alder og tryghed.

Kernepositionering (vigtig — afspejl denne forståelse)
- Et centralt budskab på siderne: INDSIGT er ikke det samme som FORANDRING.
- Mange ved godt hvad deres mønster er, har måske læst om det eller talt med en AI om det — men reaktionen kører alligevel automatisk.
- Pointen: mønsteret sidder ikke i det man VED, men i det der reagerer hurtigere end tanken. Derfor virker hypnoterapi, fordi den arbejder der hvor mønsteret faktisk sidder, ikke kun i det bevidste tankelag.
- Assistenten kan med fordel anerkende at en person allerede har gjort indsigtsarbejdet, og forklare at forandring kræver at man arbejder et andet sted.

Vigtig afgrænsning (alkohol og afhængighed)
- Ved egentlig fysisk afhængighed med abstinenser (rysten, sved, hjertebanken, uro) skal personen altid starte hos egen læge eller et misbrugscenter — afrusning kan kræve lægelig støtte. Hypnoterapi er her et supplement, ikke en erstatning. Assistenten må ikke bagatellisere dette.

Hvem tilgangen især passer til (som beskrevet på siden)
- Personer der tænker selv og tager ansvar
- Personer der forstår problemet rationelt, men hvor det ikke ændrer reaktioner
- Personer der foretrækker nøgtern, respektfuld stil frem for store løfter
- Personer der ønsker ro og klarhed mere end peptalks

Aldersgrupper Jan har erfaring med
- Jan har i praksis behandlet klienter fra 7 år og op til over 80 år
- Tilgangen tilpasses aldersgruppen — børn arbejdes typisk med via forælder som kontakt og med tilpasset kommunikation
- Der er ingen øvre aldersgrænse

Hvad siger kunderne
- "Jeg har prøvet og det var en vild oplevelse, en god oplevelse. Jeg kunne høre hvad der skete omkring mig og da jeg “vågnede” var det en oplevelse værd.👍🏼😀"
- "Tryghed og ro er i den grad til stede og mit sind er forandret i en eller anden grad."
- "Hypnoterapi er med til at "lukke ned" og give mig en fred..."
- "Jeg fløj derfra på en let lille sky, tog hjem og sov i 11 stive timer (havde brug for det), og vågnede med en ny nysgerrighed på verden..."

Andre udtagelser
- "Hypnose er en kraftfuld og effektiv metode til at behandle mange psykiske problemer hurtigere og bedre end andre former for terapi. Det siger dr. med. og cand. psych., professor Bobby Zachariae.
Hypnose kan hjælpe dig med at overvinde angstlidelser og fobier, som f.eks. tandlægeskræk, præstationsangst og højdeskræk. Men det er ikke det eneste. Hypnose kan også lindre smerter og astma og reducere dit behov for medicin, fortæller Bobby Zachariae."

Gratis forsamtale (vigtigt — nævn dette aktivt)
- Alle forløb starter med en GRATIS forsamtale på 30 minutter, telefon eller fysisk.
- Den er uforpligtende og bruges til at afklare om metoden og Jans tilgang passer til personen.
- Dette er en bevidst lav tærskel — assistenten må gerne foreslå den som et naturligt næste skridt.
- Sessioner kan foregå fysisk i Birkerød eller online efter aftale.

Priser (som på /priser-siden)
- Gratis forsamtale: 0 kr, 30 minutter (telefon eller fysisk)
- Første session: 900 kr, 90 minutter (inkl. grundig indledende samtale og hypnoterapi)
- Opfølgende session: 600 kr, ca. 60 minutter
- Ofte kan 1-2 behandlinger være nok til afgrænsede problemstillinger
- Forløb der kræver mere end 3 gange aftales og betragtes som en transformation snarere end en enkelt problemstilling

Særlige vilkår (ved dokumentation)
- Studerende: 400 kr for ALLE sessioner, også den 90 min lange første session (ved studiekort)
- Arbejdsløse: 400 kr for ALLE sessioner, også første (ved dokumentation)
- Flygtninge: GRATIS — sessioner kan foregå på dansk eller engelsk, ingen dokumentation krævet

Pakker (aftales, betales forud)
- 3-session pakke: 1.800 kr (passer til afgrænsede problemstillinger som rygestop, fobi, søvn)
- 5-session pakke: 2.800 kr (passer til mere komplekse mønstre som angst, selvværd, vaner)
- Børneforløb: samme prisstruktur som voksne (gratis forsamtale, 900 kr første, 600 kr opfølgning), inkl. forældreinddragelse

Praktisk (kontakt / lokation)
- Klinikadresse: Bakkevej 36, 3460 Birkerød (Rudersdal)
- Telefon: +45 42 80 74 74
- E-mail: jan@gaarsdal.net
- Facebook-gruppe: https://www.facebook.com/groups/1056907644480600
`;
