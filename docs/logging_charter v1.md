📘 Logging Charter – Gaarsdal AI-assistent
Formål

Dette dokument beskriver, hvad der logges, hvorfor det logges, og hvad det ikke må bruges til, i forbindelse med test og udvikling af AI-assistenten på gaarsdal.net.

Formålet med logging er udelukkende:

at forbedre kvalitet, stabilitet og samtaleflow

at evaluere AI’ens svar på et overordnet niveau

at identificere gentagelser, uklarheder og fejl

Logging anvendes ikke til:

behandling, rådgivning eller vurdering af brugere

profilering eller adfærdsanalyse på individniveau

markedsføring eller salgsformål

Faseinddeling
🔹 FASE 0 – Test & kvalitetsudvikling (nuværende)

I denne fase accepteres udvidet logging for at muliggøre læring og iteration.

Der kan logges:

session-id (teknisk)

starttidspunkt for session

brugerens IP-adresse

user agent (browser/enhed)

fulde brugerbeskeder

fulde AI-svar

tidsstempler pr. besked

Karakteristika:

data bruges internt

ingen automatiserede beslutninger

manuel gennemgang og evaluering

ingen deling med tredjeparter (ud over teknisk infrastruktur)

Denne fase er midlertidig.

🔹 FASE 1 – Begrænset drift (fremtidig)

Når systemet anvendes mere stabilt, reduceres datamængden.

Typiske ændringer:

IP-adresser trunkeres eller hashes

indholdslogning begrænses eller samples

retention fastsættes (fx 14–30 dage)

tydelig information på websitet om brug af AI og testdata

Formålet er fortsat kvalitet og stabilitet – ikke analyse af personer.

🔹 FASE 2 – Privatlivsminimeret drift (end-state)

Her anvendes kun aggregerede og tekniske data.

Der kan logges:

antal sessioner

sessionsvarighed

fejltyper

overordnede emnekategorier (uden rå tekst)

Der logges ikke:

IP-adresser

rå brugerbeskeder

AI-svar

sammenhængende sessionforløb

Grundprincipper (gælder alle faser)

Logging må aldrig bruges til at drage konklusioner om enkeltpersoner

Data må aldrig bruges til at vurdere behov, helbred eller tilstand

AI-assistenten er ikke terapi og logger ikke med terapeutisk formål

Indhold behandles som potentielt følsomt – også når brugeren ikke selv opfatter det sådan

Logging kan reduceres eller slås fra via konfiguration (environment variables)

Bevidste fravalg

Systemet:

foretager ingen automatisk scoring af brugere

foretager ingen risikovurdering baseret på historik

opbygger ingen brugerprofiler

genbruger ikke samtaler på tværs af sessioner

Revision

Dette dokument revideres, når:

logging-niveau ændres

systemet går i en ny fase

AI-arkitektur eller formål ændres væsentligt

Status

Nuværende fase: FASE 0 – Test & kvalitetsudvikling
Dokumentets rolle: Intern rettesnor og fælles forståelse
