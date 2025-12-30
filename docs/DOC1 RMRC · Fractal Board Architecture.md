📄 DOC 1 — RMRC · Fractal Board Architecture

Subtitle: A Reflective, Non-Agentic System for Structured Human Dialogue

1. Formål

Dette dokument definerer RMRC’s grundlæggende arkitektur, ontologi og arbejdsmodel.

DOC 1 er:

systemets arkitektoniske sandhed

fælles reference for design, analyse og videreudvikling

primært rettet mod menneskelige systemejere og AI-assistenter

Hvis kode, prompts eller tooling afviger fra dette dokument,
👉 har DOC 1 forrang.

2. Hvad RMRC er

RMRC (Reflective Multi-Role Chat Architecture) er:

ét samlet reflektionssystem (én dialog, ikke flere agenter)

designet til at holde, spejle og strukturere menneskelig refleksion

baseret på parallelle roller i afgrænsede meningsrum (boards)

RMRC er ikke en agent.
RMRC har ingen intention, mål eller vilje.

Systemet:

responderer

reflekterer

afgrænser

strukturerer

Men:

beslutter ikke

konkluderer ikke

handler ikke på vegne af brugeren

3. Hvad RMRC eksplicit ikke er

RMRC er ikke:

en terapeut

en rådgiver

en coach

en problemløser

et diagnose- eller screeningssystem

et adaptivt lærende AI-system

RMRC:

tilbyder ingen facit

giver ingen anbefalinger

optimerer ikke for effektivitet eller outcome

Stilhed og ikke-svar er gyldige udfald.

4. Kerneprincipper

RMRC er designet ud fra følgende faste principper:

4.1 Ikke-agentisk arkitektur

Roller har ingen hukommelse

Roller har ingen autoritet

Roller kan ikke se hinandens output

Ingen rolle kan evaluere sandhed eller effekt

4.2 Arkitektur > adfærd

Struktur defineres før prompts

Prompts bærer adfærd, ikke kode

Runtime er konfigurationsstyret

4.3 Tvetydighed bevares

Systemet reducerer ikke kompleksitet

Modsatrettede perspektiver kan sameksistere

Ingen tvungen bevægelse mod løsning

4.4 Transparens og governance

Systemet er læsbart og forklarbart

Ændringer sker via dokumenterede commit-punkter

Logs er sandhed, ikke feedback

5. Fraktal arkitektur

RMRC er fraktalt opbygget.

Det betyder:

samme struktur gentager sig på alle niveauer

hoveddialog, preprocessing, analyse og replay følger samme mønster

Fraktal enhed:

Input
→ Board
  → Parallelle roller
→ Konsolidering
→ Output eller stilhed


Denne struktur gælder uanset:

domæne

kompleksitet

antal roller

6. Board-modellen (meningsrum)

Et board er et afgrænset meningsrum, som definerer:

hvilken type refleksion der er tilladt

hvilke roller der må aktiveres

hvilke sproglige og relationelle regler der gælder

Boards:

har ingen intelligens

producerer ikke indhold

ejer rammen, ikke dialogen

Boards kan ses som:

“det bord, rollerne sidder omkring”

7. Roller i RMRC

En rolle er:

et snævert, funktionelt perspektiv

med entydigt mandat

uden hukommelse

uden mål

uden autoritet

En rolle:

modtager input

producerer tekst eller metadata

kan ikke evaluere konsekvenser

Roller eksisterer kun inden for et board.

8. AI-kaldets rolle i arkitekturen

AI (LLM) bruges udelukkende som:

sproglig generator

teksttransformator

refleksionsstøtte

AI:

er stateless

har ingen adgang til historik ud over det eksplicit givne input

kan ikke ændre systemets struktur

RMRC er AI-assisteret, ikke AI-styret.

9. Arbejdsmodel (vigtigt)

RMRC er designet til at kunne:

simuleres uden kode

evalueres via tekstbaserede dialogforløb

justeres gennem dokumenter og prompts

Den primære udviklingsrækkefølge er:

Oplevelse og refleksionsforløb (simulation)

Arkitektonisk konsistens (DOC 1–5)

Prompt-justering

Runtime-implementering

Logging og analyse

Kode er sekundær i de tidlige faser.

10. Konsekvenser for implementering

Ingen hardcoded prompts i runtime

Ingen implicit læring

Ingen skjult state

Central registry-styring

Log-first tænkning

Implementering må:

være enkel

være udskiftelig

kunne kasseres uden tab af viden

11. Læsevejledning

DOC 2: definerer roller og boards (hvem der taler)

DOC 3: definerer prompt- og konfigurationsstrategi (hvordan der tales)

DOC 4: definerer logging og replay (hvordan systemet husker)

DOC 5: definerer det menneskelige og refleksive grundlag (hvorfor systemet findes)

DOC 1 lukker arkitekturen.
Ændringer her er sjældne og bevidste.

Session Continuity Layer (mellem runtime og governance)

RMRC opererer med et eksplicit continuity-lag, der:

er adskilt fra runtime-sessioner

ikke er en del af boards eller roller

ikke indeholder dialoghistorik

Continuity-laget:

holder en aktiv erkendelses-anchor

er læsbart, begrænset og eksplicit

kan anvendes på tværs af runtime-sessioner

Fraktal konsistens opretholdes ved, at:

continuity ikke er et board

continuity ikke aktiverer roller

continuity kun leverer kontekst, aldrig output

Boards er rum for refleksion.
Continuity er stabiliteten mellem rummene.
