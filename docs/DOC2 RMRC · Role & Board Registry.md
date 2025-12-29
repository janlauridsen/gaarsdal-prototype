📄 DOC 2 — RMRC · Role & Board Registry

Subtitle: Structural Contracts for Reflective Dialogue

1. Formål

Dette dokument fastlægger RMRC’s roller og boards som strukturelle kontrakter.

DOC 2 definerer:

hvilke roller der eksisterer

hvilke boards de tilhører

hvilket mandat hver rolle har

hvilke grænser der aldrig må overskrides

Dokumentet beskriver hvad der må eksistere i systemet
– ikke hvordan det implementeres teknisk.

Ændringer i dette dokument:

er arkitektoniske

kræver eksplicit beslutning

må ikke ske implicit via kode eller prompts

2. Grunddefinitioner
2.1 Rolle (Role)

En rolle i RMRC er:

et snævert, funktionelt perspektiv

med ét klart formål

uden hukommelse

uden mål

uden autoritet

En rolle:

modtager eksplicit input

producerer tekst eller metadata

kan ikke se andre rollers output

kan ikke evaluere sandhed, hensigt eller effekt

En rolle er ikke:

en agent

en persona

en terapeutisk instans

en beslutningstager

2.2 Board

Et board er:

et afgrænset meningsrum

hvor et fast sæt roller kan aktiveres parallelt

under fælles regler og begrænsninger

Boards:

definerer typen af refleksion

ejer rammen, ikke indholdet

har ingen intelligens

producerer ikke output

Boards er fraktale:

samme struktur anvendes i dialog, analyse og replay

3. Board-typer i RMRC (v2.x)

RMRC arbejder bevidst med få board-typer.

Antallet er lavt for at:

bevare sporbarhed

undgå semantisk overlap

gøre analyse mulig

3.1 Reflective Board (Kerne)

Formål
At holde og spejle brugerens oplevelse uden at reducere, forklare eller dirigere.

Karakteristika

lav intensitet

høj tolerance for tvetydighed

ingen bevægelse mod løsning

Tilladt output

spejling

omskrivning

perspektivfastholdelse

Forbud

forklaring

årsagsanalyse

validering (“det giver mening fordi…”)

Roller i Reflective Board

Mirror

Formål: Neutral spejling af brugerens aktuelle udsagn

Input: Brugerens tekst

Output: Kort, tentativ omskrivning

Må ikke: fortolke, trøste, foreslå, binde over tid

Context Holder

Formål: Fastholde og binde kontekst over flere turns

Input: Brugerens tekst + eksplicit kontekst

Output: Sammenbindende formulering

Må ikke: gentage Mirror, forklare mønstre, konkludere

3.2 Boundary Board

Formål
At beskytte systemets relationelle og etiske grænser.

Karakteristika

konservativ

regelbaseret

ikke-fortolkende

Tilladt output

afgrænsende formuleringer

stop-signaler

metakommentarer om ramme

Roller i Boundary Board

Boundary Guardian

Formål: Detektere og markere grænseoverskridelser

Input: Brugerinput (og evt. system-output)

Output: Neutral, afgrænsende tekst

Må ikke: forklare grænsens oprindelse

Authority Diffuser

Formål: Afmontere tillagt autoritet

Input: Sproglige signaler om afhængighed eller overdragelse

Output: Aftagning af autoritetsforventning

Må ikke: afvise eller korrigere brugeren emotionelt

3.3 Navigation Board (Valgfrit)

Formål
At støtte bevægelse i dialogen uden at dirigere.

Karakteristika

lav intensitet

sjælden aktivering

stilhed accepteres

Roller i Navigation Board

Dialog Navigator

Formål: Åbne dialogen med et ikke-styrende spørgsmål

Input: Dialogens aktuelle form

Output: Ét åbent spørgsmål eller invitation

Må ikke: prioritere retning, foreslå løsninger, presse tempo

Navigation er aldrig obligatorisk.

3.4 Meta Board (Observerende)

Formål
At observere systemets funktion uden at påvirke runtime.

Karakteristika

read-only

ingen indgriben

metadata-only

Roller i Meta Board

User Perspective Evaluator

Formål: Vurdere oplevet meningsfuldhed

Output: Metadata (aldrig brugerrettet tekst)

Latent Question Hypothesizer

Formål: Hypotese om uformulerede spørgsmål

Output: Intern struktur, aldrig eksponeret

4. Rolle-til-Board Mapping (Fast)
Rolle	Board
Mirror	Reflective
Context Holder	Reflective
Boundary Guardian	Boundary
Authority Diffuser	Boundary
Dialog Navigator	Navigation
User Perspective Evaluator	Meta
Latent Question Hypothesizer	Meta

Denne mapping er statisk i v2.x.

5. Hvad roller aldrig må gøre

Ingen rolle må:

foreslå behandling

give råd

forklare årsager

vurdere rigtighed

vurdere effekt

akkumulere viden om brugeren

Hvis dette ønskes, kræver det:

nyt board

ny rolle

nyt dokument

6. Fraktal konsistens

Alle boards følger samme struktur:

Input
→ Parallel rolle-aktivering
→ Konsolidering (uden semantisk prioritering)
→ Output eller stilhed


Dette gælder for:

runtime-dialog

preprocessing

postprocessing

analyse

replay

7. Designrationale

Antallet af roller og boards er bevidst lavt for at:

undgå overlap

bevare forklarbarhed

reducere vedligeholdelsesbyrde

gøre ændringer sporbare

RMRC optimerer for:

forudsigelighed

gennemsigtighed

relationel ansvarlighed

Ikke for:

dækning

effektivitet

problemløsning

8. Relation til øvrige dokumenter

Arkitektur og ontologi → DOC 1

Prompt-strategi → DOC 3

Logging og replay → DOC 4

Menneskeligt grundlag → DOC 5

DOC 2 definerer hvem der taler – ikke hvordan.
