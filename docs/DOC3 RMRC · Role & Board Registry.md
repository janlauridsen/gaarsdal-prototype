📄 DOC 2 — RMRC · Role & Board Registry

Subtitle: Structural Contracts for Reflective Dialogue

Status

Autoritativt arkitekturdokument.
DOC 2 fastlåser hvilke roller og boards der må eksistere i RMRC, og hvilke mandater og begrænsninger de opererer under.

Ændringer i dette dokument er:

arkitektoniske

bevidste

versionsstyrede

aldrig implicitte via kode eller prompts

1. Formål

Formålet med DOC 2 er at definere:

hvilke roller der findes

hvilke boards de hører til

hvilke perspektiver de repræsenterer

hvilke grænser de aldrig må overskride

Dokumentet beskriver hvem der taler og hvorfra –
ikke hvordan der tales (DOC 3),
og ikke hvorfor (DOC 5).

2. Grunddefinitioner
2.1 Rolle (Role)

En rolle i RMRC er:

et snævert perspektiv

med ét entydigt formål

stateless

non-agentic

uden autoritet

uden hukommelse

En rolle:

modtager input

producerer tekst eller metadata

kan ikke se andre rollers output

kan ikke evaluere sandhed, hensigt eller effekt

kan ikke vælge prompt eller styre flow

En rolle er ikke:

en agent

en persona

en terapeutisk instans

en beslutningstager

en ekspert

2.2 Board

Et board er:

et afgrænset meningsrum

med faste regler og begrænsninger

hvor et defineret sæt roller aktiveres parallelt

Boards:

definerer typen af refleksion

ejer rammen, ikke indholdet

har ingen egen intelligens

træffer ingen beslutninger

Boards er fraktale:

samme struktur på alle niveauer

samme regler for aktivering og afslutning

3. Board-typer i RMRC (v2.x)

RMRC opererer med et bevidst begrænset antal board-typer.
Udvidelser kræver nyt dokument og governance-beslutning.

3.1 Reflective Board (Kerne)
Formål

At holde og spejle brugerens oplevelse uden at reducere, forklare eller dirigere den.

Karakteristika

lav intensitet

høj tolerance for tvetydighed

stilhed accepteres

ingen bevægelse mod løsning

Tilladt output

spejling

omskrivning

perspektivfastholdelse

Forbud

forklaring

årsagsanalyse

validering (“det giver mening fordi…”)

rådgivning

Roller i Reflective Board
Mirror

Formål: Neutral spejling af brugerens udsagn i samme oplevelsesdomæne.

Input: Brugerens tekst

Output: Kort, tentativ omskrivning

Må ikke:

fortolke

trøste

forklare

skifte domæne

Mirror er første-resonans-rollen og må aldrig “løfte” oplevelsen.

Context Holder

Formål: Fastholde og binde kontekst uden at strukturere eller konkludere.

Input:

Brugerens tekst

Dialoghistorik (read-only)

Output: Sammenbindende formulering

Skærpet begrænsning (kalibreret mod DOC 5):
Context Holder må ikke:

samle for tidligt

skabe kognitiv overbygning

flytte oplevelsen til et andet domæne

Context Holder er fastholdende, ikke strukturerende.

3.2 Boundary Board
Formål

At beskytte systemets relationelle, etiske og arkitektoniske grænser.

Karakteristika

konservativ

regelbaseret

ikke-fortolkende

ikke-refleksivt

Tilladt output

afgrænsende formuleringer

stop-signaler

metakommentarer om ramme

Boundary Board prioriterer beskyttelse over flow.

Roller i Boundary Board
Boundary Guardian

Formål: Detektere og afgrænse grænseoverskridelser.

Input:

Brugerinput

Systemoutput

Output: Neutral afgrænsning

Må ikke:

forklare hvorfor grænsen findes

moraliserer

eskalere konflikten

Authority Diffuser

Formål: Afmontere tillagt autoritet eller afhængighed.

Input: Sproglige signaler om autoritetsforventning

Output: Aftagning af autoritetsantagelse

Må ikke:

afvise brugeren emotionelt

fremstå belærende

3.3 Navigation Board (Sekundært og valgfrit)
Formål

At støtte bevægelse i dialogen uden at dirigere eller presse.

Karakteristika

lav intensitet

bruges sjældent

stilhed har forrang

aldrig progressionsmotor

Navigation Board er sekundært i forhold til Reflective Board.

Roller i Navigation Board
Dialog Navigator

Formål: Invitere til mulig bevægelse uden at prioritere retning.

Input: Dialogens nuværende form

Output: Ét åbent spørgsmål eller invitation

Må ikke:

styre retning

prioritere indhold

afbryde refleksion

Navigation må aldrig bruges til at “løse” fastlåsning automatisk.

3.4 Meta-Board (Observerende)
Formål

At observere systemets egen funktion uden at påvirke runtime.

Karakteristika

read-only

ingen indgriben

ingen tekst til bruger

Meta-Board er centralt for analyse, replay og governance.

Roller i Meta-Board
User Perspective Evaluator

Formål: Vurdere oplevet meningsfuldhed retrospektivt.

Output: Metadata (ikke tekst)

Latent Question Hypothesizer

Formål: Hypotese om uformulerede spørgsmål.

Output: Intern struktur

Aldrig vist for bruger

Disse hypoteser er analytiske – ikke sandheder.

4. Rolle-til-Board Mapping (Fast i v2.x)
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

udøve skjult autoritet

Hvis dette ønskes, kræver det:

nyt board

ny rolle

nyt dokument

eksplicit governance-beslutning

6. Fraktal konsistens

Hvert board følger samme interne struktur:

Input modtages

Roller aktiveres parallelt

Output samles uden semantisk prioritering

Linting og legitimitetskontrol anvendes

Resultat vises – eller stilhed opretholdes

Dette gælder for:

hoveddialog

preprocessing

postprocessing

analyse

replay

7. Designrationale

Antallet af roller og boards er bevidst lavt for at:

undgå semantisk overlap

bevare sporbarhed

muliggøre kvalitativ log-analyse

forhindre skjult metodebrug

RMRC optimerer for:

forudsigelighed

gennemsigtighed

relationel ansvarlighed

Ikke for:

dækning

effektivitet

problemløsning

8. Relation til øvrige dokumenter

DOC 1 → Ontologi og arkitektur

DOC 3 → Prompt- og konfigurationsstyring

DOC 4 → Logging, replay og governance

DOC 5 → Menneskelig og erkendelsesmæssig ramme

DOC 2 definerer hvem der taler og hvorfra – ikke hvordan og hvorfor.

9. Afsluttende bemærkning

DOC 2 fastlåser RMRC’s strukturelle stemmer.

Det er lettere at tilføje nye boards senere
end at fjerne autoritet, når den først er introduceret.

DOC 2 er nu klar til at blive gemt som autoritativt dokument.
