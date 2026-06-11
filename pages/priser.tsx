import Head from "next/head"
import Link from "next/link"
import Header from "../components/Header"
import Footer from "../components/Footer"

export default function PriserPage() {
  return (
    <>
      <Header />
      <Head>
        <title>Priser på hypnoterapi - Gratis forsamtale | Gaarsdal Birkerød</title>
        <meta name="description" content="Priser på hypnoterapi hos Jan Gaarsdal i Birkerød. Gratis forsamtale. Pakker til studerende, arbejdsløse og flygtninge. Første session 900 kr." />
        <link rel="canonical" href="https://gaarsdal.net/priser" />
        <meta property="og:title" content="Priser, hypnoterapi Birkerød | Gaarsdal" />
        <meta property="og:description" content="Første session 900 kr. Opfølgning 600 kr. Gratis forsamtale 30 minutter. Særlige vilkår for studerende, arbejdsløse og flygtninge." />
        <meta property="og:image" content="https://gaarsdal.net/Jan-AI.png" />
        <meta property="og:url" content="https://gaarsdal.net/priser" />
        <meta name="robots" content="index, follow" />
      </Head>

      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "120px 20px 80px", fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif", lineHeight: 1.7, color: "#333" }}>

        <section style={{ marginBottom: "60px" }}>
          <h1 style={{ fontSize: "34px", fontWeight: 600, lineHeight: 1.25, marginBottom: "16px" }}>Priser</h1>
          <p style={{ fontSize: "18px", color: "#555", maxWidth: "620px" }}>
            Vi starter altid med en gratis forsamtale på 30 minutter, telefon eller fysisk, så du kan vurdere, om metoden og min tilgang passer til dig. Ingen forpligtelse.
          </p>
        </section>

        {/* STANDARDPRISER */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "24px" }}>Standardpriser</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
            {[
              { titel: "Gratis forsamtale", pris: "0 kr", varighed: "30 minutter", note: "Telefon eller fysisk. Afklaring af om hypnoterapi er relevant for dig." },
              { titel: "Første session", pris: "900 kr", varighed: "90 minutter", note: "Inkluderer grundig indledende samtale og hypnoterapi." },
              { titel: "Opfølgende session", pris: "600 kr", varighed: "60 minutter", note: "Alle sessioner efter den første." },
            ].map((p) => (
              <div key={p.titel} style={{ padding: "28px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px" }}>
                <h3 style={{ fontSize: "17px", fontWeight: 600, marginBottom: "8px" }}>{p.titel}</h3>
                <div style={{ fontSize: "28px", fontWeight: 700, color: "#5a7a8f", marginBottom: "4px" }}>{p.pris}</div>
                <div style={{ fontSize: "13px", color: "#888", marginBottom: "12px" }}>{p.varighed}</div>
                <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.6 }}>{p.note}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SOCIALE VILKÅR */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "8px" }}>Særlige vilkår</h2>
          <p style={{ fontSize: "15px", color: "#666", marginBottom: "24px", maxWidth: "620px" }}>
            Jan mener, at adgang til hjælp ikke bør begrænses af økonomi. Nedenstående vilkår gælder ved dokumentation.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
            {[
              { titel: "Studerende", pris: "400 kr", note: "Gælder ALLE sessioner ved dokumentation af studiekort, også den 90 minutter lange første session (normalt 900 kr).", badge: "SU" },
              { titel: "Arbejdsløse", pris: "400 kr", note: "Gælder ALLE sessioner ved dokumentation af ledighedsstatus, også den 90 minutter lange første session (normalt 900 kr).", badge: "A-kasse" },
              { titel: "Flygtninge", pris: "Gratis", note: "Gælder flygtninge med opholdstilladelse. Session på dansk eller engelsk. Ingen dokumentation krævet.", badge: "🌍" },
            ].map((p) => (
              <div key={p.titel} style={{ padding: "28px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <h3 style={{ fontSize: "17px", fontWeight: 600 }}>{p.titel}</h3>
                  <span style={{ fontSize: "12px", background: "#e8f0f5", color: "#5a7a8f", padding: "2px 8px", borderRadius: "20px", fontWeight: 500 }}>{p.badge}</span>
                </div>
                <div style={{ fontSize: "28px", fontWeight: 700, color: "#5a7a8f", marginBottom: "4px" }}>{p.pris}</div>
                <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.6 }}>{p.note}</p>
              </div>
            ))}
          </div>
        </section>

        {/* PAKKER */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "8px" }}>Pakker</h2>
          <p style={{ fontSize: "15px", color: "#666", marginBottom: "24px", maxWidth: "620px" }}>
            Nogle udfordringer kræver mere end én session. Pakker aftales individuelt og betales forud.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
            {[
              { titel: "3-session pakke", pris: "1.800 kr", note: "Første session + 2 opfølgende. Passer til afgrænsede problemstillinger som rygestop, fobi eller søvn.", besparelse: "Spar 300 kr" },
              { titel: "5-session pakke", pris: "2.800 kr", note: "Første session + 4 opfølgende. Passer til mere komplekse mønstre som angst, selvværd eller vaner.", besparelse: "Spar 500 kr" },
              { titel: "Børneforløb", pris: "Som voksne", note: "Samme prisstruktur som for voksne: gratis forsamtale, 900 kr første session, 600 kr opfølgning. Inkluderer forældreinddragelse.", besparelse: "" },
            ].map((p) => (
              <div key={p.titel} style={{ padding: "28px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", position: "relative" }}>
                {p.besparelse && (
                  <span style={{ position: "absolute", top: "16px", right: "16px", fontSize: "11px", background: "#e8f5e9", color: "#4a7c5f", padding: "2px 8px", borderRadius: "20px", fontWeight: 600 }}>{p.besparelse}</span>
                )}
                <h3 style={{ fontSize: "17px", fontWeight: 600, marginBottom: "8px" }}>{p.titel}</h3>
                <div style={{ fontSize: "28px", fontWeight: 700, color: "#5a7a8f", marginBottom: "4px" }}>{p.pris}</div>
                <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.6, marginTop: "8px" }}>{p.note}</p>
              </div>
            ))}
          </div>
        </section>

        {/* REFUGEE ENGLISH */}
        <section style={{ marginBottom: "60px", padding: "32px", background: "#f9fafb", borderRadius: "10px", borderLeft: "3px solid #5a7a8f" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>Sessions in English for refugees / Sessioner på engelsk for flygtninge</h2>
          <p style={{ fontSize: "15px", color: "#555", marginBottom: "12px", lineHeight: 1.7 }}>
            Jan offers free hypnotherapy sessions for refugees in Denmark. Sessions can be conducted in Danish or English. No documentation required.
          </p>
          <p style={{ fontSize: "15px", color: "#555", marginBottom: "16px", lineHeight: 1.7 }}>
            Jan tilbyder gratis hypnoterapi-sessioner for flygtninge i Danmark. Sessioner kan gennemføres på dansk eller engelsk. Ingen dokumentation krævet.
          </p>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <Link href="/kontakt" style={{ fontSize: "14px", color: "#fff", background: "#5a7a8f", textDecoration: "none", fontWeight: 500, padding: "10px 20px", borderRadius: "4px" }}>
              Book / Kontakt
            </Link>
            <a href="tel:+4542807474" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", fontWeight: 500, padding: "10px 0" }}>
              +45 42 80 74 74
            </a>
          </div>
        </section>


        {/* SMS OPT-IN */}
        <section style={{ marginBottom: "60px", padding: "28px 32px", background: "#f0f4f8", borderRadius: "10px", border: "1px solid #c5d2da" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px", color: "#333" }}>Hold dig opdateret</h2>
          <p style={{ fontSize: "15px", color: "#555", marginBottom: "20px", lineHeight: 1.7 }}>
            Modtag nyheder fra Jan 1-2 gange om året. Ingen spam. Du kan afmelde dig når som helst.
          </p>
          <a href="/tilmeld" style={{ display: "inline-block", padding: "11px 24px", background: "#5a7a8f", color: "#fff", textDecoration: "none", borderRadius: "6px", fontSize: "15px", fontWeight: 500 }}>
            Tilmeld SMS-nyheder →
          </a>
        </section>

        {/* CTA */}
        <section style={{ marginBottom: "40px", textAlign: "center", padding: "40px 20px", background: "#f0f4f8", borderRadius: "10px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>Start med en gratis forsamtale</h2>
          <p style={{ fontSize: "15px", color: "#555", marginBottom: "24px" }}>30 minutter, telefon eller fysisk. Ingen forpligtelse.</p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/kontakt" style={{ padding: "14px 28px", background: "#5a7a8f", color: "#fff", textDecoration: "none", borderRadius: "6px", fontWeight: 500, fontSize: "16px" }}>
              Book forsamtale
            </Link>
            <a href="tel:+4542807474" style={{ padding: "14px 28px", background: "transparent", color: "#5a7a8f", textDecoration: "none", border: "1px solid #5a7a8f", borderRadius: "6px", fontWeight: 500, fontSize: "16px" }}>
              Ring +45 42 80 74 74
            </a>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
