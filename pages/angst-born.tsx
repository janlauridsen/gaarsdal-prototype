import Head from "next/head"
import Link from "next/link"
import Header from "../components/Header"
import Footer from "../components/Footer"

export default function Page() {
  return (
    <>
      <Header />
      <Head>
        <title>Angst hos børn og unge, hypnoterapi Birkerød | Gaarsdal</title>
        <meta name="description" content="Dit barn er angst og bekymret for alt. Hypnoterapi arbejder med nervesystemet der er låst i alarmberedskab. Jan Gaarsdal, Birkerød." />
        <link rel="canonical" href="https://gaarsdal.net/angst-born" />
        <meta property="og:title" content="Angst hos børn og unge, hypnoterapi Birkerød | Gaarsdal" />
        <meta property="og:description" content="Dit barn er angst og bekymret for alt. Hypnoterapi arbejder med nervesystemet der er låst i alarmberedskab. Jan Gaarsdal, Birkerød." />
        <meta property="og:image" content="https://gaarsdal.net/Jan-AI.png" />
        <meta property="og:url" content="https://gaarsdal.net/angst-born" />
        <meta name="robots" content="index, follow" />
      </Head>
      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "120px 20px 80px", fontFamily: "system-ui, -apple-system, sans-serif", lineHeight: 1.7, color: "#333" }}>
        <section style={{ marginBottom: "60px" }}>
          <h1 style={{ fontSize: "34px", fontWeight: 600, lineHeight: 1.25, marginBottom: "20px" }}>Dit barn bekymrer sig om alt og kan ikke slappe af</h1>
          <p style={{ fontSize: "18px", color: "#555", maxWidth: "660px" }}>Det bekymrer sig om skolen, venner, fremtiden og ting der endnu ikke er sket. Det virker som om det altid venter på at noget går galt. Du prøver at berolige det, men det hjælper kun kortvarigt.</p>
        </section>
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Hvad hypnoterapi gør</h2>
          <p style={{ fontSize: "15px", color: "#555", maxWidth: "700px" }}>Hypnoterapi arbejder med nervesystemet, ikke med tankerne. Barnet lærer at skifte fra alarmberedskab til ro via nye indre billeder og reaktionsmønstre. Det behøver ikke forstå sin angst for at ændre den.</p>
        </section>
        <section style={{ marginBottom: "48px", padding: "32px", background: "#f9fafb", borderRadius: "10px", borderLeft: "3px solid #5a7a8f" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>Jan Gaarsdal, hypnoterapeut i Birkerød</h2>
          <p style={{ fontSize: "15px", color: "#555", marginBottom: "16px" }}>
            Jan arbejder med børn fra 8 år og involverer altid forældrene i forløbet. Den gratis forsamtale på 30 minutter afklarer om hypnoterapi er det rette for dit barn.
          </p>
          <div style={{ padding: "12px 16px", background: "#f0f4f8", borderRadius: "6px", display: "inline-block" }}>
            <p style={{ fontSize: "14px", fontWeight: 500, color: "#333", margin: "0 0 8px" }}>🎯 Gratis forsamtale, 30 minutter, telefon eller fysisk</p>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <Link href="/kontakt" style={{ fontSize: "14px", color: "#fff", background: "#5a7a8f", textDecoration: "none", fontWeight: 500, padding: "8px 16px", borderRadius: "4px" }}>Book forsamtale</Link>
              <a href="tel:+4542807474" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", fontWeight: 500, padding: "8px 0" }}>Ring +45 42 80 74 74</a>
            </div>
          </div>
        </section>
        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 500, color: "#888", marginBottom: "12px" }}>Relaterede emner</h2>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href="/children" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Børn & Unge</Link>
            <Link href="/priser" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Priser</Link>
            <Link href="/kontakt" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Kontakt Jan</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
