import Head from "next/head"
import Link from "next/link"
import Header from "../components/Header"
import Footer from "../components/Footer"

export default function Page() {
  return (
    <>
      <Header />
      <Head>
        <title>Socialt udenfor, børn og unge, hypnoterapi Birkerød | Gaarsdal</title>
        <meta name="description" content="Dit barn føler sig udenfor og har svært ved venskaber. Hypnoterapi arbejder med selvopfattelsen, der driver adfærden. Jan Gaarsdal, Birkerød." />
        <link rel="canonical" href="https://gaarsdal.net/social-angst-born" />
        <meta property="og:title" content="Socialt udenfor, børn og unge, hypnoterapi Birkerød | Gaarsdal" />
        <meta property="og:description" content="Dit barn føler sig udenfor og har svært ved venskaber. Hypnoterapi arbejder med selvopfattelsen der driver adfærden. Jan Gaarsdal, Birkerød." />
        <meta property="og:image" content="https://gaarsdal.net/Jan-AI.png" />
        <meta property="og:url" content="https://gaarsdal.net/social-angst-born" />
        <meta name="robots" content="index, follow" />
      </Head>
      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "120px 20px 80px", fontFamily: "system-ui, -apple-system, sans-serif", lineHeight: 1.7, color: "#333" }}>

        <section style={{ marginBottom: "60px" }}>
          <h1 style={{ fontSize: "34px", fontWeight: 600, lineHeight: 1.25, marginBottom: "20px" }}>Dit barn er der, men føler sig ikke med</h1>
          <p style={{ fontSize: "18px", color: "#555", marginBottom: "16px", maxWidth: "660px" }}>Det er inviteret med men trækker sig. Det har klassekammerater men ingen rigtige venner. Det deltager ikke i samtaler og sidder for sig selv i frikvarteret. Du kan se, at det er ensomt men det vil ikke tale om det, eller ved ikke selv, hvad der er galt.</p>
          <p style={{ fontSize: "16px", color: "#666", maxWidth: "660px" }}>Sociale vanskeligheder hos børn handler sjældent om manglende sociale evner. Det handler næsten altid om, hvad barnet tror om sig selv i andres øjne.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "20px" }}>Hvad der faktisk sker</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
                        <div style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Selvopfattelsen styrer adfærden</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>Børn, der tror, de ikke er værd at kende trækker sig, undgår initiativ og fortolker andres adfærd negativt. Overbevisningen er selvforstærkende: jo mere barnet trækker sig, jo færre positive sociale erfaringer, jo stærkere bekræftes overbevisningen.</p>
            </div>
            <div style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Det er ikke generthed</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>Generthed er en temperamentsmæssig disposition. Social angst er en lært frygtreaktion. Barnet ønsker socialt samvær, men frygter det og undgår det. Forskellen er vigtig, fordi løsningen er forskellig.</p>
            </div>
            <div style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Sociale teknikker løser det ikke</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>At lære barnet at stille spørgsmål og huske navne hjælper ikke, hvis grundoverbevisningen er, at andre ikke bryder sig. Teknikker oven på en negativ selvopfattelse holder ikke. Selvopfattelsen skal ændres ved roden.</p>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: "60px", padding: "32px", background: "#f5f7fa", borderRadius: "10px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "16px" }}>Hvad forskning viser</h2>
          <p style={{ fontSize: "15px", marginBottom: "12px" }}>Social angst er en af de hyppigste angstlidelser hos børn og unge. Forskning viser, at ubehandlet social angst i barndommen øger risikoen for depression og isolation i voksenlivet. WHO og Sundhedsstyrelsen fremhæver tidlig intervention som afgørende.</p>
          <p style={{ fontSize: "15px", color: "#666", fontStyle: "italic" }}>Kilde: Sundhedsstyrelsen.dk, WHO Mental Health Atlas, Dansk Institut for Psykiatri.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Hvad hypnoterapi gør</h2>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>Hypnoterapi arbejder direkte med den grundlæggende overbevisning barnet har om sin egen sociale værdi. Et barn, der inderst inde tror, det er værd at kende, opfører sig anderledes, spontant og uden at øve sig. Forandringen kommer indefra.</p>
          <p style={{ fontSize: "15px", color: "#666", maxWidth: "700px" }}>Jan tilpasser sin tilgang til barnets alder og de konkrete situationer der er vanskelige. Forældrene er altid med i processen.</p>
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
            <Link href="/ensomhed-born" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Ensomhed</Link>
            <Link href="/angst-born" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Angst hos børn</Link>
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
