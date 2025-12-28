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
