Notat · Replay-baseret kvalitetsforvaltning af prompt-styret AI

Målgruppe: Test-, QA- og kvalitets­specialister
Status: Konceptuelt design, under implementering
Formål: Fælles forståelse, kvalificeret kritik

1. Kort formål og kontekst

Dette notat beskriver en metode til kontrolleret kvalitetsudvikling af et prompt-styret AI-system, der ikke lærer online, og hvor ingen automatiske feedback-loops er tilladt.

Målet er ikke maksimal performance eller hurtig iteration, men:

stabil adfærd over tid

forudsigelig effekt af ændringer

mulighed for langsigtet forvaltning uden kvalitetsdrift

Metoden er inspireret af praksis fra safety-critical software, offline ML-evaluation og continuous improvement – men tilpasset et LLM-baseret, tekstuelt system.

2. Grundlæggende arkitektur (kort)

Systemet består af:

et fast runtime-flow (samme kode for test og produktion)

struktureret logging af dialog og meta-signaler

en evaluator, der producerer kvalitative signaler, ikke beslutninger

et sæt faste Core Quality Criteria (CQC)

Der findes ingen runtime-styring baseret på metrics.
Al forbedring sker offline.

3. De 5 Core Quality Criteria (CQC)

CQC er faste kvalitetsdimensioner, der fungerer som analytisk ramme, ikke KPI’er:

Relevans

Afgrænsning (Boundary management)

Fremdrift (Progression)

Manglende perspektiver

Kontekstfølsomhed

Vigtigt:
CQC måler mønstre over tid, ikke korrekthed af enkelt­svar.

De er bevidst:

kvalitative

ikke numerisk optimerbare

stabile over lange perioder

4. Overordnet metode (faser)
Fase 1 · Testdata-reset og indlæsning

Syntetiske test-cases genereres via en dedikeret AI-prompt

Cases er realistiske, ikke edge-cases

Gamle test-logs ryddes eksplicit

Formål: Etablere en kontrolleret baseline

Fase 2 · Replay via produktions-runtime

Test-cases køres gennem samme chat.ts som brugere

Samme logging, evaluator og reshape

Kun et tag adskiller test fra real usage

Formål: Sikre at tests og virkelighed er samme mekanisme

Fase 3 · Offline analyse via CQC

En separat AI-rolle analyserer log-aggregater

Output er:

observerede mønstre

spændinger mellem CQC

stabilitetsvurdering

eksplicitte analyse-grænser

Der foreslås ingen ændringer.

Fase 4 · Menneskelig designhypotese

Ét gentaget spændingspunkt vælges

Én hypotese formuleres:

“Hvis vi ændrer X, forventer vi Y”

Ingen løsning indlejret.
Ingen optimering.

Fase 5 · Minimal ændring + replay

Én begrænset prompt-ændring

Samme test-suite replays

Ny CQC-analyse sammenlignes kvalitativt

Fase 6 · Forfining af test-cases (sjældent)

Kun når system og CQC er stabile

Merge, ikke erstatning

Tests udvikler sig langsommere end systemet

Fase 7 · Rigtige brugerlogs

Indgår som særskilt kategori i replay

Bruges til at validere test-repræsentativitet

Aldrig til direkte optimering

5. Hvorfor denne metode overhovedet er nødvendig

Prompt-styrede AI-systemer har tre iboende problemer:

Små ændringer kan give uforudsigelige globale effekter

Kvalitet er ikke entydigt målbar

Automatiske feedback-loops fører hurtigt til drift og Goodhart-effekter

Metoden adresserer dette ved:

at bremse iteration bevidst

at adskille observation, analyse og ændring

at holde menneskelig beslutning centralt

6. Centrale risici (ærlig vurdering)
6.1 Kortsigtede risici

Høj initial kompleksitet

Metoden er tungere end “hurtig prompt-tuning”

Kræver disciplin og tålmodighed

Analyse-overbelastning

Risiko for at analysere for meget, handle for lidt

Kræver klare stopregler

Lav umiddelbar payoff

De første iterationer føles langsomme

Kvalitetsgevinster er indirekte

6.2 Langsigtede risici

Metric capture / tunnelvision

CQC kan blive “sandheden”, selv når kvalitet ændrer karakter

Kræver periodisk meta-revision

Test-overfitting

Test-cases kan gradvist afspejle systemet mere end brugerne

Modvirkes via rigtige logs og sjælden reset

Organisatorisk træthed

Metoden kræver vedvarende opmærksomhed

Hvis disciplinen slækkes, mister systemet sin fordel

7. Ressource- og arbejdsbelastning (relative termer)
Største ressource­træk

Menneskelig analyse og beslutning

Udvælgelse af relevante spændinger

Formulering af designhypoteser
→ Høj kognitiv belastning, lav frekvens

Test-case design og vedligehold

Især reset- og merge-faser
→ Mellem belastning, sjældent

Mindre ressource­træk

Selve replay-eksekvering (automatiserbar)

Log-indsamling og lagring

AI-baseret analyse (billig, gentagelig)

Samlet vurdering

Metoden flytter ressourcer fra:

kontinuerlig debugging

brand-slukning

uforudsigelige regressioner

til:

planlagt analyse

sjældne, kontrollerede ændringer

8. Hvad metoden ikke forsøger at gøre

Den maksimerer ikke engagement

Den lærer ikke automatisk

Den reagerer ikke i realtid

Den garanterer ikke “bedste svar”

Den optimerer for:

forudsigelighed, stabilitet og forvaltnings­evne

9. Åben invitation til kritik

Særligt ønskes feedback på:

Om CQC-rammen er tilstrækkelig dækkende

Om analyse-til-design-overgangen er realistisk i praksis

Om arbejdsbyrden er bæredygtig over tid

Hvor metoden risikerer at blive selv-refererende

Dette er bevidst et konservativt design.
Kritik er ikke bare velkommen – den er nødvendig.

Afsluttende bemærkning

Denne metode er ikke “smart”.
Den er langsom, bevidst og krævende.

Til gengæld er den en af de få realistiske måder at forvalte et ikke-lærende AI-system uden at miste kontrollen.

Det er præmissen.
