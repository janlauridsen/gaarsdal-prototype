RMRC · Logging, Replay & Learning Loop

Auditability Without Adaptation

1. Formål og status

Dette dokument fastlægger RMRC’s logging- og analysemodel som et ikke-adaptivt, revisionsklart subsystem.

Det definerer:

hvad der logges

hvad der eksplicit ikke logges

hvordan logs bruges til læring og iteration

hvordan AI kan inddrages i analyse uden at påvirke runtime

hvordan replay og retest fungerer

Logs er sandhed, ikke feedback.

Dette dokument er autorativt for al logging i RMRC.

2. Grundprincip

RMRC adskiller strengt mellem:

Lag	Funktion
Runtime	Fører dialog
Logging	Registrerer fakta
Analyse	Fortolker logs
Governance	Træffer beslutninger

Ingen læring sker i runtime.
Al forbedring sker udenfor systemets drift.

3. Hvad er en log i RMRC?

En RMRC-log er:

strukturel

deterministisk

ikke-fortolkende

tidsbundet

Logs beskriver hvad systemet gjorde, ikke hvorfor.

Logs må:

observeres

analyseres

genafspilles

Logs må ikke:

ændre systemets adfærd

akkumulere viden

danne implicit hukommelse

4. Log-niveauer (kanonisk)

RMRC logger på fire niveauer:

4.1 Session-niveau

sessionId

runtimeProfile

configVersion

start / stop

stopReason

Formål:
At fastslå hvad der kørte, og hvornår det stoppede.

4.2 Turn-niveau

turnIndex

userInputPresent

systemOutputEmitted

stopTriggered

Formål:
At kunne analysere dialogens rytme og progression.

4.3 Role-invokation

roleId

activated

producedOutput

Formål:
At dokumentere hvilke roller der deltog – uden at kende deres indhold.

4.4 Layer-events

layerId

event (strukturel beskrivelse)

Formål:
At spore systemets interne kontrolflow (konsolidering, linting, legitimitet).

5. Hvad logges eksplicit ikke

RMRC logger aldrig:

prompt-tekst

brugerens rå tekst

AI’ens fulde svar (medmindre eksplicit konfigureret)

psykologiske vurderinger

fortolkninger

score eller kvalitetstal

Logs er epistemisk beskedne.

6. Replay: Hvad betyder det?

Replay i RMRC betyder:

At genafspille et tidligere session-forløb
med samme struktur, men kontrollerede variationer.

Replay kan ske med:

samme prompts (validering)

ændrede prompts (retest)

ændrede runtime-profiler

ændrede roller aktiveret/deaktiveret

Replay ændrer ikke den oprindelige log.

7. Replay-typer
7.1 Struktur-replay

samme turn-flow

samme roller

ingen AI-kald

Formål:
At teste systemets determinisme.

7.2 Prompt-replay

samme session-log

ny promptVersion

AI genererer nyt output

Formål:
At vurdere ændringer i adfærd isoleret til prompt.

7.3 Board-replay

samme session

ændret board-konfiguration

Formål:
At teste arkitektoniske ændringer.

8. AI-assisteret analyse (uden runtime-effekt)

ChatGPT (eller anden AI) må bruges til:

at analysere log-filer

identificere mønstre

foreslå ændringer

generere hypotese-tests

Men:

AI må ikke skrive direkte til runtime

AI må ikke ændre konfiguration

AI-output er altid forslag, aldrig handling

Dette bevarer menneskelig governance.

9. Bias- og drift-beskyttelse

For at undgå akkumulativ bias:

logs nulstilles aldrig

analyser versionsmærkes

prompt-ændringer spores eksplicit

ingen statistik fødes tilbage til runtime

RMRC kan blive klogere –
men kun gennem beslutninger, ikke gennem drift.

10. Governance-loop (formelt)

Sessioner køres

Logs opsamles

Analyse foretages (evt. AI-assisteret)

Ændringer foreslås

Ændringer vurderes

Nyt commitpoint oprettes

Nyt runtime testes

Dette loop er bevidst langsomt.

11. Forhold til Prompt Registry (DOC 3)

Logs refererer til:

promptId

promptVersion

roleId

boardId

Logs indeholder ingen prompt-indhold.

Dette sikrer:

fortrolighed

konsistens

mulighed for ekstern analyse

12. Designrationale

Dette lag eksisterer for at forhindre:

skjult læring

uigennemsigtig forbedring

“smart” men uforudsigelig adfærd

et system ingen kan forklare

RMRC vælger revision frem for adaptiv optimering.

13. Relation til øvrige dokumenter

Systemontologi → DOC 1

Roller & Boards → DOC 2

Prompt Registry → DOC 3

Dette dokument definerer hvordan RMRC husker – uden at lære.

Status

DOC 4 er færdigt og lukker snapshot-sættet.

Du har nu:

et samlet arkitektonisk sprog

et kontrolleret konfigurationslag

et robust logging-fundament

en klar vej til AI-assisteret iteration uden kaos
