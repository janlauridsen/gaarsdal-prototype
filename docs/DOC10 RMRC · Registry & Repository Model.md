📄 DOC 10 — RMRC · Registry & Repository Model

Subtitle: Making the System Governable

Status

Autorativt konceptuelt dokument.
Dette dokument fastlægger:

hvad registry er

hvordan repository bør organiseres

hvordan registry, logs og governance hænger sammen

Ingen kode. Ingen JSON. Ingen implementation.

DEL A — Hvad er et Registry i RMRC? (konceptuelt)
A.1 Grunddefinition

Et registry i RMRC er en eksplicit, versionsstyret fortegnelse over, hvad systemet må bestå af.

Registry:

definerer eksistens, ikke adfærd

er læsbart, ikke dynamisk

er administrativt, ikke intelligent

Hvis noget ikke findes i registry:

👉 så findes det ikke i systemet

A.2 Registry-typer (kanonisk sæt)

RMRC opererer med fire registry-typer.

1. Role Registry

Definerer hvilke roller der findes.

Entitet: Role

roleId (unik, stabil)

boardId (hvilket meningsrum)

roleStatus (active | deprecated)

description (menneskelig forklaring)

👉 Roller:

indeholder ingen prompts

indeholder ingen kode

er rene kontrakter

2. Board Registry

Definerer hvilke boards der findes, og hvilke roller de kan rumme.

Entitet: Board

boardId

boardType (reflective | boundary | navigation | meta)

allowedRoles (liste af roleId)

boardStatus

👉 Boards ejer rammen, aldrig indholdet.

3. Prompt Registry

Definerer hvordan systemet taler, uden at blande kode ind.

Entitet: Prompt

promptId (stabil)

roleId (hvem bruger prompten)

promptVersion (semver eller tilsvarende)

intent (kort, menneskelig beskrivelse)

status (active | archived)

👉 Prompt-indhold er:

versionsstyret

sporbar via logs

udskifteligt uden kodeændring

4. Runtime Profile Registry

Definerer hvordan systemet køres i praksis.

Entitet: RuntimeProfile

profileId (fx minimal, reflective_only)

enabledBoards

enabledRoles

notes (formål / eksperiment)

👉 RuntimeProfile er:

det primære eksperiment- og testgreb

det, der gør systemet smalt og roligt

DEL B — Repository-modellen (arbejdsmæssigt)

Denne del er direkte afledt af dine Vercel- og build-erfaringer.

B.1 Overordnet princip

Repository’et skal afspejle registry, ikke omvendt.

Kode er sekundær.
Struktur er primær.

B.2 Kanoniske repo-principper

Disse principper er bindende for RMRC v2.x:

❌ Ingen path aliases

❌ Ingen SDK-imports i core-lag

❌ Ingen prompts i kode

❌ Ingen tidlig type-fastlåsning

✅ Central registry-mappe

✅ Få, flade imports

✅ Små, grønne commits

B.3 Konceptuel mappeinddeling (ikke kode)
registry/
  roles/
  boards/
  prompts/
  runtime-profiles/

core/
  runtime/
  orchestration/
  logging/

analysis/
  replay/
  simulations/
  notebooks/

docs/
  DOC_1_...
  DOC_2_...
  ...


Vigtige pointer

registry/ er administrativ sandhed

core/ må aldrig definere, hvad der findes

analysis/ må aldrig skrive til runtime

docs/ er en del af systemet, ikke pynt

DEL C — Sammenkobling: Registry ↔ Logs ↔ Governance

Dette er det vigtigste afsnit.

C.1 Registry som reference i logs

Alle relevante log-events skal referere til registry-entiteter, ikke til kode.

Eksempler (konceptuelt):

roleId

boardId

promptId + version

runtimeProfileId

👉 Logs kan dermed analyseres:

uden kode

uden prompts

uden runtime

C.2 Governance via registry + logs

Ændringer i systemet sker aldrig implicit.

Flowet er altid:

Logs observeres

Analyse foretages

Ændring foreslås

Registry opdateres

Nyt commitpoint

Nyt runtime køres

Registry er dermed:

det sted, hvor beslutninger manifesterer sig

C.3 Hvorfor dette er differentierende

Denne kobling betyder, at RMRC:

kan ændres langsomt uden at miste viden

kan sammenligne adfærd på tværs af versioner

kan genafspille fortiden uden semantisk forurening

aldrig “glider” uden at det kan ses

Samlet konklusion

Med dette registry- og repository-koncept er RMRC nu:

administrerbart

versionssikkert

analyserbart

robust mod teknisk støj

beskyttet mod arkitektonisk drift

Det er det sidste fundamentale lag, der manglede.
