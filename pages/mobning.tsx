import Head from "next/head"
import Link from "next/link"
import Header from "../components/Header"
import Footer from "../components/Footer"

export default function Page() {
  return (
    <>
      <Header />
      <Head>
        <title>Mobning, børn og unge, hypnoterapi Birkerød | Gaarsdal</title>
        <meta name="description" content="Mobning efterlader overbevisninger om skyld og skam der sidder længe efter mobningen stopper. Hypnoterapi arbejder med hvad barnet tror om sig selv nu. Jan Gaarsdal." />
        <link rel="canonical" href="https://gaarsdal.net/mobning" />
        <meta property="og:title" content="Mobning, børn og unge, hypnoterapi Birkerød | Gaarsdal" />
        <meta property="og:description" content="Mobning efterlader overbevisninger om skyld og skam der sidder længe efter mobningen stopper. Hypnoterapi arbejder med hvad barnet tror om sig selv nu. Jan Gaarsdal." />
        <meta property="og:image" content="https://gaarsdal.net/Jan-AI.png" />
        <meta property="og:url" content="https://gaarsdal.net/mobning" />
        <meta name="robots" content="index, follow" />
      </Head>
      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "120px 20px 80px", fontFamily: "system-ui, -apple-system, sans-serif", lineHeight: 1.7, color: "#333" }}>

        <section style={{ marginBottom: "60px" }}>
          <h1 style={{ fontSize: "34px", fontWeight: 600, lineHeight: 1.25, marginBottom: "20px" }}>Mobningen er stoppet, men dit barn er ikke sig selv igen</h1>
          <p style={{ fontSize: "18px", color: "#555", marginBottom: "16px", maxWidth: "660px" }}>Barnet trækker sig, vil ikke i skole, er ændret. Du siger at det ikke var barnets skyld. Det ved barnet godt. Det hjælper alligevel ikke. Mobning efterlader ikke kun minder. Det efterlader overbevisninger om hvem man er, som sidder langt efter selve mobningen stopper.</p>
          <p style={{ fontSize: "16px", color: "#666", maxWidth: "660px" }}>Det er ikke det der skete der holder barnet fast. Det er hvad hjernen konkluderede om sig selv i situationen.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "20px" }}>Hvad der faktisk sker</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
                        <div style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Mobning omprogrammerer selvopfattelsen</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>Under vedvarende mobning lærer hjernen at der er noget galt med én. Ikke som en bevidst tanke, men som en automatisk konklusion. Overbevisningerne, om at man er anderledes, svagere, ikke ønsket, sidder som et lag under al bevidst tænkning.</p>
            </div>
            <div style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Skam sidder dybere end skyld</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>Skyld handler om hvad man har gjort. Skam handler om hvem man er. Mobning aktiverer skam, ikke skyld. Det er det der gør det så svært at komme videre, selvom barnet rationelt ved at det ikke var dets ansvar.</p>
            </div>
            <div style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Nye sociale relationer reparerer det ikke alene</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>Et nyt klassemiljø eller nye venner hjælper, men ændrer ikke automatisk de overbevisninger der er skabt. Barnet tager dem med ind i de nye relationer og fortolker verden gennem dem.</p>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: "60px", padding: "32px", background: "#f5f7fa", borderRadius: "10px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "16px" }}>Hvad forskning viser</h2>
          <p style={{ fontSize: "15px", marginBottom: "12px" }}>Forskning viser at mobning har langvarige psykologiske konsekvenser. Børn der har været udsat for mobning har øget risiko for angst, depression og lavt selvværd i voksenlivet. Tidlig bearbejdning reducerer risikoen for langvarige konsekvenser markant.</p>
          <p style={{ fontSize: "15px", color: "#666", fontStyle: "italic" }}>Kilde: Sundhedsstyrelsen.dk, Nationalt Videnscenter for Trivsel og Mobning, Olweus Bullying Research.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Hvad hypnoterapi gør</h2>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>Hypnoterapi arbejder med de overbevisninger om skyld og skam som mobning efterlader. Ikke med hvad der skete, men med hvad barnet tror om sig selv nu. Mange børn oplever en mærkbar lettelse og bedre selvbillede efter 1-2 sessioner.</p>
          <p style={{ fontSize: "15px", color: "#666", maxWidth: "700px" }}>Jan arbejder med mobningens eftervirkninger hos børn og unge. Forældrene inddrages altid. Tilgangen er skånsom og tilpasset barnets alder.</p>
        </section>

        <section style={{ marginBottom: "48px", padding: "32px", background: "#f9fafb", borderRadius: "10px", borderLeft: "3px solid #5a7a8f" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>Jan Gaarsdal, hypnoterapeut i Birkerød</h2>
          <p style={{ fontSize: "15px", color: "#555", marginBottom: "16px", lineHeight: 1.7 }}>
            Jan arbejder med børn fra 8 år og involverer altid forældrene i forløbet. Den gratis forsamtale på 30 minutter, telefon eller fysisk, afklarer om hypnoterapi er det rette for dit barn.
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
            <Link href="/selvbillede-born" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Selvbillede</Link>
            <Link href="/social-angst-born" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Socialt udenfor</Link>
            <Link href="/children" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Børn & Unge</Link>
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
