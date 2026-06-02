import Head from "next/head"
import Link from "next/link"
import Header from "../components/Header"
import Footer from "../components/Footer"

export default function Page() {
  return (
    <>
      <Header />
      <Head>
        <title>Konstant stress og hypnoterapi Birkerød | Gaarsdal</title>
        <meta name="description" content="Stress der ikke slipper, selv i weekenden. Hypnoterapi resetter nervesystemets grundindstilling. Jan Gaarsdal, Birkerød. Gratis forsamtale 30 minutter." />
        <link rel="canonical" href="https://gaarsdal.net/stress" />
        <meta property="og:title" content="Konstant stress og hypnoterapi Birkerød | Gaarsdal" />
        <meta property="og:description" content="Stress der ikke slipper, selv i weekenden. Hypnoterapi resetter nervesystemets grundindstilling. Jan Gaarsdal, Birkerød. Gratis forsamtale 30 minutter." />
        <meta property="og:image" content="https://gaarsdal.net/Jan-AI.png" />
        <meta property="og:url" content="https://gaarsdal.net/stress" />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
      </Head>

      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "120px 20px 80px", fontFamily: "system-ui, -apple-system, sans-serif", lineHeight: 1.7, color: "#333" }}>

        <section style={{ marginBottom: "60px" }}>
          <h1 style={{ fontSize: "34px", fontWeight: 600, lineHeight: 1.25, marginBottom: "20px" }}>Du funktionerer, men det koster mere end det burde</h1>
          <p style={{ fontSize: "18px", color: "#555", marginBottom: "16px", maxWidth: "660px" }}>Du har altid noget der presser. Selv når der objektivt set ikke er grund til stress, er kroppen på vagt. Du slapper ikke rigtig af, ikke eneste i weekenden. Du er ikke i krise, men du er heller ikke i ro.</p>
          <p style={{ fontSize: "16px", color: "#666", maxWidth: "660px" }}>Det er ikke et produktivitetsproblem. Det er et nervesystem der er låst i grundberedskab.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "20px" }}>Hvad der faktisk sker</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
                        <div style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Kroppen ved ikke at krigen er slut</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>Kronisk stress er ikke en reaktion på aktuelle trusler. Det er en grundindstilling. Nervesystemet er kørt i beredskab så længe at det er blevet normaltilstand. Kroppen producerer stresshormoner kontinuerligt, selv når der ikke er noget at flygte fra.</p>
            </div>
            <div style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Hjernen scanner konstant for problemer</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>Et nervesystem under kronisk stress er altid på udkig. Hvad kan gå galt, hvad er ikke løst, hvad mangler. Det er ikke pessimisme, det er et alarmsystem der kører på fuld kraft fordi det ikke har lært at sætte sig i ro.</p>
            </div>
            <div style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Det akkumulerer</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>Kortvarig stress er normal og nødvendig. Kronisk stress er anderledes. Effekterne akkumulerer over tid: søvnkvaliteten falder, koncentrationen svigter, kroppen slider hurtigere. Det er svært at se fordi det sker gradvist.</p>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: "60px", padding: "32px", background: "#f5f7fa", borderRadius: "10px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "16px" }}>Hvad forskning viser</h2>
          <p style={{ fontSize: "15px", marginBottom: "12px" }}>Langvarig stress er en af de hyppigste årsager til sygemeldinger i Danmark. Vidensråd for Forebyggelse vurderer at stress koster det danske samfund betydelige ressourcer i tabte arbejdsdage og sundhedsudgifter. WHO anerkender arbejdsstress som en global sundhedskrise.</p>
          <p style={{ fontSize: "15px", color: "#666", fontStyle: "italic" }}>Kilde: Vidensråd for Forebyggelse, WHO, Sundhedsstyrelsen.dk.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Hvad hypnoterapi gør</h2>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>Hypnoterapi resetter nervesystemets grundindstilling. Dit system lærer at ro er standard, ikke beredskab. Det sker ikke ved afspænding eller mindfulness alene, men ved en dybere ændring i hvad nervesystemet opfatter som normalt.</p>
          <p style={{ fontSize: "15px", color: "#666", maxWidth: "700px" }}>Jan arbejder med kronisk stress hos både erhvervsaktive og unge. Tilgangen tilpasses til om stressen primært sidder i tanker, krop eller overbevisninger om hvad der er nødvendigt.</p>
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
            <Link href="/sovn" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Søvnproblemer</Link>
            <Link href="/kender-du-det" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Kender du det?</Link>
            <Link href="/kontakt" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Kontakt Jan</Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
