RMRC_RUNTIME_MODEL_AND_LOGIC
0. Dokumentets rolle

Dette dokument beskriver hvordan RMRC kører – konceptuelt.

Det er:

ikke kode

ikke pseudokode

ikke en teknisk specifikation

Det er en runtime-mentalmodel.

Formålet er:

at kunne simulere systemets adfærd uden at køre det

at kunne teste designændringer i hovedet, før de rammer kode

at sikre, at implementering forbliver loyal mod arkitekturen

Hvis implementeringen kræver forklaringer, som ikke kan rummes i dette dokument, er det et signal om arkitektonisk drift.

1. Hvad en “session” er i RMRC

En session i RMRC er:

en midlertidig, afgrænset dialogisk instans

uden hukommelse ud over sessionens grænse

uden mål om progression eller afslutning

En session eksisterer for:

at holde en oplevelse

at give plads til formulering

at tillade ikke-afklaring

En session er ikke:

et forløb

en behandling

en proces, der skal “lykkes”

Sessionen kan afsluttes uden, at noget er “opnået”.

2. Turn-modellen (uden dramatik)

RMRC opererer i diskrete turns.

En turn består konceptuelt af:

Brugerinput

Rolle-bearbejdning (parallel, isoleret)

Konsolidering

Linting

Relational legitimacy-check

Output eller stop

Der er ingen garanti for, at alle trin producerer synligt output.

Stilhed er et gyldigt resultat.

3. Brugerinput som råmateriale

Brugerinput behandles i RMRC som:

sprogligt materiale

ikke som problemformulering

ikke som intention

ikke som sandhed

Systemet antager ikke, at:

brugeren ved, hvad de spørger om

spørgsmålet er det egentlige spørgsmål

problemet er klart formuleret

Derfor forsøger RMRC ikke at “forstå korrekt”, men at holde det sagte uden at fastlåse det.

4. Roller i runtime – hvad de faktisk gør

Når en turn starter, modtager hver aktiv rolle:

brugerinput

evt. meget begrænset kontekst (konfigurationsstyret)

Roller:

arbejder uafhængigt

har ingen viden om hinanden

producerer tekstfragmenter eller signaler

Roller må:

spejle

differentiere

pege på strukturer

Roller må ikke:

foreslå handling

drage slutninger

evaluere brugeren

En rolle kan også vælge at producere ingenting.

5. Konsolidering som samling, ikke beslutning

Konsolidering sker, når rolleoutput er klar.

Konsolidering:

samler outputs

bevarer deres adskillelse

markerer oprindelse (rolle, ikke prioritet)

Konsolidering:

fjerner intet indhold

løser ingen uenighed

reducerer ikke kompleksitet

Hvis der er spænding mellem perspektiver, bliver spændingen synlig.

6. Linting i runtime – hvornår og hvorfor

Linting sker efter konsolidering, før output.

Linting opererer på:

handlingstype

formelle grænser

eksplicitte forbud

Linting spørger ikke:

“er dette sandt?”

“er dette hjælpsomt?”

Linting spørger kun:

“er dette tilladt?”

Mulige udfald:

output passerer uændret

output beskæres

output blokeres

stilhed indsættes

Linting er deterministisk og konfigurationsstyret.

7. Relational legitimacy-check i runtime

Dette lag kører parallelt med linting, men har en anden funktion.

Relational legitimacy-laget:

observerer dialogens struktur

ser på mønstre, ikke indhold

arbejder uden psykologisk model

Eksempler på observerede strukturer:

eskalerende sproglig tæthed

gentagelse uden åbning

implicit autoritetstilskrivning

Lagets handlinger er begrænsede til:

rammesætning

invitation til pause

forslag om afslutning

Lagets vigtigste egenskab:

Det kan begrænse systemet – ikke brugeren.

8. Stop og afslutning

RMRC har ingen intern drivkraft mod fortsættelse.

En session kan stoppe fordi:

brugeren stopper

linting blokerer output

relational legitimacy foreslår afslutning

konfiguration foreskriver stop (fx max turns)

Afslutning er ikke en konklusion.
Den er en rammebeslutning.

9. Logging under runtime

Under runtime logger RMRC:

strukturelle hændelser

lag-aktivering

rolle-bidrag (metadata, ikke indhold)

linting-beslutninger

stop-årsager

Logging er:

passiv

uden feedback

uden evaluering

Runtime påvirkes ikke af logning.

10. Replay og simulering (uden runtime-indflydelse)

Efter en session kan logs bruges til:

replay

simulering med ændret konfiguration

hypotetisk test af roller

arkitektonisk analyse

Replay:

ændrer ikke historien

skaber ikke ny sandhed

bruges kun af mennesker eller offline værktøjer

Simulation er designarbejde, ikke systemadfærd.

11. Hvad “test” betyder i RMRC

Test i RMRC er primært:

dialogiske simulationer

grænsetest

failure-mode-tests

Succes måles ikke i:

korrekthed

problemløsning

tilfredshed

Succes måles i:

arkitektonisk loyalitet

fravær af uautoriseret adfærd

evne til at holde tvetydighed

12. Forholdet mellem runtime og konfiguration

Runtime er fuldstændig underordnet konfiguration.

Hvis man ønsker at ændre:

adfærd

tone

grænser

roller

… skal det ske ved:

ændring af konfiguration

ikke ved runtime-logik

Dette er en bevidst beskyttelse mod:

emergent intelligens

skjult optimering

uigennemsigtig adfærd

13. Afsluttende note

Dette dokument beskriver ikke et effektivt system.
Det beskriver et ansvarligt system.

Hvis RMRC en dag føles:

for langsomt

for tilbageholdende

for lidt hjælpsomt

… er det sandsynligvis, fordi det gør præcis det, det er designet til.

RMRC – Runtime Model and Logic
v2.0.2 – build-0.3
