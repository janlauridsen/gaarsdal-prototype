📄 DOC 4 — RMRC · Logging, Replay & Learning Loop

Subtitle: Auditability Without Adaptive Drift

1. Formål

Dette dokument fastlægger RMRC’s logging-, replay- og analysemodel som et ikke-adaptivt, revisionsklart subsystem.

DOC 4 definerer:

hvad systemet logger

hvad systemet eksplicit ikke logger

hvordan data bruges til analyse og iteration

hvordan AI kan inddrages uden at påvirke runtime

hvordan læring sker uden adaptiv drift

Logs er sandhed, ikke feedback.

Hvis der opstår konflikt mellem:

runtime-adfærd og logs
👉 har logs forrang som observationsgrundlag

2. Grundlæggende adskillelse af lag

RMRC adskiller strengt mellem følgende lag:

Lag	Funktion
Runtime	Afvikler dialog
Logging	Registrerer strukturelle fakta
Analyse	Fortolker logs
Governance	Træffer beslutninger

Ingen læring sker i runtime.
Al forbedring sker uden for drift.

3. Hvad en log er i RMRC

En RMRC-log er:

strukturel (ikke semantisk)

deterministisk

ikke-fortolkende

tidsbundet

append-only

Logs beskriver:

hvad systemet gjorde
ikke:
hvorfor det gjorde det

Logs må:

observeres

analyseres

genafspilles

sammenlignes

Logs må aldrig:

ændre systemets adfærd

akkumulere viden i runtime

fungere som implicit hukommelse

4. Log-niveauer (kanonisk)

RMRC logger på fire faste niveauer.

4.1 Session-niveau

Logger:

sessionId

runtimeProfile

configVersion

startTimestamp

endTimestamp

stopReason

Formål
At fastslå hvad der kørte, hvornår og under hvilke rammer.

4.2 Turn-niveau

Logger:

turnIndex

userInputPresent

systemOutputEmitted

silenceEmitted

Formål
At analysere dialogens rytme, tempo og pauser.

4.3 Role-invokation

Logger:

roleId

boardId

promptId

promptVersion

activated

producedOutput (boolean)

Formål
At dokumentere hvilke perspektiver var aktive, uden at kende deres indhold.

4.4 Layer-events

Logger:

layerId

eventType

metadata (strukturel)

Formål
At spore systemets kontrolflow:

konsolidering

linting

legitimitetskontrol

stop-signaler

5. Hvad der eksplicit ikke logges

RMRC logger aldrig:

brugerens rå tekst

AI’ens fulde output (medmindre eksplicit aktiveret i særskilt analyse-mode)

prompt-tekst

psykologiske vurderinger

fortolkninger

score, rating eller kvalitetsmål

Logs er epistemisk beskedne.

6. Replay-begrebet

Replay i RMRC betyder:

At genafspille et tidligere forløb
med samme strukturelle ramme
og kontrollerede variationer.

Replay ændrer aldrig den oprindelige log.

7. Typer af replay
7.1 Struktur-replay

samme session-log

samme boards

samme roller

ingen AI-kald

Formål
At validere determinisme og arkitektonisk konsistens.

7.2 Prompt-replay

samme session-log

ændret promptVersion

AI genererer nyt output

Formål
At isolere adfærdsændringer til prompt-niveau.

7.3 Board-replay

samme session

ændret board- eller role-aktivering

Formål
At teste arkitektoniske ændringer uden drift.

8. AI-assisteret analyse (uden runtime-effekt)

AI-assistenter må bruges til at:

analysere logfiler

identificere mønstre

foreslå ændringer

generere hypotese-tests

sammenligne sessioner

AI-assistenter må ikke:

skrive direkte til runtime

ændre konfiguration

aktivere roller

påvirke næste session automatisk

AI-output er altid forslag, aldrig handling.

Dette sikrer menneskelig governance.

9. Bias- og drift-beskyttelse

For at forhindre akkumulativ bias:

logs slettes aldrig

analyser versionsmærkes

prompt-ændringer spores eksplicit

ingen statistik fødes tilbage til runtime

RMRC kan blive klogere
men kun gennem beslutninger, ikke gennem drift.

10. Governance-loop (formelt)

Den formelle forbedringscyklus er:

Sessioner køres

Logs opsamles

Analyse foretages (evt. AI-assisteret)

Ændringer foreslås

Ændringer vurderes op imod DOC 1–5

Nyt commitpoint oprettes

Nyt runtime testes

Loopet er bevidst langsomt.

11. Logs som datagrundlag for fremtidig funktionalitet

Logs betragtes som:

systemets primære datakilde

grundlag for scripts og visualisering

input til senere AI-analyse

fundament for simpelt UI

UI og tooling er:

sekundære

udskiftelige

ikke bærende for systemets sandhed

12. Designrationale

Dette lag eksisterer for at forhindre:

skjult læring

uigennemsigtig optimering

“smart” men uforklarlig adfærd

systemer ingen kan forklare eller vedligeholde

RMRC vælger:

revision frem for adaptiv optimering

transparens frem for autonomi

ansvarlighed frem for effektivitet

13. Relation til øvrige dokumenter

Arkitektur → DOC 1

Roller & boards → DOC 2

Prompt-strategi → DOC 3

Menneskeligt grundlag → DOC 5

DOC 4 lukker cirklen.
RMRC lærer – men kun uden for drift.

Nyt log-niveau

Continuity Event (non-interpretive)

Loggen må indeholde:

anchor-ID

tidspunkt for aktivering / validering

kilde (bruger / governance)

Loggen må ikke indeholde:

anchor-indhold som fritekst

fortolkninger eller vurderinger

Ved replay:

continuity kan genindlæses

runtime kan afvikles på ny

original continuity ændres aldrig

Dette sikrer:

sporbarhed

sammenlignelighed

ingen baglæns tilpasning
