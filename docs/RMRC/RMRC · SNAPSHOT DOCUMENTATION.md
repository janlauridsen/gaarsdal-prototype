RMRC · SNAPSHOT DOCUMENTATION

Status: Stabiliseringspunkt – før videre implementering

0. Formål med snapshot

Dette dokument fastfryser den fælles forståelse af RMRC-arkitekturen, arbejdsformen og næste strategiske skridt.

Det fungerer som:

internt commit point

design rationale

genstartsdokumentation for AI-assistance

beskyttelse mod konteksttab

1. Overordnet beslutning (låst)

RMRC videreudvikles som et genetisk, domæne-agnostisk system

Domæner (fx hypnoterapi) implementeres senere som konfigurerbare overlays

Der bygges én chatbot med state/context-switch, ikke flere bots

Runtime holdes så tynd som muligt

Log + admin UI er primær verifikation, ikke dialogoplevelsen

2. Arkitektonisk lagdeling (autorativ)

RMRC består af fire adskilte lag:

2.1 RMRC Core (genetisk)

Rolletyper (Spejler, Observatør, Afgrænser, Navigatør m.fl.)

Ikke-direktiv, ikke-konkluderende epistemologi

Fast pipeline

Governance + linting

Bootstrap-model

➡️ Core er domæneblind og ændres sjældent.

2.2 Domain Overlay (konfiguration)

Ændrer rolleprompt-tekst, ikke roller

Justerer:

sprog

følsomheder

terminologi

opmærksomhedsfelter

Må ikke:

ændre pipeline

ændre epistemisk stance

introducere behandling, rådgivning eller mål

➡️ Overlays kan instansieres dynamisk mellem sessioner.

2.3 Session Layer (runtime)

Brugervendt dialog

Ingen evaluering

Ingen konklusion

Ingen feedback om “succes”

Write-only logging

➡️ Sessionen påvirker kun loggen, ikke systemets struktur.

2.4 Epistemic Witness Layer (EWL)

Post-session, ikke-brugervendt

Læser session-logs

Formulerer:

vidneudsagn

arbejdshypoteser

erkendelsessnapshots

Bruger evt. domænespecifikke ekspert-roller

Påvirker aldrig runtime eller brugeren

➡️ EWL bruges til:

model-læring

gap-analyse

overlay-forbedring

governance-justering

3. Centrale arkitekturprincipper (låst)

Kode er container – ikke system

Tekst + konfiguration er primær intelligens

Alt der ikke kan ses i loggen, eksisterer ikke

Ingen selv-modifikation

Ingen adaptiv tuning i runtime

State-skift må kun ske ved eksplicitte systemhændelser (fx session afslutning)

4. Arbejdsform (bevidst valgt)

Iteration sker primært via:

ChatGPT-dialog

tekstuelle snapshots

GitHub bruges som:

stabil container

versionering af snapshots

Hyppige commits er forventet

Refactor undgås → komponent/lego-tilgang foretrækkes

Branching bruges til at beskytte erkendelse, ikke features

5. Logging-strategi (nuværende fokus)
5.1 Beslutning

Loggen er primær sandhed

Admin UI bruges til:

langsom, manuel læsning

én session ad gangen

Analyse og rapporter sker:

batch/script-orienteret

uden UI-kompleksitet

5.2 Krav til fremtidig log (erkendt, ikke implementeret)

Logs skal kunne vise:

session-id

turn-id

lag (core / overlay / session / EWL)

rolle

state/regime

AI-kald:

input

output

parametre

tidssekvens

➡️ Dette er erkendt behov, ikke implementeret endnu.

6. Beslutning om kodebasen

Repo forkastes ikke

Repo betragtes som runtime-container

Ikke-relevant logik (screening, evaluering) skal på sigt ud

Ingen v2-rewrite nu

Udvikling sker ved:

isolering

konfiguration

gradvis komponentisering

7. Nuværende status

Arkitektur: stabiliseret

Arbejdsform: afklaret

Logging: identificeret som næste flaskehals

Test: pauset

Fokus: struktur før funktionalitet

8. Hvordan snapshot bruges fremadrettet

Snapshot gemmes i repo

Nye snapshots oprettes ved større erkendelser

Snapshot deles med ChatGPT ved genstart:

“Dette er gældende snapshot – fortsæt herfra”

Ældre snapshots bruges til rollback af forståelse

9. Kort design-statement (essens)

RMRC er et genetisk refleksionssystem,
hvor erkendelse opstår i dialog,
men forståelse og læring sker gennem logs og vidneskab.

✅ Bekræftelse

Du kan trygt:

branche i GitHub

bede mig lave nye snapshots

bruge snapshots som internt commit-system

Jeg kan arbejde videre konsistent, så længe:

snapshot er delt

ændringer sker eksplicit
