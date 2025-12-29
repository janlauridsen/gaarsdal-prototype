📄 DOC 3 — RMRC · Prompt & Configuration Strategy

Subtitle: Versioned AI Behavior Without Code Drift

Status

Autoritativt styringsdokument.
DOC 3 definerer, hvordan AI-adfærd styres, ændres og analyseres i RMRC – uden at kode bliver bærer af adfærd.

Hvis der opstår konflikt mellem kode og prompt-konfiguration, har dette dokument forrang.

1. Formål

Formålet med DOC 3 er at sikre, at:

al AI-adfærd er eksplicit

adfærd kan ændres uden kodeændringer

ændringer er sporbare og versionsstyrede

RMRC kan analyseres, simuleres og justeres bevidst

ChatGPT (eller anden AI) kan bruges aktivt i design- og analysearbejde uden at påvirke runtime

DOC 3 eksisterer for at forhindre:

spredte prompts

implicit adfærd

kodebåret metode

uigennemsigtig udvikling

2. Grundprincip: Arkitektur > Adfærd > Implementering

RMRC arbejder med en klar prioritering:

Arkitektur (DOC 1, DOC 2, DOC 5)

Adfærd (prompts og konfiguration)

Implementering (kode)

Prompts er adfærdsbærere, ikke implementeringsdetaljer.

Kode må:

eksekvere

route

logge

Kode må ikke:

definere menneskelig holdning

indeholde prompts

skjule metode eller autoritet

3. Problemet med spredte og hardcodede prompts

Spredte prompts fører til:

uigennemsigtig adfærd

utilsigtet metodebrug

manglende sporbarhed

vanskeligt replay

umulig governance

Derfor gælder i RMRC:

Ingen hardcodede prompts i kode.
Ingen implicit prompt-logik i roller.

Hvis en rolle indeholder prompt-tekst, er det et arkitektonisk brud.

4. Prompt som førsteklasses artefakt

I RMRC er en prompt:

et selvstændigt artefakt

versionsstyret

sporbar

bundet til:

én rolle

ét board

én kontekst

En prompt repræsenterer:

sproglig adfærd

menneskelig holdning

etisk ramme

Prompts er ikke “instruktioner til AI” i snæver forstand,
men kontrakter for adfærd inden for RMRC’s arkitektur.

5. Prompt Registry (konceptuelt)

RMRC anvender et centralt Prompt Registry.

Registry’et:

er deklarativt

er read-only i runtime

er versionsstyret

indeholder ingen runtime-logik

Registry’et definerer:

hvilke prompts der findes

hvilken rolle de er bundet til

hvilket board de gælder for

hvilke versioner der er aktive

Registry’et er styringsværktøj, ikke performance-optimering.

6. Prompt-versionering og governance

Hver prompt skal have:

et stabilt promptId

en eksplicit version

en beskrivelse af ændringens intention

Ændringer i prompts er:

arkitektonisk relevante

governance-beslutninger

aldrig trivielle

Prompt-versioner:

må aldrig overskrives

må aldrig ændres retroaktivt

kan deaktiveres, men ikke slettes

Dette sikrer:

fuld sporbarhed

meningsfuld replay

ansvarlig iteration

7. Sammenhæng mellem runtime, prompt og logs

I runtime:

vælges prompts udelukkende via konfiguration

aldrig via kode

aldrig via rollelogik

Logs refererer til:

promptId

promptVersion

roleId

boardId

Logs indeholder aldrig prompt-tekst.

Dette sikrer:

fortrolighed

stabil analyse

mulighed for ekstern revision

8. AI-meta vs. AI-produkt-prompts

RMRC skelner mellem:

8.1 AI-produkt-prompts

Prompts der:

genererer tekst til brugeren

opererer inden for boards

er underlagt DOC 2 og DOC 5

Disse er en del af runtime-adfærd.

8.2 AI-meta-prompts

Prompts der:

bruges til analyse

bruges til design

bruges til simulering og replay

aldrig påvirker runtime direkte

AI-meta-prompts kan anvendes af:

ChatGPT

analyseværktøjer

designprocesser

Men:

deres output er altid forslag

aldrig handling

aldrig automatisk ændring

Dette bevarer menneskelig governance.

9. Prompts som bærere af menneskelig holdning

Prompts i RMRC må – og skal – afspejle:

refleksiv holdning

erfaring uden autoritet

domæne-resonans

metakognitiv mulighed

transparent styring

Prompts må ikke:

udøve skjult autoritet

manipulere refleksion

presse mod konklusion

skjule styring som neutralitet

DOC 5 er normativ reference for al prompt-design.

10. Hvad der eksplicit ikke er konfigurerbart

For at beskytte arkitekturen må følgende aldrig være prompt- eller konfigurationsstyret:

rolle-autoritet

board-typer

rolle-til-board mapping

logging-niveauer

læringsmekanismer i runtime

Disse ændringer kræver:

nye dokumenter

eksplicit governance

versionsmæssige commitpoints

11. Prompt-ændringer som eksperimenter

Ændringer i prompts betragtes som:

eksperimenter

hypoteser

design-afprøvninger

Effekten vurderes via:

logs

replay

sammenlignende analyse

Ikke via:

intuition alene

“bedre svar”

kortsigtet tilfredshed

Dette muliggør langsigtet kvalitativ forbedring.

12. Relation til øvrige dokumenter

DOC 1 → Arkitektur og ontologi

DOC 2 → Roller og boards

DOC 4 → Logging, replay og læring

DOC 5 → Menneskelig og erkendelsesmæssig ramme

DOC 3 forbinder arkitektur og adfærd uden at blande dem.

13. Afsluttende bemærkning

DOC 3 gør RMRC styrbart.

Ikke ved at gøre systemet “klogere”,
men ved at gøre det gennemsigtigt, analysebart og ansvarligt.

Når adfærd er eksplicit, kan den:

diskuteres

kritiseres

forbedres

rulles tilbage

Det er forudsætningen for tillid – både teknisk og menneskelig.

DOC 3 er nu klar til at blive gemt som autoritativt dokument.
