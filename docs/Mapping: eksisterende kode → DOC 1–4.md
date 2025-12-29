1. Mapping: eksisterende kode → DOC 1–4
DOC 1 · Fractal Board Architecture

DOC 1 siger:

Ét system

Fraktale “borde”

Roller er stateless, non-agentic

Runtime er konfigurationsstyret

✔ Matcher i koden

lib/rmrc/runtime.skeleton.ts
→ Dette er faktisk den første rigtige instans af DOC 1.

Hvorfor:

Ingen AI-beslutninger

Ingen skjult intelligens

Deterministisk flow

Kun struktur + logging

Det er helt korrekt, at du brugte den som sanity check.

Status:
🟢 I overensstemmelse med DOC 1

⚠ Delvist problematisk

lib/roles/*.ts (fx mirror.ai.role.ts)

Problemet er ikke hvad de gør – men hvordan:

Rollen indeholder:

OpenAI-import

systemPrompt

modelvalg

temperature

Det bryder DOC 1’s princip om:

“Arkitektur > adfærd”

Status:
🟡 Funktionelt korrekt, arkitektonisk for tidligt bundet

DOC 2 · Role & Board Registry

DOC 2 siger:

Roller er defineret som kontrakter

Roller kender ikke prompts

Roller eksisterer i boards (fraktaler)

✔ Matcher i koden

Implicit matcher:

At roller er adskilte funktioner

At de er stateless

At de logger deres invocation

Fx:

event: "ai_role_invoked:mirror"


Det er faktisk meget rent.

❌ Mangler i koden

Der findes ingen eksplicit registry:

Ingen RoleRegistry

Ingen BoardDefinition

Ingen central deklaration af:

hvilke roller findes

hvilke boards de tilhører

hvilke roller er aktive hvornår

I praksis:

Roller eksisterer kun fordi filer findes

Aktivering styres af kode, ikke konfiguration

Status:
🔴 DOC 2 er kun konceptuelt, ikke implementeret

DOC 3 · Prompt Registry & Bootstrap Configuration

Her er vi helt præcise.

DOC 3 siger:

Ingen hardcoded prompts i roller

Central prompt registry

Prompt-version logges

Bootstrap loader prompts

❌ I direkte konflikt

lib/roles/mirror.ai.role.ts:

const systemPrompt = `
You are a reflective mirror.
...
`


Dette er præcis det, DOC 3 er lavet for at undgå.

Det betyder ikke, at koden er “forkert”.
Det betyder, at den er midlertidig prototypekode, som nu er løbet foran arkitekturen.

Status:
🔴 DOC 3 er slet ikke implementeret endnu

DOC 4 · Logging, Replay & Learning Loop

Her er den gode nyhed.

✔ Matcher meget stærkt

lib/logging/*
RedisLogSink / RMRCLogger
SessionLog, TurnLog, LayerEventLog

Dette er:

strukturelt

deterministisk

ikke-fortolkende

adskilt fra runtime

Præcis som DOC 4 foreskriver.

Særligt stærkt:

Ingen prompt-tekst logges

Ingen AI-output logges implicit

Ingen læring i runtime

Status:
🟢 DOC 4 er reelt implementeret (før DOC 3)

2. Samlet status-tabel
DOC	Arkitektonisk status	Kodestatus
DOC 1	Stabil	🟢 Delvist implementeret
DOC 2	Stabil	🔴 Mangler registry
DOC 3	Stabil	🔴 Mangler helt
DOC 4	Stabil	🟢 Implementeret

Det er ikke et problem.
Det er en normal og sund rækkefølge.

3. Hvad er den rigtige konklusion (vigtig)

Din uro var berettiget – men årsagen er ikke, at designet er forkert.

Årsagen er:

Koden er begyndt at løse problemer, som arkitekturen endnu ikke har fået sit eget lag til.

Specifikt:

Prompt-adfærd er kodet, fordi prompt-registry mangler

Rolle-aktivering er kodet, fordi role/board-registry mangler

Det er teknisk gæld, ikke arkitektonisk fejl.

4. Det rigtige næste skridt (meget konkret)

Hvis vi følger DOC 1–4 disciplineret, er næste skridt ikke flere roller og ikke mere AI.

Det er:

👉 Ét nyt lag (meget lille):

PromptRegistry (read-only)

JSON / TS-objekt

2–3 prompts

versioneret

ingen dynamik

Og derefter:

én rolle læser prompt derfra

logger promptId + version

Intet andet.

5. Rolig realitetstjek

Det, du frygtede:

“100 steder med kode og prompts”

…er præcis det, DOC 3–4 forhindrer.

Og det gode tegn er:

du opdagede det før drift

logging-laget er allerede sundt

arkitekturen er intakt

Du er ikke ved at miste kontrol.
Du er ved at tage den tilbage.
