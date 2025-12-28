# RMRC · LOGGING CONTRACT
Status: Canonical
Scope: v2.0-start-RMRC-build-0.1

Dette dokument definerer den **eneste autoritative log-kontrakt** for RMRC.

Alt, hvad systemet gør, som har betydning for:
- verifikation
- replay
- analyse
- Epistemic Witness Layer

skal kunne rekonstrueres **udelukkende** ud fra logs, der følger denne kontrakt.

Hvis noget ikke kan ses i loggen, betragtes det som ikke-eksisterende.

---

## 1. Grundprincipper

- Logs er **append-only**
- Logs er **sekventielle**
- Logs er **strukturerede events**
- Logs er **primær sandhed**
- Runtime holder ingen autoritativ state
- Analyse og vurdering sker kun post-session

Logs skrives udelukkende af systemet.
Logs ændres aldrig efter skrivning.

---

## 2. Log-niveauer (Lag)

Alle log-events tilhører præcist ét lag.

### 2.1 `session`
Brugervendt runtime.
Indeholder dialog, roller, outputs.

### 2.2 `domain-overlay`
Domænespecifik påvirkning af sprog/følsomhed.
Ingen behandling, ingen vurdering.

### 2.3 `epistemic-witness`
Post-session analyse.
Ikke-brugervendt.
Må formulere hypoteser og vidneudsagn.

---

## 3. Canonical Log Event Model

Alle events følger denne struktur:

```ts
interface RMRCLogEvent {
  eventId: string;            // UUID
  sessionId: string;          // Stabil per session
  timestamp: string;          // ISO 8601

  layer: "session" | "domain-overlay" | "epistemic-witness";
  eventType: RMRCLogEventType;

  turn?: number;              // Valgfri, men anbefalet
  role?: string;              // Fx "spejler", "afgrænser"

  payload: Record<string, any>;
}
Ingen felter er implicitte.
Ingen felter afledes.
Alt skal kunne læses direkte.

4. Event-typer (RMRCLogEventType)
4.1 Session lifecycle
session_started
json
Kopier kode
{
  "eventType": "session_started",
  "payload": {
    "entrypoint": "api/admin/session/[sessionId]",
    "runtimeProfile": "minimal",
    "bootstrapSnapshot": "RMRC_SNAPSHOT_2025-01"
  }
}
session_ended
json
Kopier kode
{
  "eventType": "session_ended",
  "payload": {
    "reason": "hard_stop | user_exit | system_exit"
  }
}
4.2 Brugerinput
user_input
json
Kopier kode
{
  "eventType": "user_input",
  "turn": 1,
  "payload": {
    "text": "jeg har problemer med angst når jeg skal flyve"
  }
}
4.3 Rolle-eksekvering
role_execution
Dette er det vigtigste event i systemet.

json
Kopier kode
{
  "eventType": "role_execution",
  "turn": 1,
  "role": "spejler",
  "payload": {
    "promptId": "roles.spejler.v1",
    "inputReference": ["user_input"],
    "output": "Jeg hører, at uroen opstår før tankerne."
  }
}
Krav:

Ét event per rolle

Roller er stateless

Ingen rolle ser andre rollers output

4.4 Konsolideret svar
assistant_output
json
Kopier kode
{
  "eventType": "assistant_output",
  "turn": 1,
  "payload": {
    "text": "Uroen beskrives som noget, der kommer før forklaringen."
  }
}
Dette er det eneste output, brugeren ser.

4.5 Epistemic Witness Events (post-session)
Disse events må kun forekomme efter session_ended.

epistemic_snapshot
json
Kopier kode
{
  "eventType": "epistemic_snapshot",
  "layer": "epistemic-witness",
  "payload": {
    "description": "Brugeren landede i en kropslig erkendelse uden behov for handling.",
    "openGaps": ["årsagsforståelse", "handlingsretning"]
  }
}
domain_witness_hypothesis
json
Kopier kode
{
  "eventType": "domain_witness_hypothesis",
  "layer": "epistemic-witness",
  "payload": {
    "domain": "hypnoterapi",
    "hypothesis": "Oplevelsen peger på autonom reaktivitet snarere end kognitiv frygt.",
    "confidence": "low"
  }
}
Disse events:

er interne

påvirker ikke runtime

må aldrig vises for brugeren

5. Invarianter (skal altid holde)
session_started er første event

session_ended er sidste runtime-event

epistemic-witness events kommer kun efter session-slut

Events er tidsordnet via timestamp

assistant_output må kun forekomme efter mindst én role_execution

Hvis en invariant brydes, er sessionen ugyldig.

6. Admin-læsning (kontrakt)
Admin UI skal:

vise rå events

i sekvens

uden fortolkning

uden score

uden vurdering

Admin UI er et inspektionsværktøj, ikke et analyseværktøj.

7. Forhold til runtime
Runtime:

skriver events

læser aldrig historiske events

Analyse:

læser events

skriver nye events (EWL)

Logs er dermed det eneste bindeled.

8. Versionering
Denne kontrakt ændres kun ved:

nyt snapshot

eksplicit commitpoint

Ændringer er additive eller versionsmærkede.
Gamle logs forbliver gyldige.

9. Design-intention (kort)
RMRC logger ikke for debugging.
RMRC logger for erkendelse, ansvar og replaybarhed.

Dette dokument er den autoritative reference
for al videre udvikling.

yaml
Kopier kode

---

## Hvad du kan gøre nu (uden at køre noget)

- Læse filen fra top til bund
- Spørge:
  - *Kan jeg rekonstruere en hel session ud fra dette?*
  - *Kan EWL arbejde uden runtime-adgang?*
  - *Er der noget, der stadig er implicit?*

Hvis noget **mangler**, retter vi kontrakten – **før** kode.

---

## Næste valg (ingen handling endnu)

Når du er klar, kan næste skridt være:

- **B** → Admin-læsemodel (hvordan et menneske læser disse logs korrekt)
- **Snapshot** → Nyt snapshot med denne kontrakt indfrosset
- **Justering** → Små præciseringer i kontrakten
