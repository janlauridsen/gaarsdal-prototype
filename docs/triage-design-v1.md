# TRIAGE – Designspecifikation (repo-ejet)

> **Formål med dette dokument**
> Dette er den **fulde, vedligeholdte designspecifikation** for triage i node-strukturen.
> Dokumentet er skrevet til at kunne ejes af dig/jer i repoet og opdateres over tid.

---

## Dokumentkontrol (SKAL vedligeholdes af jer)

- **Dokument-ejer:** `@UDFYLD`
- **Teknisk reviewer:** `@UDFYLD`
- **Produktansvarlig:** `@UDFYLD`
- **Version:** `v1.0`
- **Status:** `Draft | Ready for implementation | In implementation | Live`
- **Sidst opdateret:** `YYYY-MM-DD`
- **Næste review-dato:** `YYYY-MM-DD`

### Ændringslog (SKAL opdateres ved hver ændring)

| Dato | Version | Ændring | Ansvarlig |
|---|---|---|---|
| YYYY-MM-DD | v1.0 | Første version af vedligeholdt triage-designspec | @UDFYLD |

---

## 1. Scope og mål

### 1.1 Hvad er in-scope

- Én canonical node-kontrakt som runtime og UI deler.
- Et deklarativt triage-flow med eksplicitte beslutningsveje.
- Kontrolleret skrivning af triage-metadata (`meta_delta`).
- Audit/replay-egnet transitionsporing.

### 1.2 Hvad er out-of-scope (v1)

- Klinisk diagnose.
- Automatisk medicinsk anbefalingsmotor.
- Dynamiske flows baseret på ML-modeller uden deterministic fallback.

### 1.3 Målbare succeskriterier (SKAL udfyldes af jer)

- **Flow-completion-rate mål:** `50 %`
- **Andel med klart outcome (`triage.outcome`)**: `50 %`
- **Maks tilladt andel REJECT-events i triage:** `5 %`
- **Observability SLA (log/replay):** `10`

---

## 2. Nuværende arkitektur (baseline)

Der er aktuelt to node-repræsentationer i koden:

1. Runtime bruger `chat/nodes/registry.ts` via `getNode(...)`.
2. Der findes en separat deklarativ node-model i `chat/nodes/types.ts` + `chat/nodes/nodes.ts`.

**Designbeslutning i dette dokument:**
Vi konsoliderer til **én canonical model**, så design/data/runtime ikke divergerer.

---

## 3. Canonical node-kontrakt (besluttet)

```ts
export type NodeKind = "MENU" | "DIALOG" | "TERMINAL" | "DECISION"

export type NodeNavigation = {
  allowed: NodeId[]
  allow_free_text: boolean
  allow_parentese: boolean
}

export type NodeDefinition = {
  id: NodeId
  kind: NodeKind
  goal: string
  content: {
    title?: string
    message: string
    chips?: Array<{ label: string; target: NodeId }>
  }
  navigation: NodeNavigation
  meta_domains_written: string[]
}
