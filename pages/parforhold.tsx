import Head from "next/head"
import Link from "next/link"
import Header from "../components/Header"
import Footer from "../components/Footer"

export default function Page() {
  return (
    <>
      <Header />
      <Head>
        <title>Parforhold og kommunikation, hypnoterapi Birkerød | Gaarsdal</title>
        <meta name="description" content="Mønstre i parforholdet, der gentager sig. Hypnoterapi arbejder med de individuelle reaktioner, der driver konflikterne. Jan Gaarsdal, Birkerød." />
        <link rel="canonical" href="https://gaarsdal.net/parforhold" />
        <meta property="og:title" content="Parforhold og kommunikation, hypnoterapi Birkerød | Gaarsdal" />
        <meta property="og:description" content="Mønstre i parforholdet der gentager sig. Hypnoterapi arbejder med de individuelle reaktioner der driver konflikterne. Jan Gaarsdal, Birkerød." />
        <meta property="og:image" content="https://gaarsdal.net/Jan-AI.png" />
        <meta property="og:url" content="https://gaarsdal.net/parforhold" />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: "{\"@context\": \"https://schema.org\", \"@type\": \"FAQPage\", \"mainEntity\": [{\"@type\": \"Question\", \"name\": \"Tilbyder Jan parterapi?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Jan tilbyder en fælles indledende session for par, hvor mønstrene i relationen kortlægges. Derefter arbejdes der individuelt med de reaktioner og overbevisninger hver part bringer ind i forholdet. Det er ikke klassisk parterapi, men individuel hypnoterapi med fokus på relationen.\"}}, {\"@type\": \"Question\", \"name\": \"Hvordan kan individuel hypnose hjælpe vores parforhold?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"De fleste konflikter i parforhold drives af individuelle reaktionsmønstre formet af tidlige erfaringer. Når den enkelte arbejder med sine egne automatiske reaktioner, ændres dynamikken i forholdet ofte mærkbart.\"}}, {\"@type\": \"Question\", \"name\": \"Skal vi begge deltage?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"I den indledende session er det en fordel at I begge deltager, så mønstrene kan kortlægges sammen. Det efterfølgende arbejde foregår individuelt. Den gratis forsamtale afklarer hvad der passer til jer.\"}}, {\"@type\": \"Question\", \"name\": \"Kan hypnose redde et parforhold i krise?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Hypnoterapi kan ikke garantere et bestemt udfald, men det kan ændre de individuelle reaktioner der driver konflikterne. Det giver et nyt udgangspunkt, uanset hvilken retning forholdet derefter tager.\"}}]}" }}
        />
      </Head>
      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "120px 20px 80px", fontFamily: "system-ui, -apple-system, sans-serif", lineHeight: 1.7, color: "#333" }}>
        <section style={{ marginBottom: "60px" }}>
          <h1 style={{ fontSize: "34px", fontWeight: 600, lineHeight: 1.25, marginBottom: "20px" }}>De samme konflikter bliver ved at komme tilbage</h1>
          <p style={{ fontSize: "18px", color: "#555", marginBottom: "16px", maxWidth: "660px" }}>I kender godt mønsteret. En situation opstår, reaktionerne kører, og efterfølgende ved I begge at det gik galt igen. Samtaler om det ændrer ikke på hvad der sker næste gang.</p>
          <p style={{ fontSize: "16px", color: "#666", maxWidth: "660px" }}>Konflikter i parforholdet handler sjældent om det, de tilsyneladende handler om. De handler om de individuelle reaktionsmønstre, hver part bringer med ind.</p>
        </section>
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "20px" }}>Hvad der faktisk sker</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
                        <div style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Reaktionsmønstre er lært</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>Hvad der udløser en reaktion, og hvordan vi reagerer, er i høj grad formet af tidlige erfaringer. Disse mønstre er automatiske og kører under bevidst styring. Det forklarer, hvorfor det er svært at opføre sig anderledes, selv når man vil det.</p>
            </div>
            <div style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Kommunikation er symptom, ikke årsag</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>Kommunikationsproblemer i parforholdet er typisk et symptom på underliggende reaktionsmønstre, ikke årsagen. At lære nye kommunikationsteknikker hjælper, men ændrer ikke de automatiske reaktioner, der driver konflikterne.</p>
            </div>
            <div style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Individuelle mønstre påvirker parret</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>Hver persons individuelle angst, selvbillede og reaktionsmønstre spiller direkte ind i dynamikken i parforholdet. At arbejde individuelt med disse mønstre kan have stor effekt på relationen.</p>
            </div>
          </div>
        </section>
        <section style={{ marginBottom: "60px", padding: "32px", background: "#f5f7fa", borderRadius: "10px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "16px" }}>Hvad forskning viser</h2>
          <p style={{ fontSize: "15px", marginBottom: "12px" }}>Parforholdsproblemer er en af de hyppigste årsager til at søge psykologisk støtte. Forskning viser, at individuel terapi der adresserer underliggende mønstre kan have positiv effekt på parrelationer.</p>
          <p style={{ fontSize: "15px", color: "#666", fontStyle: "italic" }}>Kilde: Gottman Institute Research, Sundhedsstyrelsen.dk.</p>
        </section>
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Hvad hypnoterapi gør</h2>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>Jan tilbyder en fælles indledende session for par, hvor mønstrene i relationen kortlægges. Derefter arbejdes der individuelt med de reaktioner og overbevisninger, den enkelte bringer ind i forholdet.</p>
          <p style={{ fontSize: "15px", color: "#666", maxWidth: "700px" }}>Tilgangen er ikke parterapi i traditionel forstand, men individuel hypnoterapi med fokus på de mønstre, der påvirker relationen. Den gratis forsamtale afklarer om det giver mening.</p>
        </section>
        <section style={{ marginBottom: "48px", padding: "32px", background: "#f9fafb", borderRadius: "10px", borderLeft: "3px solid #5a7a8f" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>Jan Gaarsdal, hypnoterapeut i Birkerød</h2>
          <p style={{ fontSize: "15px", color: "#555", marginBottom: "16px", lineHeight: 1.7 }}>
            Den gratis forsamtale på 30 minutter, telefon eller fysisk, afklarer om hypnoterapi er den rette tilgang for dig.
          </p>
          <div style={{ padding: "12px 16px", background: "#f0f4f8", borderRadius: "6px", display: "inline-block" }}>
            <p style={{ fontSize: "14px", fontWeight: 500, color: "#333", margin: "0 0 8px" }}>🎯 Gratis forsamtale, 30 minutter, telefon eller fysisk</p>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <Link href="/kontakt" style={{ fontSize: "14px", color: "#fff", background: "#5a7a8f", textDecoration: "none", fontWeight: 500, padding: "8px 16px", borderRadius: "4px" }}>Book forsamtale</Link>
              <a href="tel:+4542807474" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", fontWeight: 500, padding: "8px 0" }}>Ring +45 42 80 74 74</a>
            </div>
          </div>
        </section>
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "24px" }}>Ofte stillede spørgsmål</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ borderBottom: "1px solid #eee", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#333" }}>Tilbyder Jan parterapi?</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7 }}>Jan tilbyder en fælles indledende session for par, hvor mønstrene i relationen kortlægges. Derefter arbejdes der individuelt med de reaktioner og overbevisninger hver part bringer ind i forholdet. Det er ikke klassisk parterapi, men individuel hypnoterapi med fokus på relationen.</p>
            </div>
            <div style={{ borderBottom: "1px solid #eee", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#333" }}>Hvordan kan individuel hypnose hjælpe vores parforhold?</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7 }}>De fleste konflikter i parforhold drives af individuelle reaktionsmønstre formet af tidlige erfaringer. Når den enkelte arbejder med sine egne automatiske reaktioner, ændres dynamikken i forholdet ofte mærkbart.</p>
            </div>
            <div style={{ borderBottom: "1px solid #eee", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#333" }}>Skal vi begge deltage?</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7 }}>I den indledende session er det en fordel at I begge deltager, så mønstrene kan kortlægges sammen. Det efterfølgende arbejde foregår individuelt. Den gratis forsamtale afklarer hvad der passer til jer.</p>
            </div>
            <div style={{ borderBottom: "1px solid #eee", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#333" }}>Kan hypnose redde et parforhold i krise?</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7 }}>Hypnoterapi kan ikke garantere et bestemt udfald, men det kan ændre de individuelle reaktioner der driver konflikterne. Det giver et nyt udgangspunkt, uanset hvilken retning forholdet derefter tager.</p>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 500, color: "#888", marginBottom: "12px" }}>Relaterede emner</h2>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href="/angst" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Angst</Link>
            <Link href="/selvvaerd" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Selvværd</Link>
            <Link href="/kender-du-det" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Kender du det?</Link>
            <Link href="/kontakt" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Kontakt Jan</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
