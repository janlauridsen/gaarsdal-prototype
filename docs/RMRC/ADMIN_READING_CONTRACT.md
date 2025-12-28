# RMRC · ADMIN READING CONTRACT
Status: Canonical
Scope: v2.0-start-RMRC-build-0.1

Dette dokument definerer den **korrekte og tilladte måde**
at læse, forstå og verificere en RMRC-session
udelukkende via log-events.

Admin-læsning er:
- langsom
- manuel
- ikke-automatisk
- ikke-vurderende

Hvis noget ikke kan forstås ved denne læsning,
er systemet utilstrækkeligt specificeret.

---

## 1. Formål

Admin-læsning har ét formål:

> At verificere, at systemet opførte sig i overensstemmelse
> med RMRC’s arkitektur, kontrakter og grænser.

Admin-læsning bruges **ikke** til:
- at vurdere kvalitet
- at vurdere effekt
- at vurdere brugeroplevelse
- at diagnosticere fejl i indhold

---

## 2. Grundprincipper

- Admin ser **rå events**
- Admin fortolker **ikke**
- Admin rekonstruerer **ikke implicitte handlinger**
- Admin antager **intet**, der ikke står i loggen

Hvis admin må gætte:
→ log-kontrakten er brudt.

---

## 3. Læseenhed: Session

Admin læser **én session ad gangen**.

En session identificeres entydigt ved:
- `sessionId`

Admin må aldrig:
- sammenligne sessioner under læsning
- aggregere under læsning
- drage konklusioner på tværs

Tværgående analyse er batch-arbejde, ikke admin-læsning.

---

## 4. Læserækkefølge (strikt)

Admin læser events i denne rækkefølge:

1. `session_started`
2. Turn-for-turn events
3. `session_ended`
4. (evt.) Epistemic Witness events

Hvis denne rækkefølge ikke kan følges:
→ sessionen er ugyldig.

---

## 5. Turn-baseret læsning

For hver turn læses i følgende rækkefølge:

1. `user_input`
2. `role_execution` (én pr. rolle)
3. `assistant_output`

Admin må kontrollere:

- At alle rolle-events har samme `turn`
- At roller ikke gentages
- At roller ikke refererer til hinandens output
- At `assistant_output` kommer sidst i turn

Admin må **ikke**:
- vurdere om rollerne “var gode”
- vurdere om noget “manglede”

Kun struktur og rækkefølge vurderes.

---

## 6. Rolle-læsning

Når admin læser et `role_execution` event, kontrolleres:

- `role` er eksplicit navngivet
- `promptId` findes og er stabil
- `inputReference` peger kun bagud (fx user_input)
- `output` er tekst, ikke handling eller anbefaling

Admin spørger kun:

> Opførte rollen sig inden for sit kontraktuelle ansvar?

Ikke:
> Var output korrekt, klogt eller nyttigt?

---

## 7. Konsolideret output

`assistant_output` læses som:

- et resultat af systemets konsolidering
- den **eneste** tekst brugeren ser
- ikke et udtryk for sandhed eller løsning

Admin må kontrollere:

- At output ikke indeholder:
  - anbefalinger
  - diagnoser
  - løfter
  - handlingstrin

Indhold vurderes kun ift. **grænser**, ikke kvalitet.

---

## 8. Epistemic Witness Layer (hvis til stede)

EWL-events læses **kun efter session-slut**.

Admin kontrollerer:

- At `layer = epistemic-witness`
- At events ikke påvirker runtime
- At events er formuleret som:
  - hypoteser
  - vidneudsagn
  - åbne observationer

Admin må ikke:
- tage EWL-events som sandhed
- vurdere deres rigtighed

Kun deres **korrekte placering og form** vurderes.

---

## 9. Gyldighedskriterier for en session

En session er gyldig, hvis:

- Alle invarianter i LOGGING_CONTRACT er overholdt
- Alle events kan læses uden antagelser
- Ingen roller overskrider deres mandat
- Ingen runtime-evaluering forekommer
- Ingen EWL-events påvirker sessionen

Hvis én af disse fejler:
→ sessionen forkastes arkitektonisk.

---

## 10. Hvad admin ikke må gøre

Admin må aldrig:

- rette i logs
- annotere logs
- tilføje noter i systemet
- justere prompts
- ændre roller
- træffe designbeslutninger

Admin-læsning informerer design,
men **ændrer aldrig systemet direkte**.

---

## 11. Forhold til batch-analyse

Admin-læsning er:
- kvalitativ
- strukturel
- kontekstuel

Batch-analyse er:
- kvantitativ
- sammenlignende
- mønsterorienteret

De to må aldrig blandes.

---

## 12. Design-intention (kort)

Admin-læsning er ikke en magtposition.
Det er et ansvar.

Formålet er at sikre, at systemet
forbliver forståeligt, ansvarligt
og epistemisk ærligt – også når det vokser.

Dette dokument er en del af RMRC’s
arkitektoniske sikkerhedsnet.
Hvad dette giver dig nu
Du kan læse en session uden at køre noget

Du kan afgøre:

om loggen er tilstrækkelig

om arkitekturen holder

Du har et klart stop-kriterium:

“Kan jeg læse dette uden at gætte?”

