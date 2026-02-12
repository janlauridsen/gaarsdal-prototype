# TRIAGE Beslutningstabel (vedligeholdes af team)

> Dette dokument beskriver præcist, hvilke betingelser der giver hvilke outcomes.

## Ejerskab

- Dokument-ejer: `@UDFYLD`
- Faglig godkender: `@UDFYLD`
- Sidst opdateret: `YYYY-MM-DD`

## Regler

| Regel-ID | Inputbetingelse | Output-node | triage.outcome | triage.next_step | Noter |
|---|---|---|---|---|---|
| R1 | `UDFYLD` | TRIAGE_REFER_ACUTE | REFER_ACUTE | `UDFYLD` | `UDFYLD` |
| R2 | `UDFYLD` | TRIAGE_NOT_FIT | NOT_FIT | `UDFYLD` | `UDFYLD` |
| R3 | `UDFYLD` | TRIAGE_NEEDS_ASSESSMENT | NEEDS_ASSESSMENT | `UDFYLD` | `UDFYLD` |
| R4 | `UDFYLD` | TRIAGE_FIT_BOOKING | FIT | `UDFYLD` | `UDFYLD` |

## Valideringskrav

- Alle regler skal være gensidigt forståelige og ikke modstridende.
- Alle terminale outcomes skal være dækket af mindst én regel.
- Enhver regelændring kræver opdatering af replay/testcases.

## Ændringslog

| Dato | Ændring | Ansvarlig |
|---|---|---|
| YYYY-MM-DD | Første version | @UDFYLD |
