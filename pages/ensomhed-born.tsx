import Head from "next/head"
import Link from "next/link"
import Header from "../components/Header"
import Footer from "../components/Footer"

export default function Page() {
  return (
    <>
      <Header />
      <Head>
        <title>Ensomhed hos børn og unge, hypnoterapi Birkerød | Gaarsdal</title>
        <meta name="description" content="Dit barn er ensomt og har svært ved at skabe forbindelser. Hypnoterapi arbejder med overbevisningen om ikke at være værd at kende. Jan Gaarsdal, Birkerød." />
        <link rel="canonical" href="https://gaarsdal.net/ensomhed-born" />
        <meta property="og:title" content="Ensomhed hos børn og unge, hypnoterapi Birkerød | Gaarsdal" />
        <meta property="og:description" content="Dit barn er ensomt og har svært ved at skabe forbindelser. Hypnoterapi arbejder med overbevisningen om ikke at være værd at kende. Jan Gaarsdal, Birkerød." />
        <meta property="og:image" content="https://gaarsdal.net/Jan-AI.png" />
        <meta property="og:url" content="https://gaarsdal.net/ensomhed-born" />
        <meta name="robots" content="index, follow" />
      </Head>
      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "120px 20px 80px", fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif", lineHeight: 1.7, color: "#333" }}>

        <section style={{ marginBottom: "60px" }}>
          <h1 style={{ fontSize: "34px", fontWeight: 600, lineHeight: 1.25, marginBottom: "20px" }}>Dit barn er ensomt, og du ved ikke hvordan du hjælper</h1>
          <p style={{ fontSize: "18px", color: "#555", marginBottom: "16px", maxWidth: "660px" }}>Det er ikke inviteret med. Det kommer hjem og lukker sig inde. Du spørger hvordan det går, det svarer OK. Du kan se det ikke er OK. Ensomheden fylder, men barnet kan ikke sætte ord på den. Du vil så gerne hjælpe, men ved ikke hvordan.</p>
          <p style={{ fontSize: "16px", color: "#666", maxWidth: "660px" }}>Ensomhed hos børn handler sjældent om manglende sociale evner. Det handler næsten altid om en overbevisning om at andre ikke vil have én.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "20px" }}>Hvad der faktisk sker</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
                        <div style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Overbevisningen er selvforstærkende</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>Et barn, der tror, det ikke er værd at kende trækker sig, undgår initiativ og fortolker andres adfærd negativt. Denne adfærd fører til færre positive sociale erfaringer, som bekræfter overbevisningen. Det er en cirkel, der er svær at bryde udefra.</p>
            </div>
            <div style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Ensomhed er ikke det samme som at være alene</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>Et barn kan være omgivet af folk og føle sig dybt ensomt. Ensomhed er en subjektiv oplevelse af manglende forbindelse. Det handler om kvaliteten af relationer, ikke antallet.</p>
            </div>
            <div style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Langtidsvirkningerne er alvorlige</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>Forskning viser at ensomhed i barndommen øger risikoen for angst, depression og sociale vanskeligheder i voksenlivet. Tidlig adressering er vigtig for barnets langsigtede trivsel.</p>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: "60px", padding: "32px", background: "#f5f7fa", borderRadius: "10px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "16px" }}>Hvad forskning viser</h2>
          <p style={{ fontSize: "15px", marginBottom: "12px" }}>En rapport fra VIVE (Det Nationale Forsknings- og Analysecenter for Velfærd) viser, at en stigende andel af børn og unge i Danmark oplever ensomhed. Sundhedsstyrelsen fremhæver ensomhed som en af de centrale trivselstrusler for unge i dag.</p>
          <p style={{ fontSize: "15px", color: "#666", fontStyle: "italic" }}>Kilde: VIVE Rapport om Børn og Unges Trivsel, <a href="https://www.sst.dk" target="_blank" rel="noopener" style={{ color: "#5a7a8f", textDecoration: "underline" }}>Sundhedsstyrelsen.dk</a>, WHO.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Hvad hypnoterapi gør</h2>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>Hypnoterapi ændrer den grundlæggende overbevisning om barnets sociale værdi. Et barn, der inderst inde tror, det er værd at kende, opfører sig anderledes, spontant og uden at øve teknikker. Forandringen kommer indefra og er bæredygtig.</p>
          <p style={{ fontSize: "15px", color: "#666", maxWidth: "700px" }}>Jan arbejder med ensomhed som en del af et bredere selvbilledarbejde. Forældrene er altid involveret i forløbet.</p>
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
            <Link href="/angst-born" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Angst hos børn</Link>
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
