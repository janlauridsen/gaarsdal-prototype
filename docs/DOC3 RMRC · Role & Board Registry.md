📄 DOC 3 — RMRC · Prompt & Configuration Strategy

Subtitle: Versioned Behavior Without Code Drift

1. Formål

Dette dokument fastlægger, hvordan AI-adfærd styres, ændres og analyseres i RMRC.

DOC 3 sikrer:

at adfærd kan ændres uden kodeændringer

at prompts er centrale, sporbare artefakter

at ændringer kan analyseres og rulles tilbage

at AI-assistenter kan bruges aktivt uden at skabe drift

Hvis der opstår konflikt mellem:

kode og prompts
👉 har prompts forrang

Hvis der opstår konflikt mellem:

prompts og DOC 1, 2 eller 5
👉 har dokumenterne forrang

2. Grundprincip

I RMRC gælder følgende faste princip:

Kode definerer struktur.
Prompts definerer adfærd.

Derfor:

indeholder runtime-kode ingen adfærdsbeskrivelser

indeholder roller ingen hardcoded prompts

foretages adfærdsændringer aldrig via kode

Prompts behandles som:

førsteklasses konfigurationsartefakter

versionsstyrede tekster

genstand for analyse og governance

3. Central Prompt Registry (konceptuelt)

RMRC anvender et centralt prompt-registry.

Registry’et:

er read-only i runtime

indeholder alle aktive prompts

er den eneste kilde til AI-adfærd

Et prompt identificeres altid ved:

promptId

promptVersion (implicit eller eksplicit)

Eksempel:

mirror_v1
context_holder_v1
boundary_guardian_v1


Ingen prompt må eksistere:

skjult i kode

duplikeret i flere versioner uden eksplicit versionsskift

uden at kunne spores i logs

4. Runtime-prompts vs. reference-prompts

RMRC skelner mellem to typer prompts:

4.1 Runtime-prompts

bruges direkte i systemets drift

er bevidst snævre og konservative

ændres sjældent

prioriterer stabilitet over finesse

4.2 Reference- / analyse-prompts

bruges til analyse, simulation og redesign

kan være længere og mere eksplicitte

bruges af mennesker og AI-assistenter

påvirker ikke runtime direkte

Denne adskillelse er afgørende for:

lav kompleksitet i drift

høj fleksibilitet i udvikling

5. Prompt-versionering

Alle prompts er versionsmærkede.

Versionering:

er semantisk, ikke automatisk

ændres kun ved bevidst beslutning

dokumenteres via commitpoints

Eksempel:

mirror_v1 → stabil, neutral spejling

mirror_v2 → ændret tone eller præcision

Ældre versioner:

slettes ikke

arkiveres som reference

kan bruges i replay og sammenlignende test

6. Sammenhæng mellem runtime, prompts og logs

I RMRC gælder:

runtime ved, hvilken prompt der bruges

logs registrerer:

promptId

promptVersion

roleId

boardId

Logs indeholder:

aldrig prompt-tekst

aldrig AI-output som feedback

aldrig fortolkning

Dette gør det muligt at:

analysere adfærd over tid

sammenligne før/efter ændringer

bruge AI til meta-analyse uden drift

7. Brug af AI-assistenter i prompt-arbejde

AI-assistenter (fx ChatGPT) må bruges til:

at analysere prompts

at foreslå ændringer

at identificere overlap og huller

at simulere dialogforløb

at foreslå nye versioner

AI-assistenter må ikke:

skrive direkte til runtime

ændre registry automatisk

introducere nye roller eller boards

Alle AI-forslag er:

hypotetiske

menneskegodkendte

dokumenterede

8. Ændringsdisciplin (vigtig)

Ændringer i prompts sker efter denne rækkefølge:

Oplevet behov (simulation / dialog)

Analyse op imod DOC 1, 2 og 5

Justering af prompt-tekst

Versionsskift (nyt promptId)

Test via simulation eller begrænset runtime

Analyse af logs

Nyt commitpoint

Spring i denne rækkefølge betragtes som teknisk gæld.

9. Hvad der eksplicit ikke er konfigurerbart

Følgende må aldrig styres via prompts:

systemets arkitektur

hvilke roller der findes

hvilke boards der eksisterer

aktiveringsregler for boards

logging-struktur

Disse ændres kun via:

arkitektoniske dokumenter

eksplicit governance

10. Designrationale

Denne strategi eksisterer for at forhindre:

spredte prompts

skjult adfærd

uigennemsigtige ændringer

“smart” men uforklarlig AI-opførsel

RMRC vælger:

stabilitet over finesse

transparens over adaptiv intelligens

governance over autonomi

11. Relation til øvrige dokumenter

Arkitektur → DOC 1

Roller & boards → DOC 2

Logging & replay → DOC 4

Menneskeligt grundlag → DOC 5

DOC 3 fastlægger, hvordan RMRC taler –
og hvordan vi ændrer det uden at miste kontrollen.
