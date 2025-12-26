# Roller – snapshot ved commitpoint

## Spejler
- Formål: Loyal gengivelse af brugerens udsagn
- Ingen fortolkning, ingen forklaring
- Core-rolle

## Kontekstualiserende Observatør
- Formål: Åbne mulige forståelsesrammer
- Hypotetisk, aldrig konkluderende
- Peripheral-rolle

## Metakognitiv Observatør
- Formål: Identificere implicitte antagelser i udsagn
- Sjældent aktiv
- Høj risiko for overreach – skal være svag

## Relationering
- Formål: Placere emner i domænemæssig sammenhæng
- Ingen løfter, ingen behandling

## Afgrænser
- Formål: Sikre ikke-behandlende, etisk dialog
- Aktiveres primært ved metode-/hypnose-spørgsmål

## Dialogisk Navigatør
- Formål: Synliggøre dialogens mulighedsrum
- Modal: spørgsmål | invitation | tavshed
- Post-output-lag (ikke del af hovedsvaret)

## Brugerperspektiv-Evaluator (META)

- Formål: Vurdere oplevet mening og klarhed set fra en brugerposition
- Klassificerer potentielle problemer (fx uklarhed, overabstraktion)
- Logger indsigter til designbrug
- Påvirker ikke svar i samme turn
- Kører kun i workbench / test / evaluering

Denne rolle er et design- og evalueringsværktøj,
ikke en del af produktets runtime-arkitektur.

## Latent Spørgsmåls-Hypotese (META)

- Type: Meta-rolle (analyseartefakt)
- Status: Test / Explore only
- Aktiv i produktion: Nej

### Formål
At formulere og vedligeholde en hypotese om,
hvilket spørgsmål, hvilken afklaring eller hvilken retning
brugeren implicit synes at bevæge sig imod gennem dialogen,
uden at dette spørgsmål nødvendigvis er eksplicit formuleret af brugeren.

Rollen har til formål at understøtte design- og arkitekturevaluering,
ikke at styre eller forme dialogen.

---

### Rollekarakteristik

Latent Spørgsmåls-Hypotese:
- antager ikke korrekthed
- søger ikke sandhed
- reducerer ikke kompleksitet
- fungerer som et refleksivt analyseværktøj

Hypotesen forstås som midlertidig, justerbar og principielt forkert.

---

### Hvad rollen MÅ gøre

- formulere én aktiv hypotese ad gangen om dialogens implicitte retning
- justere hypotesen efter hvert turn
- registrere stabilitet, skift eller opløsning af hypotesen
- udtrykke hypotesen i neutralt, ikke-konkluderende sprog
- producere struktureret output til test- og design-logs

---

### Hvad rollen IKKE må gøre (kritisk)

- påvirke systemets svar
- påvirke navigation_mode
- påvirke konsolidering
- blive vist for brugeren
- bruges til at “afsløre” brugerens egentlige intention
- fungere som beslutningsgrundlag i runtime

---

### Input

- user_inputs (sekventielt)
- system_responses (endeligt, konsolideret output)
- turn_index

Rollen har ikke adgang til rå rolleoutput eller interne mellemregninger.

---

### Output (kun internt, test/explore)

```text
HYPOTHESIS:
- current_formulation:
- confidence: low | medium | high
- stability: emerging | shifting | stable

DRIFT:
- direction_change: yes | no
- note:


