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

- **Flow-completion-rate mål:** `UDFYLD %`
- **Andel med klart outcome (`triage.outcome`)**: `UDFYLD %`
- **Maks tilladt andel REJECT-events i triage:** `UDFYLD %`
- **Observability SLA (log/replay):** `UDFYLD`

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
```

### 3.1 Kontraktregler

- `navigation.allowed` er den lukkede mængde af lovlige exits.
- `allow_free_text = true` betyder kun “må modtage fritekst” – ikke implicit routing.
- `meta_domains_written` er whitelist for `meta_delta` i den aktive node.
- `TERMINAL` noder afslutter samtalen/triage-udfald.

---

## 4. Triage domænemodel (metadata)

### 4.1 Standardfelter i v1

- `triage.presenting_issue`
- `triage.duration`
- `triage.intensity`
- `triage.red_flags`
- `triage.contraindication`
- `triage.outcome` = `FIT | NEEDS_ASSESSMENT | NOT_FIT | REFER_ACUTE`
- `triage.next_step`

### 4.2 Datakontrakt (SKAL udfyldes af jer)

> Udfyld nedenstående med de konkrete enum-værdier og valideringsregler, I vil eje.

| Felt | Type | Tilladte værdier | Krævet | Ejer |
|---|---|---|---|---|
| triage.presenting_issue | `string/enum` | `UDFYLD` | Ja | @UDFYLD |
| triage.duration | `enum` | `UDFYLD` | Ja | @UDFYLD |
| triage.intensity | `enum` | `UDFYLD` | Ja | @UDFYLD |
| triage.red_flags | `bool/enum` | `UDFYLD` | Ja | @UDFYLD |
| triage.contraindication | `bool/enum` | `UDFYLD` | Ja | @UDFYLD |
| triage.outcome | `enum` | `FIT, NEEDS_ASSESSMENT, NOT_FIT, REFER_ACUTE` | Ja | @UDFYLD |
| triage.next_step | `enum/string` | `UDFYLD` | Ja | @UDFYLD |

---

## 5. Triage flow (v1)

```text
HOME
└── TRIAGE_INTRO
    └── TRIAGE_PRESENTING_ISSUE
        └── TRIAGE_DURATION
            └── TRIAGE_INTENSITY
                └── TRIAGE_RED_FLAGS
                    ├── TRIAGE_REFER_ACUTE (terminal)
                    └── TRIAGE_CONTRAINDICATIONS
                        ├── TRIAGE_NOT_FIT (terminal)
                        ├── TRIAGE_NEEDS_ASSESSMENT (terminal)
                        └── TRIAGE_FIT_BOOKING (terminal)
```

### 5.1 Nodekatalog (SKAL udfyldes af jer)

> Nedenstående tabel er den del, I aktivt vedligeholder når flow ændres.

| Node ID | Type | Formål | Allowed exits | Skriver meta |
|---|---|---|---|---|
| TRIAGE_INTRO | DIALOG | Intro og forventningsafstemning | `UDFYLD` | - |
| TRIAGE_PRESENTING_ISSUE | DIALOG | Primært problem | `UDFYLD` | `triage.presenting_issue` |
| TRIAGE_DURATION | DIALOG | Varighed | `UDFYLD` | `triage.duration` |
| TRIAGE_INTENSITY | DIALOG | Intensitet | `UDFYLD` | `triage.intensity` |
| TRIAGE_RED_FLAGS | DECISION | Risikoflag | `UDFYLD` | `triage.red_flags` |
| TRIAGE_CONTRAINDICATIONS | DECISION | Kontraindikationer | `UDFYLD` | `triage.contraindication` |
| TRIAGE_REFER_ACUTE | TERMINAL | Akut henvisning | - | `triage.outcome, triage.next_step` |
| TRIAGE_NOT_FIT | TERMINAL | Ikke egnet | - | `triage.outcome, triage.next_step` |
| TRIAGE_NEEDS_ASSESSMENT | TERMINAL | Kræver afklaringssamtale | - | `triage.outcome, triage.next_step` |
| TRIAGE_FIT_BOOKING | TERMINAL | Egnet til booking | - | `triage.outcome, triage.next_step` |

---

## 6. Beslutningstabel (SKAL udfyldes af jer)

> Dette er den vigtigste vedligeholdte tabel: den beskriver præcis hvilken tilstand der giver hvilket outcome.

| Regel-ID | Betingelse | Outcome-node | Outcome-værdi | Næste skridt |
|---|---|---|---|---|
| R1 | `UDFYLD` | TRIAGE_REFER_ACUTE | REFER_ACUTE | `UDFYLD` |
| R2 | `UDFYLD` | TRIAGE_NOT_FIT | NOT_FIT | `UDFYLD` |
| R3 | `UDFYLD` | TRIAGE_NEEDS_ASSESSMENT | NEEDS_ASSESSMENT | `UDFYLD` |
| R4 | `UDFYLD` | TRIAGE_FIT_BOOKING | FIT | `UDFYLD` |

---

## 7. Runtime-regler

1. **Eksplicit transition er default i triage**.
2. **Fritekst** tillades kun i noder med `allow_free_text = true`.
3. `FREE_TEXT` skal resolves til `FREE_TEXT_RESOLVED` med valideret target.
4. `meta_delta` må kun skrive domæner i node-whitelist.
5. Alle transitions skal være tilladte ifølge `navigation.allowed`.

---

## 8. UI-spec (repo-vedligeholdt)

### 8.1 Krav

- Aktiv node viser `content.message`.
- Valg vises som chips (fra `allowed` og/eller `content.chips`).
- Terminal udfald viser tydelig CTA.

### 8.2 CTA-matrix (SKAL udfyldes af jer)

| Outcome | Primær CTA | Sekundær CTA | Copy |
|---|---|---|---|
| FIT | `UDFYLD` | `UDFYLD` | `UDFYLD` |
| NEEDS_ASSESSMENT | `UDFYLD` | `UDFYLD` | `UDFYLD` |
| NOT_FIT | `UDFYLD` | `UDFYLD` | `UDFYLD` |
| REFER_ACUTE | `UDFYLD` | `UDFYLD` | `UDFYLD` |

---

## 9. Observability og replay

### 9.1 Minimum checks

- Ingen ulovlige hops i triage.
- Ingen meta-skrivning uden whitelist.
- Alle gennemførte triage-forløb ender i et terminalt outcome.

### 9.2 Alerts/monitorering (SKAL udfyldes af jer)

- **Alarm ved manglende outcome:** `UDFYLD`
- **Alarm ved høj reject-rate:** `UDFYLD`
- **Dashboard-link:** `UDFYLD`

---

## 10. Implementeringsplan

### Fase 1 – model-konsolidering

- Saml node-kontrakt i én canonical model.
- Migrér runtime registry-data til canonical struktur.
- Sikr bagudkompatibel `getNode`-adfærd.

### Fase 2 – triage v1 i runtime

- Opret triage-noderne fra nodekataloget.
- Definér `allowed` exits eksplicit.
- Tilføj `meta_domains_written` pr. node.

### Fase 3 – UI og free-text

- Render `content.message` i chatbot UI.
- Implementér resolver for fritekst i triage-kontekst.

### Fase 4 – test/replay

- Tilføj testcases for alle outcomes.
- Tilføj negative tests (ulovlig exit, ulovlig meta-skrivning).

---

## 11. Definition of done (SKAL udfyldes af jer)

- [ ] Nodekatalog-tabellen er fuldt udfyldt.
- [ ] Beslutningstabellen er godkendt af produkt + faglig ansvarlig.
- [ ] CTA-matrix er godkendt.
- [ ] Monitoreringsfelter er udfyldt.
- [ ] Alle tests passerer i CI.
- [ ] Ejer/reviewer-felter er udfyldt i dokumentkontrol.

---

## 12. Vedligeholdelsesinstruks (eksplicit)

For at holde dokumentet brugbart skal **du/jeres team** gøre følgende:

1. Opdatér **Dokumentkontrol** ved hver ændring.
2. Opdatér **Ændringslog** med dato, version og ansvarlig.
3. Opdatér **Nodekatalog** når en node tilføjes/fjernes/omdøbes.
4. Opdatér **Beslutningstabellen** når triage-regler ændres.
5. Opdatér **CTA-matrix** når brugerflow eller copy ændres.
6. Marker version som `Ready for implementation` først når alle `UDFYLD`-felter er erstattet.

> Hvis du ønsker det, kan næste step være at jeg laver en v2, hvor alle `UDFYLD`-felter erstattes med konkrete værdier baseret på dine faglige regler.
