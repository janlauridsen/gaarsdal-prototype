# TRIAGE Node-katalog (vedligeholdes af team)

> Dette dokument er jeres operationelle oversigt over noder og tilladte exits.

## Ejerskab

- Dokument-ejer: `@UDFYLD`
- Sidst opdateret: `YYYY-MM-DD`

## Triage noder

| Node ID | Kind | Formål | Allowed exits | allow_free_text | allow_parentese | meta_domains_written | Ejer |
|---|---|---|---|---|---|---|---|
| TRIAGE_INTRO | DIALOG | Intro | `UDFYLD` | `UDFYLD` | `UDFYLD` | `-` | @UDFYLD |
| TRIAGE_PRESENTING_ISSUE | DIALOG | Primært problem | `UDFYLD` | `UDFYLD` | `UDFYLD` | `triage.presenting_issue` | @UDFYLD |
| TRIAGE_DURATION | DIALOG | Varighed | `UDFYLD` | `UDFYLD` | `UDFYLD` | `triage.duration` | @UDFYLD |
| TRIAGE_INTENSITY | DIALOG | Intensitet | `UDFYLD` | `UDFYLD` | `UDFYLD` | `triage.intensity` | @UDFYLD |
| TRIAGE_RED_FLAGS | DECISION | Risikovurdering | `UDFYLD` | `UDFYLD` | `UDFYLD` | `triage.red_flags` | @UDFYLD |
| TRIAGE_CONTRAINDICATIONS | DECISION | Kontraindikationer | `UDFYLD` | `UDFYLD` | `UDFYLD` | `triage.contraindication` | @UDFYLD |
| TRIAGE_REFER_ACUTE | TERMINAL | Akut henvisning | `-` | `false` | `false` | `triage.outcome, triage.next_step` | @UDFYLD |
| TRIAGE_NOT_FIT | TERMINAL | Ikke egnet | `-` | `false` | `false` | `triage.outcome, triage.next_step` | @UDFYLD |
| TRIAGE_NEEDS_ASSESSMENT | TERMINAL | Afklaringssamtale | `-` | `false` | `false` | `triage.outcome, triage.next_step` | @UDFYLD |
| TRIAGE_FIT_BOOKING | TERMINAL | Egnet + booking | `-` | `false` | `false` | `triage.outcome, triage.next_step` | @UDFYLD |

## Hurtig checklist før merge

- [ ] Alle nye noder findes i tabellen
- [ ] Alle allowed exits er opdateret
- [ ] Alle meta-domæner har ejer
- [ ] `Sidst opdateret` er sat
