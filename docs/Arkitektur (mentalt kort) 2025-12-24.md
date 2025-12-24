🧠 Gaarsdal – Arkitektur (mentalt kort)

Tænk systemet som 4 lag, der aldrig må flyde sammen.

1️⃣ Runtime / Live-systemet

(Det brugeren oplever)

Ansvar

Køre chatten

Tale med OpenAI

Logge alt korrekt

Træffe ingen vurderinger

Centrale dele
components/
  AIChat.tsx          → UI + state machine
pages/api/
  ai-chat.ts          → OpenAI-kald + logging
lib/
  session.ts          → sessionId via cookie
  session-logger.ts   → skriver data til Redis

Vigtige regler

Ingen eval

Ingen analyse

Ingen “er det godt?”

Kun: hvad skete der?

👉 Output herfra er rå sandhed (log).

2️⃣ Persistence / Logging-laget

(Sandhedskilden)

Ansvar

Gemme alt

Aldrig ændre historik

Være stabil i årevis

Struktur i Redis
session:{id}:meta
session:{id}:turns   (append-only)

Typer (låst)
lib/admin-types.ts


SessionMeta

SessionTurn

ChatState

👉 Dette er kontrakten mellem fortid og fremtid.
Alt andet bygger ovenpå.

3️⃣ Playback-laget (read-only simulation)

(“Hvad skete der egentlig?”)

Ansvar

Genskabe en session deterministisk

Ingen netværk

Ingen OpenAI

Ingen UI

Centrale filer
lib/playback/
  replay-types.ts
  buildMessages.ts
  runPlaybackSession.ts

Mentalt billede

“Hvis jeg giver dig en session + en prompt,
kan du forklare præcis hvad modellen så?”

Playback = oversættelse
Fra log → model-input-output-flow

👉 Playback er fundamentet for:

eval

diff

batch

regression

QA

4️⃣ Eval & Analyse-laget

(“Var det godt ift. vores regler?”)

Ansvar

Observere mønstre

Flagge afvigelser

Aldrig ændre data

Aldrig give råd

Struktur
lib/eval/
  evalSession.ts      → én session
  evalBatch.ts        → mange sessions
  diff/
    diffEval.ts       → sammenlign versioner
  heuristics/         → små, isolerede regler

Eval er altid:

afledt

udskiftelig

eksperimentel

👉 Du kan smide hele eval-laget væk og genbygge det,
uden at miste data.

5️⃣ Admin / Observationslaget

(Mennesket kigger på systemet)

Ansvar

Se sessions

Se turns

Se eval

Senere: playback / compare

Status nu

Read-only

Minimal UI

Korrekt koblet til logging

Fremtid

Playback side-by-side

Prompt v4.5 vs v4.6

Batch-score trends

“Hvad ændrede sig?”

🔁 Samlet flow (én linje)
Bruger
 ↓
AIChat (UI)
 ↓
ai-chat API
 ↓
LOG (Redis)  ← ← ← ← ← ← ← ← ← ← ← ← ← ←
 ↓                                      ↑
Playback (read-only)                     |
 ↓                                      |
Eval / Diff / Batch                      |
 ↓                                      |
Admin / Analyse UI ————————————————


Kun én pil går tilbage i tiden:

via playback + eval
aldrig via runtime

🧱 Arkitektur-principper (de vigtigste)

Disse 5 regler er guld værd for dit projekt:

Logs er hellige
→ må aldrig “forbedres”

Playback er deterministisk
→ samme input = samme replay

Eval er opinionated – ikke sandhed
→ kan ændres, sammenlignes, slettes

Runtime ved intet om eval
→ separation = sikkerhed

Alt nyt starter som read-only
→ først se, så handle
