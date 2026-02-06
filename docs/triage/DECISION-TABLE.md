# Beslutningstabel – Triage (v1)

| Regel-ID | Inputbetingelse | Output-node | triage.outcome | triage.next_step | Noter |
|---------|------------------|------------|----------------|------------------|-------|
| R1 | Red flags = ja | TRIAGE_REFER_ACUTE | REFER_ACUTE | REFER_ACUTE | UDFYLD |
| R2 | Kontraindikation = ja | TRIAGE_NEEDS_ASSESSMENT | NEEDS_ASSESSMENT | ASSESS | UDFYLD |
| R3 | Klar relevance | TRIAGE_FIT_BOOKING | FIT | BOOKING | UDFYLD |
| R4 | Ikke relevance | TRIAGE_NOT_FIT | NOT_FIT | REFER_OUT | UDFYLD |
| R5 | Uklar relevance | TRIAGE_NEEDS_ASSESSMENT | NEEDS_ASSESSMENT | ASSESS | UDFYLD |

> Opdatér denne tabel, når triage-regler ændres.
