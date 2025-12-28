# Reflective Evaluation via Simulation (RES)

Status: Conceptual – frozen for implementation phase  
Scope: RMRC v2.x (post-runtime learning)  
Audience: System designers, architects, AI collaborators

---

## 1. Formål

Reflective Evaluation via Simulation (RES) beskriver et
**eksternt lærings- og evalueringsspor** for RMRC,
der muliggør systemforbedring **uden at kompromittere runtime-adfærd,
etik eller epistemisk integritet**.

RES anvendes først, når:
- sessions kan gennemføres stabilt
- logs kan læses via admin
- systemets grundadfærd er verificeret strukturelt

Dette dokument beskriver **idéen**, ikke implementeringen.

---

## 2. Grundantagelse

RMRC lærer ikke i runtime.

RMRC forbedres gennem:
- menneskelig refleksion
- struktureret analyse
- AI-assisteret simulation

RES er derfor **et designværktøj**, ikke en systemfunktion.

---

## 3. Placering i RMRC-arkitekturen

RES er **eksternt** og ligger over eksisterende lag:

1. Session Layer (runtime)
2. Epistemic Witness Layer (post-session, vidne)
3. Reflective Evaluation via Simulation (design-læring)

Der er **ingen feedback-loop** fra RES til runtime uden menneskelig beslutning.

---

## 4. Hvad RES arbejder med

RES arbejder udelukkende med:

- session-logs (jf. LOGGING_CONTRACT)
- Epistemic Witness events
- rolledefinitioner
- systemprompts
- runtime-profiler

RES har **ingen adgang** til:
- brugeren
- live sessioner
- runtime state

---

## 5. Centrale anvendelser af RES

### 5.1 Rolle-værdi-evaluering

Formål:
At vurdere, om eksisterende roller:

- bidrager med unik værdi
- er redundante i bestemte situationer
- burde være inaktive i visse sessiontyper
- mangler i bestemte erkendelsesforløb

Evalueringen handler ikke om kvalitet,
men om **arkitektonisk relevans**.

---

### 5.2 Alternativ-simulering

Formål:
At simulere alternative systemkonfigurationer, fx:

- sessioner uden en bestemt rolle
- sessioner med ændret systemprompt
- sessioner med ekstra eller færre intermediate steps
- sessioner med strammere eller løsere constraints

Målet er at observere **strukturelle konsekvenser**,
ikke at optimere svar.

---

### 5.3 Gap-identifikation

Formål:
At identificere gentagne mønstre på tværs af sessioner, fx:

- erkendelser der opstår, men ikke kan udfoldes
- steder hvor systemet konsekvent stopper
- tavsheder eller afbrudte bevægelser

Gaps klassificeres som:
- arkitektoniske
- rollemæssige
- prompt-relaterede
- overgangsrelaterede

---

## 6. Output fra RES

RES producerer **design-artefakter**, ikke system-events:

- rolle-hypoteser
- prompt-justeringsforslag
- forslag til nye eller deaktiverede roller
- forslag til ændrede runtime-profiler

Output er:
- hypotetisk
- versioneret
- diskuterbart
- ikke-bindende

---

## 7. Menneskelig kontrol

Alle ændringer som følge af RES:

- besluttes manuelt
- dokumenteres i snapshots
- implementeres bevidst

RES må aldrig:
- ændre systemet automatisk
- justere prompts i runtime
- introducere adaptiv adfærd

---

## 8. Forhold til etik og epistemologi

RES er designet til at:

- bevare RMRC’s ikke-direktive stance
- undgå teleologi og “forbedringspres”
- sikre transparens og sporbarhed
- holde brugerens oplevelse uberørt

Læring sker **om systemet**, ikke **på brugeren**.

---

## 9. Designintention (kort)

Reflective Evaluation via Simulation gør det muligt
at forbedre RMRC systematisk,
uden at gøre systemet intelligent på sig selv.

Det er en kontrolleret hermeneutisk spiral,
med klare stop-punkter og menneskelig autoritet.

---

Dette dokument fastfryser RES som idé.
Implementering vurderes først,
når runtime og logging er stabilt verificeret.
