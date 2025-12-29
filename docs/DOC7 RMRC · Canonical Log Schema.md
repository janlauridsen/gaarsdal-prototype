📄 DOC 7 — RMRC · Canonical Log Schema

Subtitle: Event-Sourced Observability for RMRC

Status

Autoritativ afledning af RMRC’s datateori til konkret lagring.
Dette dokument definerer hvordan RMRC’s logs lagres, ikke hvordan de bruges.

1. Overordnet lagringsstrategi (meget vigtigt)
Valgt strategi

👉 Event-sourcing i Redis via append-only streams + indeks-keys

Hvorfor Redis / Upstash egner sig:

ekstrem write-performance

naturlig støtte for append-only

streams matcher RMRC-events perfekt

billig og skalerbar

let at analysere via scripting senere

2. Grundprincipper for alle keys
2.1 Navngivning (kanonisk)

Alle keys er præfiksede og semantiske:

rmrc:{env}:{entity}:{id}


Eksempler:

rmrc:prod:session:{sessionId}
rmrc:prod:stream:events
rmrc:prod:index:sessions

2.2 Immutable data

Events opdateres aldrig

Kun nye events appendes

“Rettelser” er nye events

3. Primær event-stream (rygraden)
3.1 Global event stream
rmrc:{env}:stream:events


Type: Redis Stream

Alle events – uanset type – skrives her.

3.2 Fælles event-felter (obligatoriske)

Disse felter skal være på alle events:

Felt	Type	Beskrivelse
eventId	string	UUID
eventType	string	fx session.start, role.invoked
timestamp	number	Unix ms
sessionId	string	Session reference
turnIndex	number	-1 hvis ikke relevant
runtimeProfile	string	fx default
registryVersion	string	Prompt/role registry
systemVersion	string	Build/version
4. Event-typer (kanonisk sæt)
4.1 Session Events
session.start
{
  "eventType": "session.start",
  "sessionId": "...",
  "runtimeProfile": "default",
  "registryVersion": "v2.1",
  "systemVersion": "0.4.0"
}

session.end
{
  "eventType": "session.end",
  "sessionId": "...",
  "stopReason": "user_exit | boundary | silence"
}

4.2 Turn Events
turn.start
{
  "eventType": "turn.start",
  "sessionId": "...",
  "turnIndex": 3,
  "userInputPresent": true
}

turn.end
{
  "eventType": "turn.end",
  "sessionId": "...",
  "turnIndex": 3,
  "systemOutputEmitted": true
}

4.3 Board Events
board.activated
{
  "eventType": "board.activated",
  "boardId": "reflective",
  "reason": "default_flow | boundary_check"
}

4.4 Role Invocation Events
role.invoked
{
  "eventType": "role.invoked",
  "boardId": "reflective",
  "roleId": "mirror",
  "promptId": "mirror.base",
  "promptVersion": "1.0.0",
  "invoked": true,
  "producedOutput": true
}

role.suppressed
{
  "eventType": "role.suppressed",
  "boardId": "navigation",
  "roleId": "dialog_navigator",
  "reason": "stillness_preferred"
}

4.5 Boundary / Control Events
boundary.triggered
{
  "eventType": "boundary.triggered",
  "boundaryType": "authority | scope | ethics",
  "roleId": "authority_diffuser"
}

4.6 Silence / Suppression Events (vigtigt)
silence.emitted
{
  "eventType": "silence.emitted",
  "scope": "turn | role | board",
  "reason": "no_meaningful_reflection"
}

5. Sekundære indeks-keys (for analyse)

Disse keys er afledte, ikke sandhed.

5.1 Session index
rmrc:{env}:index:sessions


Type: Set
Indeholder alle sessionId

5.2 Session → events
rmrc:{env}:index:session:{sessionId}


Type: List
Indeholder eventIds i rækkefølge

(valgfrit – kan også rekonstrueres fra stream)

5.3 Role usage index
rmrc:{env}:index:role:{roleId}

5.4 Prompt usage index
rmrc:{env}:index:prompt:{promptId}:{version}

6. Hvorfor denne model virker langsigtet
Den understøtter:

replay (fuldt deterministisk)

regressionstest

prompt-sammenligning

board/rolle-analyse

fastlåsningsdetektion

erkendelsessignaler (indikatorer)

Den forhindrer:

skjult læring

implicit state

“smart” runtime

datagæld

7. Performance og skaleringsnoter

Redis Streams kan håndtere meget høje event-mængder

Analyse kan ske:

via batch export

via consumer groups

via scripts

Upstash egner sig særligt godt pga.:

pay-per-request

HTTP API

enkel opsætning

8. Samlet konklusion

Dette skema gør RMRC styrbart uden at gøre det komplekst.

Data er normaliseret

Events er semantiske

Analyse er mulig uden tekst

Arkitekturen forbliver ren

Dette er et meget stærkt fundament.
