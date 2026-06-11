import Head from "next/head"
import Link from "next/link"
import Header from "../components/Header"
import Footer from "../components/Footer"

export default function Page() {
  return (
    <>
      <Header />
      <Head>
        <title>Hypnose mod angst - Birkerød/Nordsjælland | Gratis forsamtale</title>
        <meta name="description" content="Slip angsten ved roden, ikke kun symptomerne. Hypnoterapi i Birkerød, tæt på Holte og Allerød. Gratis forsamtale 30 min. Ring 42 80 74 74." />
        <link rel="canonical" href="https://gaarsdal.net/angst" />
        <meta property="og:title" content="Angst og bekymring, hypnoterapi Birkerød | Gaarsdal" />
        <meta property="og:description" content="Angst der ikke stopper. Bekymringer der kører i ring. Hypnoterapi arbejder med nervesystemet der holder alarmen i gang. Jan Gaarsdal, Birkerød." />
        <meta property="og:image" content="https://gaarsdal.net/Jan-AI.png" />
        <meta property="og:url" content="https://gaarsdal.net/angst" />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: "{\"@context\": \"https://schema.org\", \"@type\": \"FAQPage\", \"mainEntity\": [{\"@type\": \"Question\", \"name\": \"Kan hypnose hjælpe mod angst?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Ja. Hypnoterapi arbejder direkte med nervesystemet og de automatiske reaktioner der driver angsten, ikke kun med tankerne. Mange oplever mærkbar bedring, fordi metoden når ind under den bevidste tænkning, hvor angsten faktisk sidder.\"}}, {\"@type\": \"Question\", \"name\": \"Hvor mange sessioner kræver det?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Det varierer efter angstens type og varighed. Situationsbestemt angst kan ofte bedres på få sessioner, mens mere dybtliggende angst kan kræve et længere forløb. Den gratis forsamtale giver et realistisk billede af dit forløb.\"}}, {\"@type\": \"Question\", \"name\": \"Er hypnose mod angst farligt?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Nej. Hypnose er en naturlig, afslappet tilstand du selv har kontrol over. Du kan ikke fastlåses eller tvinges til noget. Det er en anerkendt psykologisk metode, som blandt andre professor Bobby Zachariae ved Aarhus Universitet har forsket i.\"}}, {\"@type\": \"Question\", \"name\": \"Virker hypnose hvis jeg er skeptisk?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Ja. Du behøver ikke tro på hypnose for at det virker. Du skal blot være villig til at deltage. Hypnose er en fokuseret tilstand de fleste mennesker kan opnå, uanset deres forhåndsindstilling.\"}}, {\"@type\": \"Question\", \"name\": \"Hvad er forskellen på hypnose og medicin mod angst?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Medicin dæmper symptomerne, mens hypnoterapi arbejder med de underliggende mønstre der skaber angsten. Hypnose er en ikke-medicinsk tilgang uden bivirkninger. Ved svær angst bør du altid tale med din læge om den samlede behandling.\"}}]}" }}
        />
      </Head>

      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "120px 20px 80px", fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif", lineHeight: 1.7, color: "#333" }}>

        <section style={{ marginBottom: "60px" }}>
          <h1 style={{ fontSize: "34px", fontWeight: 600, lineHeight: 1.25, marginBottom: "20px" }}>Angsten stopper ikke, selvom du ved det er irrationelt</h1>
          <p style={{ fontSize: "18px", color: "#555", marginBottom: "16px", maxWidth: "660px" }}>Du bekymrer dig. Du ved godt at det sandsynligvis ikke sker. Og alligevel kører tankerne videre. Kroppen spænder op. Det er ikke et valg, det er et nervesystem, der er låst i beredskab.</p>
          <p style={{ fontSize: "16px", color: "#666", maxWidth: "660px" }}>Angst er ikke en tankeforstyrrelse. Det er en kropslig tilstand, der aktiveres automatisk, og som rationelle argumenter ikke kan nå ind til.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "20px" }}>Hvad der faktisk sker</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
                        <div style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Nervesystemet er i alarmberedskab</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>Angst starter ikke i tankerne, det starter i amygdala, hjernens alarmsystem. Når den vurderer en situation som farlig, sendes signaler til kroppen, der sætter den i beredskab. Det sker hurtigere end bevidst tænkning, og kan ikke stoppes ved at tænke sig til det.</p>
            </div>
            <div style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Bekymring er en vane, ikke en løsning</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>Hjernen har lært, at bekymring giver kontrol. At gennemtænke scenarierne giver en illusion af forberedelse. I virkeligheden vedligeholder det alarmsystemet og gør det mere sensitivt over tid. Jo mere du bekymrer dig, jo lettere aktiveres angsten.</p>
            </div>
            <div style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Kroppen husker det tankerne glemmer</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>Angst sidder i kroppen som en lært reaktion. Et sted, en lyd, en situation, og reaktionen kører automatisk. Det er ikke svaghed, det er et nervesystem der har lært at beskytte dig, men glemmer at slukke alarmen igen.</p>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: "60px", padding: "32px", background: "#f5f7fa", borderRadius: "10px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "16px" }}>Hvad forskning viser</h2>
          <p style={{ fontSize: "15px", marginBottom: "12px" }}>Angst er en af de hyppigste årsager til psykisk mistrivsel i Danmark. Sundhedsstyrelsen estimerer, at op mod 15 pct. af befolkningen oplever angstlidelser på et tidspunkt i livet. WHO placerer angst blandt de mest udbredte psykiske lidelser globalt.</p>
          <p style={{ fontSize: "15px", color: "#666", fontStyle: "italic" }}>Kilde: Sundhedsstyrelsen.dk, WHO Mental Health Report.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Hvad hypnoterapi gør</h2>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>Hypnoterapi arbejder direkte med det lag, der kører angsten, nervesystemet og de automatiske reaktioner, ikke med tankerne alene. Du lærer at skifte fra alarmberedskab til ro ved at ændre, hvad der sker automatisk, ikke ved at kæmpe mod tankerne.</p>
          <p style={{ fontSize: "15px", color: "#666", maxWidth: "700px" }}>Jan arbejder med generaliseret angst, social angst og situationsbestemt angst. Tilgangen tilpasses til, hvad der driver din specifikke angst.</p>
        </section>

        <section style={{ marginBottom: "48px", padding: "32px", background: "#f9fafb", borderRadius: "10px", borderLeft: "3px solid #5a7a8f" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>Jan Gaarsdal, hypnoterapeut i Birkerød</h2>
          <p style={{ fontSize: "15px", color: "#555", marginBottom: "16px", lineHeight: 1.7 }}>
            Jan arbejder med dette område hos voksne og unge. Den gratis forsamtale på 30 minutter afklarer om hypnoterapi er den rette tilgang for dig.
          </p>
          <div style={{ padding: "12px 16px", background: "#f0f4f8", borderRadius: "6px", display: "inline-block" }}>
            <p style={{ fontSize: "14px", fontWeight: 500, color: "#333", margin: "0 0 8px" }}>
              🎯 Gratis forsamtale, 30 minutter, telefon eller fysisk
            </p>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <Link href="/kontakt" style={{ fontSize: "14px", color: "#fff", background: "#5a7a8f", textDecoration: "none", fontWeight: 500, padding: "8px 16px", borderRadius: "4px" }}>
                Book forsamtale
              </Link>
              <a href="tel:+4542807474" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", fontWeight: 500, padding: "8px 0" }}>
                Ring +45 42 80 74 74
              </a>
            </div>
          </div>
        </section>

        {/* INDSIGT ER IKKE NOK */}
        <section style={{ marginBottom: "60px", padding: "28px 32px", background: "#f0f4f8", borderRadius: "10px", borderLeft: "3px solid #5a7a8f" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>Indsigt er ikke det samme som forandring</h2>
          <p style={{ fontSize: "15px", color: "#555", maxWidth: "700px", margin: 0 }}>Du ved måske allerede hvad du er bange for, og at det er irrationelt. Måske har du læst om angst eller talt med en AI om den. Men angsten kører videre alligevel, fordi den ikke sidder i det du ved, men i det der reagerer hurtigere end tanken.</p>
        </section>

                <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "24px" }}>Ofte stillede spørgsmål</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ borderBottom: "1px solid #eee", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#333" }}>Kan hypnose hjælpe mod angst?</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7 }}>Ja. Hypnoterapi arbejder direkte med nervesystemet og de automatiske reaktioner der driver angsten, ikke kun med tankerne. Mange oplever mærkbar bedring, fordi metoden når ind under den bevidste tænkning, hvor angsten faktisk sidder.</p>
            </div>
            <div style={{ borderBottom: "1px solid #eee", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#333" }}>Hvor mange sessioner kræver det?</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7 }}>Det varierer efter angstens type og varighed. Situationsbestemt angst kan ofte bedres på få sessioner, mens mere dybtliggende angst kan kræve et længere forløb. Den gratis forsamtale giver et realistisk billede af dit forløb.</p>
            </div>
            <div style={{ borderBottom: "1px solid #eee", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#333" }}>Er hypnose mod angst farligt?</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7 }}>Nej. Hypnose er en naturlig, afslappet tilstand du selv har kontrol over. Du kan ikke fastlåses eller tvinges til noget. Det er en anerkendt psykologisk metode, som blandt andre professor Bobby Zachariae ved Aarhus Universitet har forsket i.</p>
            </div>
            <div style={{ borderBottom: "1px solid #eee", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#333" }}>Virker hypnose hvis jeg er skeptisk?</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7 }}>Ja. Du behøver ikke tro på hypnose for at det virker. Du skal blot være villig til at deltage. Hypnose er en fokuseret tilstand de fleste mennesker kan opnå, uanset deres forhåndsindstilling.</p>
            </div>
            <div style={{ borderBottom: "1px solid #eee", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#333" }}>Hvad er forskellen på hypnose og medicin mod angst?</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7 }}>Medicin dæmper symptomerne, mens hypnoterapi arbejder med de underliggende mønstre der skaber angsten. Hypnose er en ikke-medicinsk tilgang uden bivirkninger. Ved svær angst bør du altid tale med din læge om den samlede behandling.</p>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 500, color: "#888", marginBottom: "12px" }}>Relaterede emner</h2>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                        <Link href="/sovn" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Søvnproblemer</Link>
            <Link href="/stress" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Stress</Link>
            <Link href="/kender-du-det" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Kender du det?</Link>
            <Link href="/kaerlighed" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Kærlighed og relationer</Link>
            <Link href="/kontakt" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Kontakt Jan</Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
