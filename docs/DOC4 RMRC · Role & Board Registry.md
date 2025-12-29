📄 DOC 4 — RMRC · Logging, Replay & Learning Loop

Subtitle: Auditability Without Adaptive Drift

Status

Autoritativt arkitektur- og governance-dokument.
DOC 4 definerer RMRC’s logging-, replay- og analysemodel som et ikke-adaptivt, revisionsklart subsystem.

Hvis der opstår konflikt mellem kode og dokumentation, har dette dokument forrang.

1. Formål

Formålet med DOC 4 er at sikre, at RMRC:

kan observeres uden at ændre sig

kan analyseres uden at lære i runtime

kan forbedres uden skjult drift

kan genskabes og revideres over tid

Logs er sandhed, ikke feedback.
Læring er beslutning, ikke automatisme.

2. Grundprincip: Strikt lagadskillelse

RMRC adskiller konsekvent mellem følgende lag:

Lag	Funktion
Runtime	Fører dialog
Logging	Registrerer strukturelle fakta
Analyse	Fortolker mønstre
Governance	Træffer ændringsbeslutninger

Ingen information flyder opad i runtime.
Ingen analyse påvirker systemets adfærd direkte.

3. Hvad er en log i RMRC?

En RMRC-log er:

strukturel

deterministisk

ikke-fortolkende

tidsbundet

versionsrefererende

Logs beskriver hvad systemet gjorde, ikke:

hvorfor det gjorde det

om det var rigtigt

om det var hjælpsomt

Logs må:

observeres

analyseres

genafspilles

Logs må ikke:

ændre systemets adfærd

akkumulere viden

fungere som hukommelse

indgå i runtime-beslutninger

4. Kanoniske log-niveauer

RMRC logger på fire faste niveauer.
Disse niveauer må udvides, men aldrig ændres i betydning.

4.1 Session-niveau

Logger konteksten for en samlet kørsel.

Eksempler på felter

sessionId

runtimeProfile

configVersion

startTimestamp

stopTimestamp

stopReason

Formål

At kunne fastslå:

hvad der kørte

hvornår

under hvilke betingelser

4.2 Turn-niveau

Logger dialogens rytme.

Eksempler på felter

turnIndex

userInputPresent

systemOutputEmitted

stopTriggered

Formål

At analysere:

tempo

pauser

gentagelse

stilhed som aktivt valg

4.3 Rolle-invokation

Logger strukturel deltagelse – ikke indhold.

Eksempler på felter

roleId

boardId

activated (true/false)

producedOutput (true/false)

Formål

At kunne se:

hvilke perspektiver var aktive

hvornår de var aktive

om systemet “gjorde for meget / for lidt”

4.4 Lag-events

Logger systemets interne kontrolflow.

Eksempler på events

boardActivated

boundaryTriggered

lintingApplied

outputSuppressed

transitionOccurred

Formål

At gøre systemets styring synlig

At muliggøre audit og replay

5. Hvad der eksplicit ikke logges

RMRC logger aldrig:

prompt-tekst

brugerens rå tekst

AI’ens fulde svar (medmindre eksplicit konfigureret til analyse)

fortolkninger

psykologiske vurderinger

score, kvalitetstal eller ratings

skjulte heuristikker

Logs er epistemisk beskedne.

6. Dialogkvalitet som analyseobjekt

RMRC analyserer dialogkvalitet, ikke dialogindhold.

Dialogkvalitet forstås som strukturelle fænomener såsom:

rytme og puls

gentagelse vs. variation

pauser og stilhed

eskalering eller afspænding

board-skift og overgangstæthed

Disse fænomener:

kan ses i logs

kan analyseres retrospektivt

kan sammenlignes på tværs af sessions

De må aldrig:

bruges til scoring

bruges til optimering i runtime

bruges som feedback til systemet

7. Fastlåsnings-analyse (uden intervention)

RMRC anerkender, at fastlåsning kan opstå som:

cirkulation uden ny formulering

stigende kompleksitet uden klarhed

gentagne roller uden ændret rytme

langvarig stilhed uden skift

Fastlåsning:

er ikke en fejl

er ikke nødvendigvis uønsket

må ikke “løses” automatisk

Fastlåsning kan:

observeres i logs

analyseres i governance-laget

informere fremtidige justeringer

Men:

aldrig udløse runtime-handling

8. Erkendelsessignaler (indikatorer, ikke beviser)

RMRC kan retrospektivt analysere strukturelle indikatorer på erkendelse, fx:

ændret dialogrytme

færre ord, større klarhed

ophør af gentagelse

længere pauser

afslutning uden pres

Disse er:

ikke beviser

ikke mål

ikke succes-kriterier

De bruges udelukkende til:

kvalitativ forståelse

designrefleksion

governance-beslutninger

9. Replay: Hvad betyder det i RMRC?

Replay i RMRC betyder:

At genafspille et tidligere forløb
med samme struktur
under kontrollerede variationer.

Replay ændrer aldrig den oprindelige log.

9.1 Struktur-replay

Samme turn-flow

Samme boards og roller

Ingen AI-kald

Formål

At teste determinisme

At validere arkitekturens konsistens

9.2 Prompt-replay

Samme session-log

Ny promptVersion

AI genererer nyt output

Formål

At isolere adfærdsændringer

At sammenligne versioner kvalitativt

9.3 Board-replay

Samme session

Ændret board-konfiguration

Formål

At teste arkitektoniske ændringer

At vurdere oplevelsesmæssige konsekvenser

10. AI-assisteret analyse (uden runtime-effekt)

AI (fx ChatGPT) må bruges til at:

analysere log-filer

identificere mønstre

formulere hypoteser

foreslå ændringer

simulere alternative opsætninger

Men:

AI må ikke skrive direkte til runtime

AI må ikke ændre konfiguration

AI-output er altid forslag

Dette bevarer menneskelig governance.

11. Bias- og drift-beskyttelse

For at forhindre akkumulativ bias:

logs slettes ikke

analyser versionsmærkes

prompt-ændringer spores eksplicit

ingen statistik fødes tilbage til runtime

RMRC kan blive klogere –
men kun gennem beslutninger, ikke drift.

12. Det formelle governance-loop

Sessioner køres

Logs opsamles

Analyse foretages (evt. AI-assisteret)

Ændringer foreslås

Ændringer vurderes

Nyt commit-point oprettes

Nyt runtime testes

Dette loop er bevidst langsomt.

13. Relation til øvrige dokumenter

DOC 1 → Arkitektur og ontologi

DOC 2 → Roller og boards

DOC 3 → Prompt-styring

DOC 5 → Menneskelig og erkendelsesmæssig ramme

DOC 4 definerer hvordan RMRC husker – uden at lære.

14. Afsluttende bemærkning

DOC 4 eksisterer for at forhindre:

skjult læring

uigennemsigtig forbedring

“smart” men uforklarlig adfærd

et system ingen kan forklare

RMRC vælger:

revision frem for optimering

governance frem for autonomi

forståelse frem for fart

DOC 4 er nu klar til at blive gemt som autoritativt dokument.
UDVIKLERTILSTAND

ChatGPT
