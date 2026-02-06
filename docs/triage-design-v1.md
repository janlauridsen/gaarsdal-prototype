# Triage Design v1

> Dette er den **fulde, vedligeholdte designspecifikation** for triage i node-strukturen.

## Changelog
| Dato | Version | Ændring | Af |
|------|---------|---------|----|
| YYYY-MM-DD | v1.0 | Første version af vedligeholdt triage-designspec | @UDFYLD |

## Formål

- Et deklarativt triage-flow med eksplicitte beslutningsveje.
- Kontrolleret skrivning af triage-metadata (`meta_delta`).
- Maksimalt 6 spørgsmål i en triage-session.

## KPI’er (placeholder)
- **Andel med klart outcome (`triage.outcome`)**: `UDFYLD %`
- **Maks tilladt andel REJECT-events i triage:** `UDFYLD %`

## Overblik

- `DIALOG` noder styrer spørgs/afklaring.
- `DECISION` noder vurderer næste skridt.
- `TERMINAL` noder afslutter samtalen/triage-udfald.

## Metadata (triage.*)
- `triage.presenting_issue`
- `triage.duration`
- `triage.intensity`
- `triage.red_flags`
- `triage.contraindication`
- `triage.outcome` = `FIT | NEEDS_ASSESSMENT | NOT_FIT | REFER_ACUTE`
- `triage.next_step`

## Metadata kontrakt

| Key | Type | Allowed values | Required | Owner |
|-----|------|----------------|----------|-------|
| triage.presenting_issue | `string/enum` | `UDFYLD` | Ja | @UDFYLD |
| triage.duration | `enum` | `UDFYLD` | Ja | @UDFYLD |
| triage.intensity | `enum` | `UDFYLD` | Ja | @UDFYLD |
| triage.red_flags | `bool/enum` | `UDFYLD` | Ja | @UDFYLD |
| triage.contraindication | `bool/enum` | `UDFYLD` | Ja | @UDFYLD |
| triage.outcome | `enum` | `FIT, NEEDS_ASSESSMENT, NOT_FIT, REFER_ACUTE` | Ja | @UDFYLD |
| triage.next_step | `enum/string` | `UDFYLD` | Ja | @UDFYLD |

## Node catalog (v1)

| Node | Kind | Goal | Message | meta_domains_written |
|------|------|------|---------|----------------------|
| TRIAGE_PRESENTING_ISSUE | DIALOG | Primært problem | `UDFYLD` | `triage.presenting_issue` |
| TRIAGE_DURATION | DIALOG | Varighed | `UDFYLD` | `triage.duration` |
| TRIAGE_INTENSITY | DIALOG | Intensitet | `UDFYLD` | `triage.intensity` |
| TRIAGE_RED_FLAGS | DECISION | Risikoflag | `UDFYLD` | `triage.red_flags` |
| TRIAGE_CONTRAINDICATIONS | DECISION | Kontraindikationer | `UDFYLD` | `triage.contraindication` |
| TRIAGE_REFER_ACUTE | TERMINAL | Akut henvisning | - | `triage.outcome, triage.next_step` |
| TRIAGE_NOT_FIT | TERMINAL | Ikke egnet | - | `triage.outcome, triage.next_step` |
| TRIAGE_NEEDS_ASSESSMENT | TERMINAL | Kræver afklaringssamtale | - | `triage.outcome, triage.next_step` |
| TRIAGE_FIT_BOOKING | TERMINAL | Egnet til booking | - | `triage.outcome, triage.next_step` |

## Principper

1. **Eksplicit transition er default i triage**.
2. **Alle triage-forløb ender i et terminalt outcome**.

## Validation

- Ingen ulovlige hops i triage.
- Alle gennemførte triage-forløb ender i et terminalt outcome.

## Fase 2 – triage v1 i runtime

- Opret triage-noderne fra nodekataloget.
- Implementér resolver for fritekst i triage-kontekst.
- Opdatér **Beslutningstabellen** når triage-regler ændres.
