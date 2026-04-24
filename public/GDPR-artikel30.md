# Artikel 30-behandlingsregister
**Gaarsdal — Jan Lauridsen Hypnoterapi**
Sidst opdateret: april 2026

---

## Den dataansvarlige

| Felt | Oplysning |
|------|-----------|
| Navn | Jan Erik Gaarsdal Lauridsen |
| Virksomhed | Gaarsdal |
| Adresse | Birkerød |
| E-mail | jan@gaarsdal.net |
| Telefon | +45 42 80 74 74 |

---

## Behandlingsaktivitet 1: Chatbot-sessionsforberedelse

### Formål
At hjælpe klienter med at forberede sig til hypnoterapisessioner via guidet samtale. Chatbotten fungerer som et samtaleforberedende værktøj — ikke som behandling.

### Retsligt grundlag
GDPR artikel 9, stk. 2, litra a — **udtrykkeligt samtykke** fra den registrerede til behandling af særlige kategorier af personoplysninger (helbredsoplysninger).

### Kategorier af registrerede
Besøgende på gaarsdal.net der frivilligt starter en chat og afgiver samtykke.

### Kategorier af personoplysninger
- **Almindelige:** Teknisk bruger-ID (UUID, genereret lokalt i browser), tidsstempler, IP-adresse (rate limiting, slettes inden for 1 time)
- **Særlige (art. 9):** Oplysninger om helbred, psykiske forhold, traumer, symptomer og vaner som brugeren selv afgiver i chatsamtalen

### Modtagere / videregivelse
Ingen videregivelse til tredjeparter. Følgende databehandlere anvendes:

| Databehandler | Rolle | Land | Overførselsgrundlag |
|---------------|-------|------|---------------------|
| Vercel Inc. | Hosting / serverless runtime | USA | EU-US Data Privacy Framework |
| Upstash Inc. | Redis-baseret datalager | USA (EU-region mulig) | Standardkontraktbestemmelser (SCC) |
| OpenAI OpCo LLC | LLM-inferens (ingen logning) | USA | SCC + zero data retention aftale |
| Resend Inc. | Transaktionel e-mail (notifikationer til dataansvarlig) | USA | SCC |

### Opbevaringsperioder
Opbevaringsperioden vælges af brugeren ved samtykke:

| Valg | Opbevaringsperiode |
|------|--------------------|
| Kun denne samtale | Maks. 2 timer (TTL i Redis) |
| 30 dage | 30 dage fra seneste aktivitet |
| 90 dage | 90 dage fra seneste aktivitet (standard) |
| 1 år | 365 dage fra seneste aktivitet |

Ved sletningsanmodning ("Slet mine data") slettes alle nøgler med brugerens UUID omgående.

### Tekniske og organisatoriske sikkerhedsforanstaltninger
- Al kommunikation krypteret via TLS 1.2+
- Bruger-ID er et pseudonymt UUID — ingen direkte kobling til navn/e-mail medmindre brugeren selv oplyser det
- Adgang til Redis-data kræver admin-token
- Ingen backup af særlige kategorier af data ud over Redis-TTL
- Kodebase er offentlig tilgængelig (GitHub) — ingen hemmeligheder i kode

### De registreredes rettigheder
Brugere kan til enhver tid:
- Trække samtykke tilbage via "Slet mine data" i chatgrænsefladen
- Anmode om indsigt, berigtigelse eller sletning via jan@gaarsdal.net
- Klage til Datatilsynet (dt.dk)

---

## Behandlingsaktivitet 2: Kontaktformular (gaarsdal.net/kontakt)

### Formål
Modtage henvendelser fra potentielle og eksisterende klienter.

### Retsligt grundlag
GDPR artikel 6, stk. 1, litra b — nødvendigt for at opfylde en kontrakt eller træffe foranstaltninger forud for indgåelse af kontrakt.

### Kategorier af personoplysninger
Navn, e-mail, telefonnummer, beskedindhold (kan indeholde helbredsoplysninger — art. 9).

### Opbevaring
Kontaktoplysninger opbevares i Redis i 180 dage. E-mail videresendes til jan@gaarsdal.net via Resend.

### Modtagere
Resend Inc. (transaktionel e-mail). Ingen yderligere videregivelse.

---

## Behandlingsaktivitet 3: Besøgsstatistik (hits)

### Formål
Anonymiseret trafikmåling til forståelse af brug af gaarsdal.net.

### Retsligt grundlag
GDPR artikel 6, stk. 1, litra f — legitim interesse (driftsoptimering).

### Kategorier af personoplysninger
By, postnummer, anonymt session-ID. Ingen IP-adresse gemmes permanent.

### Opbevaring
30 dage rullende vindue i Redis.

---

*Dette register føres i henhold til GDPR artikel 30, stk. 1, og skal på anmodning fremvises for Datatilsynet.*
