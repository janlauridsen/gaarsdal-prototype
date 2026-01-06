# OBSERVABILITY CONTRACT · GAARSDAL CHATBOT

Dette dokument definerer den **forpligtende observability‑kontrakt** for Gaarsdal Chatbot.
Formålet er at sikre fuld gennemsigtighed, fejlsøgning og langsigtet læring uden afhængighed af debug‑flags eller ad‑hoc logging.

---

## 1. FORMÅL

Observability skal gøre det muligt at:

* rekonstruere ethvert dialogforløb præcist
* skelne mellem UI‑fejl, flow‑fejl og prompt‑fejl
* vurdere evaluatorens faktiske effekt
* understøtte senere forbedringer af prompts, flow og arkitektur

Observability er **ikke valgfrit** og **ikke et debug‑værktøj**.
Det er en grundlæggende systemegenskab.

---

## 2. GRUNDPRINCIPPER

1. **Alt sker per turn**
   Ét brugerinput = ét turn = én atomar observation.

2. **Ingen implicit viden**
   Hvis noget ikke er logget, eksisterer det ikke.

3. **Append‑only**
   Ingen overskrivning, ingen mutation, ingen oprydning i capture‑leddet.

4. **Samme struktur overalt**
   UI, backend, evaluator og senere analyse arbejder på samme datamodel.

---

## 3. TURN‑MODELLEN (KONTRAKT)

Hvert turn SKAL kunne repræsenteres som ét objekt:

### A. Identitet

* `turn_id`
* `session_id`
* `conversation_index` (stack‑index)
* `timestamp`

### B. UI‑INPUT

* `user_input_raw`
* `ui_state`

  * `open`
  * `expanded`
  * `scroll_position`

### C. API‑PAYLOAD

* `messages[]` (fuld rækkefølge)
* `system_prompt_version`
* `evaluator_enabled`

### D. JAN · RAW

* `jan_raw_text`
* `intent_classification` (hvis anvendt)

### E. EVALUATOR

* `evaluator_output_full`
* `evaluator_hint` (nullable)
* `evaluator_decision`

### F. JAN · FINAL

* `jan_final_text`
* `chips_added[]`
* `response_mode`

### G. RESULTAT (udvides senere)

* `user_followup_type`

  * fortsatte
  * afsluttede
  * kontakt
  * forlod dialog

---

## 4. HVOR OBSERVABILITY LEVER

### Udvikling

* Ingen debug‑flags
* Ingen console‑logs som sandhed
* Observation er struktureret og permanent

### Runtime / Produktion

* Append‑only log (DB eller JSONL)
* Ikke UI‑synligt

### Analyse & Forbedring

* Samme struktur genbruges
* Udvides med labels, ratings og outcome‑data

---

## 5. FORBUD

* Ingen skjult logik
* Ingen debug‑only adfærd
* Ingen forskel i flow baseret på miljø
* Ingen UI‑tekster sendt til AI som systeminput

---

## 6. KONTROLKRITERIER

Systemet er kun acceptabelt, hvis man kan:

* genskabe et vilkårligt turn fuldt
* forklare hvorfor et svar blev som det blev
* påvise evaluatorens effekt eller mangel på samme
* identificere om fejl er teknisk eller semantisk

---

## 7. STATUS

Dette dokument er **kontraktstyrende**.
Alle kommende features skal kunne dokumenteres inden for denne model.

Ændringer kræver eksplicit commit‑point.
