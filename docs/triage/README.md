# TRIAGE dokumentpakke (repo-ejet)

Denne mappe er den **samlede dokumentation**, som vedligeholdes direkte i repoet.

## Dokumenter

1. `../triage-design-v1.md`
   - Master-spec for triage-design.
   - Indeholder canonical node-kontrakt, flow, beslutningstabel, observability og DoD.

2. `NODE-CATALOG.md`
   - Det konkrete node-katalog med felter, exits og metadata-ansvar.

3. `DECISION-TABLE.md`
   - Den operationelle beslutningstabel for outcome-regler.

4. `MAINTENANCE.md`
   - Kort, praktisk vedligeholdelsesguide (hvem opdaterer hvad og hvornår).
5. `FILES.md`
   - Samlet filoversigt til deling og hurtig reference.

## Sådan bruger du pakken

- Opdatér **master-spec** ved strukturelle ændringer.
- Opdatér **node-katalog + beslutningstabel** ved enhver flow-/regelændring.
- Opdatér **maintenance-log** for sporbarhed.

## Krav til jer (eksplicit)

Du/jeres team skal selv udfylde alle felter markeret med `UDFYLD` i dokumenterne.
Når `UDFYLD`-felter er udfyldt og godkendt, markeres status i `triage-design-v1.md` som `Ready for implementation`.
