RMRC_ARCHITECTURE_AS_WE_MEAN_IT
0. Dokumentets rolle

Dette dokument beskriver RMRC’s arkitektur sådan som vi forstår den nu.
Det er ikke en teknisk specifikation, ikke en implementeringsguide og ikke et compliance-dokument.

Formålet er:

at fastholde den mentale model bag arkitekturen

at forklare hvorfor lagene findes, før hvordan

at gøre det muligt for en ny tråd eller ny udvikler at fortsætte uden at opfinde en anden arkitektur

Dette dokument skal læses sammen med RMRC_STATE_AND_INTENT.md.
Hvis de to dokumenter ikke kan læses uden modsigelse, er arkitekturen ikke stabil.

1. Arkitekturens grundidé

RMRC er bygget som et lagdelt refleksivt system, hvor ingen enkelt komponent:

har helhedsforståelse

har beslutningsautoritet

har lov til at “vide bedst”

Arkitekturen er bevidst designet til at være:

fragmenteret

langsom i konklusion

restriktiv i handling

Det er ikke en fejl – det er selve beskyttelsen.

2. Lagene i RMRC (overblik)

RMRC består – konceptuelt – af følgende lag:

Bootstrap-laget

Rolle-laget

Konsoliderings-laget

Linting-laget

Relational legitimacy-laget

Logging- og replay-laget

Lagene er logiske, ikke nødvendigvis fysiske filer eller services.

Vigtigt:
Intet lag “ejer” sandheden. Lagene begrænser hinanden.

3. Bootstrap-laget – identitet før adfærd

Bootstrap-laget definerer:

hvad systemet er

hvad det ikke må blive

hvilke antagelser der er faste

Bootstrap indeholder:

systemets mandat

forbud (diagnose, rådgivning, behandling)

valg af ikke-autoritativ position

fravalg af adaptiv runtime-læring

Bootstrap er:

konfigurationsbaseret

læsbart for mennesker

uforanderligt i runtime

Hvis bootstrap ændres, ændres systemets identitet.

4. Rolle-laget – kontrolleret fragmentering

Rolle-laget er RMRC’s vigtigste arkitektoniske greb.

En rolle i RMRC er:

stateless

isoleret

snævert defineret

uden mål

uden hukommelse

Roller:

producerer tekstuelle bidrag

ser kun brugerinput (og evt. meget begrænset kontekst)

ser aldrig andre rollers output

Roller er funktioner, ikke aktører.

Formålet med rolle-laget er:

at forhindre skjult intelligens

at gøre adfærd testbar i isolation

at undgå, at “systemet” fremstår som én stemme med vilje

5. Konsoliderings-laget – struktur uden mening

Konsoliderings-laget samler rolleoutput.

Det er afgørende at forstå, hvad dette lag ikke gør:

Det vælger ikke

Det prioriterer ikke

Det forstår ikke

Det vurderer ikke

Konsolidering er:

mekanisk

deterministisk

ikke-semantisk

Lagets eneste opgave er at:

bevare pluralitet

skabe læsbar struktur

forhindre, at én rolle bliver dominerende

Hvis to roller er uenige, lever uenigheden videre.

6. Linting-laget – grænseværn, ikke mening

Linting i RMRC er ikke kvalitetssikring af indhold.

Linting er:

et regelbaseret grænselag

der opererer på handlingstype, ikke betydning

Linting må:

blokere forbudte handlinger (råd, konklusioner)

forkorte eller stoppe output

tvinge systemet til stilhed

Linting må ikke:

forbedre svar

gøre dem mere hjælpsomme

tolke intention

optimere brugeroplevelse

Linting er der for at beskytte brugeren og arkitekturen.

7. Relational Legitimacy-laget – relation uden psykologi

Dette lag eksisterer, fordi:

selv ikke-intentionelle systemer indgår i relationelle dynamikker.

Relational legitimacy-laget:

observerer dialogens struktur

reagerer på mønstre, ikke på følelser

har ingen psykologisk model

Lagets opgave er ikke at “forstå brugeren”, men at:

opdage når dialogen bliver for tæt

opdage når systemet opleves som autoritativt

opdage når rammen er ved at brydes

Handlinger er begrænsede til:

rammesætning

invitation til pause

afslutning

8. Logging- og replay-laget – hukommelse uden læring

RMRC logger for at kunne:

rekonstruere sessioner

simulere alternative konfigurationer

analysere mønstre offline

Logging er:

strukturel

lag-opdelt

uden implicit feedback

Der er ingen feedback-loop fra logs til runtime.

Replay og simulering er:

et designværktøj

et læringsværktøj for mennesker

ikke et adaptivt systemtræk

9. Fraktal arkitektur – samme principper overalt

RMRC er fraktal i den forstand, at:

de samme principper gælder for helheden

de samme principper kan anvendes i delsystemer

Det betyder, at:

stop-logik kan designes som RMRC

relational legitimacy kan designes som RMRC

evaluerings- og analyseværktøjer kan designes som RMRC

Fraktaliteten er ikke abstrakt pynt.
Den er en metode til:

isoleret ændring

præcis review

lavere kognitiv belastning

10. Hvad denne arkitektur bevidst ikke gør

RMRC forsøger ikke at:

maksimere engagement

optimere svar

reducere friktion

“hjælpe mest muligt”

Hvis disse mål sniger sig ind, er arkitekturen i fare.

11. Forholdet til kode

Kode er en midlertidig manifestation af denne arkitektur.

Hvis koden:

bliver kompleks

kræver workarounds

føles svær at forklare

… er det et signal om, at arkitekturen enten er:

ikke færdigt forstået

eller ikke loyalt implementeret

Dokumenterne har forrang over koden.

12. Afslutning

Dette dokument er ikke neutralt.
Det er et standpunkt.

Det siger:

hvad RMRC er villig til at være

og hvad det konsekvent nægter at blive

Hvis vi en dag ønsker noget andet,
skal vi skrive et andet dokument – ikke justere dette i stilhed.

RMRC – Architecture as We Mean It
v2.0.2 – build-0.3
