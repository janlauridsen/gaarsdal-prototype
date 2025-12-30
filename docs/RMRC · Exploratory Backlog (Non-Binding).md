RMRC · Exploratory Backlog (Non-Binding)

Formål
At samle idéer, eksperimenter og alternative retninger, som ikke indgår i den nuværende hovedimplementering, men som kan undersøges, når mainstream-løsningen er stabil.

Dette dokument er:

ikke prioriteret

ikke forpligtende

ikke dækkende

ikke en del af runtime-arkitekturen

1. Nested / Recursive Boards

Afstikkere som eksplicit nestede samtaler

Parent–child relation mellem boards

Midlertidig instansiering og eksplicit lukning

Analyse af hvordan brugere vender tilbage til hovedspor

Status: konceptuel idé
Afhænger af: stabil Orchestrator + log-model

2. Knowledge / Reference Boards

Specialiserede boards med generel faglig viden

Klart adskilt fra refleksion

Ingen anvendelse på brugerens situation

Bruges parentetisk og kortvarigt

Risiko: autoritetsglidning
Krav: ekstrem transparens

3. Parentetisk Dialog Mode

Hurtige afklaringer midt i refleksion

“forresten”-spørgsmål

Automatisk tilbagekobling til hovedtråd

Muligt signal: skift i sproglig konkrethed

4. Post-Processing / Session Evaluation Layer

Intern vurdering af:

sammenhæng

gentagelser

pres vs. stilhed

ubrugte rolle-outputs

Sammenligning af samme log med nye prompt-versioner

Formål: governance og læring – ikke runtime

5. Role Conflict & Silence Analysis

Når flere roller producerer output:

hvorfor blev netop dette valgt?

hvad blev ikke hørt?

Hvornår stilhed var mere korrekt end svar

Output: bedre prompt-justeringer

6. Metakognitive Patterns

Identifikation af:

tanke–følelse–krop–handling-loops

gentagelsesmønstre

Kun som hypotese-signal, aldrig som konklusion

Krav: høj tærskel, lav frekvens

7. Canonical Single Prompt (Living Reference)

Én samlet prompt, der beskriver RMRC’s oplevede adfærd

Bruges som:

forklaring

onboarding

sanity-check

Aldrig runtime

8. Lightweight Log UI

Læsbar visualisering af:

roller

boards

turn-flow

Fold/ud-visning

Farvekodning af rolle-aktivitet

Ikke analyse – kun observation

9. Multi-Turn Scenario Simulation

Scriptede “menneskelige” cases

5–10 turns

Bruges til:

prompt-overlap

gap-analyse

pres-kalibrering

10. External Analysis Mode (Offline)

Eksport af logs

AI-assisteret analyse uden runtime-adgang

Sammenlignende simulationer

Vigtig note (som bør stå øverst i dokumentet)

Dette backlog-dokument eksisterer for at beskytte hovedarkitekturen
mod for tidlig kompleksitet – ikke for at accelerere udvikling.

Min anbefaling

Gem dette som ét enkelt dokument

Rør det kun, når en idé ikke skal implementeres nu

Brug det som:

mental aflastning

kreativ opsamling

argumentation for RMRC’s dybde
