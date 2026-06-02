import Head from "next/head"
import Link from "next/link"
import Header from "../components/Header"
import Footer from "../components/Footer"

export default function Page() {
  return (
    <>
      <Header />
      <Head>
        <title>Rygestop med hypnoterapi Birkerød | Stop med at ryge | Gaarsdal</title>
        <meta name="description" content="Vil du holde op med at ryge? Hypnoterapi arbejder med trangen, ikke viljestyrken. Jan Gaarsdal, Birkerød. Gratis forsamtale 30 minutter." />
        <link rel="canonical" href="https://gaarsdal.net/rygestop" />
        <meta property="og:title" content="Rygestop med hypnoterapi Birkerød | Stop med at ryge | Gaarsdal" />
        <meta property="og:description" content="Vil du holde op med at ryge? Hypnoterapi arbejder med trangen, ikke viljestyrken. Jan Gaarsdal, Birkerød. Gratis forsamtale 30 minutter." />
        <meta property="og:image" content="https://gaarsdal.net/Jan-AI.png" />
        <meta property="og:url" content="https://gaarsdal.net/rygestop" />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
      </Head>

      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "120px 20px 80px", fontFamily: "system-ui, -apple-system, sans-serif", lineHeight: 1.7, color: "#333" }}>

        <section style={{ marginBottom: "60px" }}>
          <h1 style={{ fontSize: "34px", fontWeight: 600, lineHeight: 1.25, marginBottom: "20px" }}>Du vil gerne stoppe, men lysten kommer tilbage</h1>
          <p style={{ fontSize: "18px", color: "#555", marginBottom: "16px", maxWidth: "660px" }}>Du har prøvet at holde op. Måske flere gange. De første dage går godt. Og så er du i en bestemt situation, stress, kaffe, pause, og lysten er der automatisk. Viljestyrke slår fra præcis når det gælder.</p>
          <p style={{ fontSize: "16px", color: "#666", maxWidth: "660px" }}>Det er ikke mangel på motivation. Det er fordi trangen sidder et andet sted end beslutningen.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "20px" }}>Hvad der faktisk sker</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
                        <div style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Trangen er ikke i tankerne</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>Rygning er koblet til belønningssystemet i hjernens basale dele. Ikke til den del der beslutter og planlægger. Hjernen har lært, at cigaretten giver ro, pause, belønning. Den kobling kører automatisk og er stærkere end intentionen i det øjeblik den udløses.</p>
            </div>
            <div style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Triggere styrer adfærden</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>Kaffe, stress, bestemte tidspunkter, bestemte steder. Hjernen har koblet disse situationer direkte til rygning. Det er ikke et valg i øjeblikket, det er en automatisk reaktion på en trigger. Det er derfor, beslutningen ikke er nok alene.</p>
            </div>
            <div style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Viljestyrke udtømmes</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>Viljestyrke er en begrænset ressource. Jo mere du bruger den på at modstå trangen, jo sværere bliver det over tid, særligt i stressede situationer. Det forklarer mønsteret: det går godt i starten, og glider bagud, når livet presser.</p>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: "60px", padding: "32px", background: "#f5f7fa", borderRadius: "10px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "16px" }}>Hvad forskning viser</h2>
          <p style={{ fontSize: "15px", marginBottom: "12px" }}>Rygning er den enkeltfaktor der koster flest leveår i Danmark. Sundhedsstyrelsen vurderer, at ca. 3.800 danskere dør af rygning hvert år. Mange forsøger at stoppe, men mere end halvdelen ryger igen inden for et år ved brug af viljestyrke alene.</p>
          <p style={{ fontSize: "15px", color: "#666", fontStyle: "italic" }}>Kilde: Sundhedsstyrelsen.dk, Kræftens Bekæmpelse.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Hvad hypnoterapi gør</h2>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>Hypnoterapi arbejder direkte med de associationer der driver trangen, ikke med viljestyrken. Hjernen lærer at afkoble triggerne fra reaktionen. Mange oplever at lysten falder markant efter én til to sessioner.</p>
          <p style={{ fontSize: "15px", color: "#666", maxWidth: "700px" }}>Jan tilpasser sin tilgang til, hvad der driver dit specifikke rygemønster. Hvad udløser trangen, hvad dækker rygningen over, og hvad skal erstatte det.</p>
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

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 500, color: "#888", marginBottom: "12px" }}>Relaterede emner</h2>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                        <Link href="/angst" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Angst</Link>
            <Link href="/stress" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Stress</Link>
            <Link href="/kender-du-det" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Kender du det?</Link>
            <Link href="/kontakt" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Kontakt Jan</Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
