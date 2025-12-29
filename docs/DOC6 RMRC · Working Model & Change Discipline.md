📄 DOC 6 — RMRC · Working Model & Change Discipline

Subtitle: How Humans and AI Collaborate Without Losing Control

1. Formål

Dette dokument fastlægger arbejdsformen omkring RMRC.

DOC 6 beskriver:

hvordan systemet videreudvikles i praksis

hvordan ændringer identificeres, vurderes og placeres korrekt

hvordan AI-assistenter bruges som sparringspartnere uden at skabe drift

hvordan kompleksitet holdes lav over tid

Dokumentet er:

operationelt

normativt

rettet mod systemejer + AI-assistent i fællesskab

Hvis der opstår konflikt mellem:

fremdrift og forståelse
👉 har forståelse forrang

2. Grundantagelse

RMRC er et system, der:

skal kunne forstås i sin helhed

skal kunne forklares til en AI uden skjult kontekst

skal kunne ændres uden kaskadeeffekter

skal kunne pauses og genoptages uden tab af viden

Derfor prioriteres:

få, stærke artefakter

tydelige beslutningspunkter

lav ændringsfrekvens

høj forklarbarhed

3. De primære artefakter (sandhedslag)

RMRC arbejder med følgende hierarki af sandhed:

DOC 1–6
→ Arkitektur, menneskesyn, roller, prompts, logs, arbejdsform

Prompt-samling
→ Faktisk adfærd

Logs
→ Observationsdata

Kode
→ Afviklingsmekanisme

UI / tooling
→ Hjælpemidler

Hvis artefakter er i konflikt:
👉 øverste lag har forrang

4. Hvordan AI-assistenter bruges

AI-assistenter (fx ChatGPT) bruges som:

analytiker

simulator

kritisk sparringspartner

forslagsgenerator

AI-assistenter bruges ikke som:

autonom udvikler

beslutningstager

sandhedsinstans

AI-assistenter må:

analysere dokumenter

sammenholde artefakter

pege på inkonsistens

foreslå ændringer

AI-assistenter må aldrig:

ændre systemet direkte

introducere skjulte antagelser

optimere uden eksplicit mål

5. Ændringstyper og hvor de hører hjemme

Alle ændringer kan klassificeres i én af disse kategorier:

5.1 Oplevelsesændring

Symptom:
“Det føles forkert / for hurtigt / for klogt / for tomt”

Placering:
→ DOC 5
→ prompts

Ingen kodeændring

5.2 Rolle- eller stemmeproblemer

Symptom:
“Roller overlapper”
“Stemmerne flyder sammen”

Placering:
→ DOC 2
→ prompts

5.3 Adfærdsjustering

Symptom:
“Den gør noget, men på forkert måde”

Placering:
→ DOC 3
→ prompt-version

5.4 Struktur- eller flow-problem

Symptom:
“Systemet gør for meget / for lidt”
“Forkert rækkefølge”

Placering:
→ DOC 1
→ board-/rolle-aktivering

5.5 Manglende indsigt

Symptom:
“Vi ved ikke nok om, hvad der sker”

Placering:
→ DOC 4
→ logging (struktur, ikke indhold)

6. Standard-arbejdsgang (den anbefalede)

Den normale arbejdsgang er:

Oplev (simulation, dialog, tekst)

Navngiv problemet (hvad føles forkert?)

Klassificér ændringen (5.1–5.5)

Justér ét artefakt

Commit

Pause

Først derefter: ny ændring

Spring i denne rækkefølge skaber kompleksitet.

7. Commit-disciplin

Et commit bør:

adressere én type ændring

kunne forklares i én sætning

referere til relevante DOC-numre

Eksempel:

“Adjust Context Holder to reduce overlap with Mirror (DOC 2, DOC 5)”

Små commits er en arkitektonisk styrke, ikke støj.

8. Simulering før implementering

Før større ændringer:

simuleres dialogforløb i tekst

roller vises eksplicit

stilhed vurderes aktivt

Kode bruges først:

når oplevelsen er forstået

når ændringen kan placeres entydigt

9. Hvornår man stopper

Det er legitimt at stoppe, når:

systemet føles stabilt

ændringer bliver marginale

kompleksitet begynder at vokse hurtigere end forståelse

RMRC er ikke et system, der “skal være færdigt”.
Det skal være bæredygtigt at eje.

10. Afsluttende princip

RMRC udvikles ud fra dette princip:

Forståelse før fremdrift
Struktur før adfærd
Dokumenter før kode
Menneskelig dømmekraft før AI-forslag

Dette dokument er arbejdskontrakten mellem:

systemejer

arkitektur

og AI-assistenter

Status

DOC 6 er et levende dokument, men ændres sjældent.
Det er tænkt som det dokument, du starter alle nye tråde med.
