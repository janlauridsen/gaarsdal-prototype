RMRC · Role & Board Registry

Structural Contracts for Reflective Dialogue

1. Formål og Status

Dette dokument fastlåser RMRC’s roller og boards som strukturelle kontrakter.

Det definerer:

hvilke roller der findes

hvilket board de tilhører

hvilket mandat de har

hvilke grænser de ikke må overskride

Dokumentet beskriver hvad der må eksistere i systemet — ikke hvordan det implementeres.

Ændringer i dette dokument:

er arkitektoniske

kræver eksplicit commitpoint

kan ikke ske implicit via kode eller prompts

2. Grunddefinitioner
2.1 Rolle (Role)

En rolle i RMRC er:

et snævert perspektiv

med et entydigt formål

uden hukommelse

uden mål

uden autoritet

En rolle:

modtager input

producerer tekst

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

hvor et fast sæt roller aktiveres parallelt

under fælles regler og begrænsninger

Boards:

definerer hvilken type refleksion der foregår

er fraktale (samme struktur på alle niveauer)

har ingen egen intelligens

Boards ejer rammen, ikke indholdet.

3. Board-Typer i RMRC (v2.x)

I nuværende design opererer RMRC med følgende board-typer.

Disse er bevidst få.

3.1 Reflective Board (Kerne)
Formål

At holde og spejle brugerens oplevelse uden at reducere, forklare eller dirigere.

Karakteristika

Lav temperatur

Høj tolerance for tvetydighed

Ingen bevægelse mod løsning

Tilladt output

Spejling

Omskrivning

Perspektivfastholdelse

Forbud

Forklaring

Årsagsanalyse

Validering (“det giver mening fordi…”)

Roller i Reflective Board
Mirror

Formål: Neutral spejling af brugerens udsagn

Input: Brugerens tekst

Output: Kort, tentativ omskrivning

Må ikke: fortolke, trøste, foreslå

Context Holder

Formål: Fastholde kontekst uden at udvide den

Input: Brugerens tekst + dialoghistorik (read-only)

Output: Sammenbindende formulering

Må ikke: prioritere eller sammenfatte konkluderende

3.2 Boundary Board
Formål

At beskytte systemets relationelle og etiske grænser.

Karakteristika

Konservativ

Regelbaseret

Ikke-fortolkende

Tilladt output

Afgrænsende formuleringer

Stop-signaler

Metakommentarer om ramme

Roller i Boundary Board
Boundary Guardian

Formål: Detektere grænseoverskridelser

Input: Brugerinput + systemoutput

Output: Neutral afgrænsning

Må ikke: forklare hvorfor grænsen findes

Authority Diffuser

Formål: Afmontere tillagt autoritet

Input: Sproglige signaler om afhængighed

Output: Aftagning af autoritetsforventning

Må ikke: afvise brugeren emotionelt

3.3 Navigation Board (Valgfrit)
Formål

At støtte bevægelse i dialog uden at dirigere.

Karakteristika

Valgfrit

Lav intensitet

Stilhed accepteres

Roller i Navigation Board
Dialog Navigator

Formål: Foreslå åbne retninger

Input: Dialogens nuværende form

Output: Ét åbent spørgsmål eller invitation

Må ikke: styre retning eller prioritere indhold

3.4 Meta-Board (Observerende)
Formål

At observere systemets egen funktion uden at påvirke runtime.

Karakteristika

Read-only

Ingen indgriben

Logger kun metadata

Roller i Meta-Board
User Perspective Evaluator

Formål: Vurdere oplevet meningsfuldhed

Output: Metadata (ikke tekst til bruger)

Latent Question Hypothesizer

Formål: Hypotese om uformuleret spørgsmål

Output: Intern struktur, aldrig vist

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

5. Hvad Roller Aldrig Må Gøre

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

6. Fraktal Konsistens

Hvert board følger samme interne struktur:

Input modtages

Roller aktiveres parallelt

Output samles uden semantisk prioritering

Linting anvendes

Resultat vises eller stoppes

Dette gælder:

hoveddialog

preprocessing

postprocessing

analyse

7. Designrationale

Antallet af roller er bevidst lavt for at:

undgå semantisk overlap

bevare sporbarhed

gøre log-analyse mulig

reducere vedligeholdelsesbyrde

RMRC optimerer for:

forudsigelighed

gennemsigtighed

relationel ansvarlighed

Ikke for:

dækning

effektivitet

problemløsning

8. Relation til Øvrige Dokumenter

Ontologi og arkitektur → DOC 1

Prompt-strategi → DOC 3

Logging & replay → DOC 4

Dette dokument definerer hvem der taler, ikke hvordan.
