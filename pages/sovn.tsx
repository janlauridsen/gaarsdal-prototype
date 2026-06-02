import Head from "next/head"
import Link from "next/link"
import Header from "../components/Header"
import Footer from "../components/Footer"

export default function SovnPage() {
  return (
    <>
      <Header />
      <Head>
        <title>Søvnproblemer og hypnoterapi i Birkerød | Gaarsdal</title>
        <meta name="description" content="Kan du ikke sove? Vågner om natten? Hypnoterapi arbejder med nervesystemet, der holder dig vågen. Ikke med viljestyrke. Jan Gaarsdal, Birkerød." />
        <link rel="canonical" href="https://gaarsdal.net/sovn" />
        <meta property="og:title" content="Søvnproblemer og hypnoterapi | Gaarsdal Birkerød" />
        <meta property="og:description" content="Søvnproblemer sidder dybere end gode vaner og skærmfri aftener. Hypnoterapi arbejder der viljestyrken ikke når ind." />
        <meta property="og:image" content="https://gaarsdal.net/Jan-AI.png" />
        <meta property="og:url" content="https://gaarsdal.net/sovn" />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              name: "Søvnproblemer og hypnoterapi",
              description: "Hypnoterapi til søvnproblemer i Birkerød. Jan Gaarsdal arbejder med nervesystemet der holder dig vågen.",
              url: "https://gaarsdal.net/sovn",
              provider: {
                "@type": "Person",
                name: "Jan Gaarsdal",
                url: "https://gaarsdal.net/om",
                telephone: "+4542807474",
              },
            }),
          }}
        />
      </Head>

      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "120px 20px 80px", fontFamily: "system-ui, -apple-system, sans-serif", lineHeight: 1.7, color: "#333" }}>

        {/* GENKENDELSE */}
        <section style={{ marginBottom: "60px" }}>
          <h1 style={{ fontSize: "34px", fontWeight: 600, lineHeight: 1.25, marginBottom: "20px" }}>
            Du er træt — men kan ikke sove
          </h1>
          <p style={{ fontSize: "18px", color: "#555", marginBottom: "16px", maxWidth: "660px" }}>
            Du lægger dig. Tankerne starter. Du vågner kl. 3 og kan ikke falde i søvn igen. Du har prøvet alt — ingen skærm, magnesium, melatonin, podcasts. Det hjælper lidt. Men ikke nok. Og ikke konsekvent.
          </p>
          <p style={{ fontSize: "16px", color: "#666", maxWidth: "660px" }}>
            Det er ikke din viljestyrke der svigter. Problemet sidder et andet sted.
          </p>
        </section>

        {/* HVAD FORSKNING VISER */}
        <section style={{ marginBottom: "60px", padding: "32px", background: "#f5f7fa", borderRadius: "10px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "16px" }}>Hvad forskning viser om søvn</h2>
          <p style={{ fontSize: "15px", marginBottom: "12px" }}>
            Sundhedsstyrelsen anbefaler, at voksne sover mindst 7 timer pr. nat. Ny forskning publiceret i Nature (2025) viser, at både for kort og for lang søvn accelererer den biologiske aldring i otte organer — hjernen, lunger, lever, immunsystem og flere andre.
          </p>
          <p style={{ fontSize: "15px", marginBottom: "12px" }}>
            Samme forskning finder, at for lidt søvn øger risikoen for hjerte-kar-sygdomme, diabetes og en række muskel- og ledsygdomme. Mænd ser ud til at være mere sårbare overfor søvnunderskud end kvinder.
          </p>
          <p style={{ fontSize: "15px", color: "#666", fontStyle: "italic" }}>
            Kilde: Nature, maj 2025. Sundhedsstyrelsen.dk.
          </p>
        </section>

        {/* HVAD DER SKER */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "20px" }}>Hvorfor gode søvnvaner ikke er nok</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
            {[
              {
                titel: "Nervesystemet er i beredskab",
                tekst: "Søvnproblemer handler sjældent om søvn i sig selv. De handler om et nervesystem der ikke slipper ned. Hjernen opfatter sengen som et sted med uro, ikke ro. Den association kører automatisk og kan ikke brydes ved at tænke sig til det.",
              },
              {
                titel: "Tankerne kører af sig selv",
                tekst: "Overtænkning om natten er ikke et tegn på, at du er bekymret over noget konkret. Det er et nervesystem der kompenserer for usikkerhed ved at simulere og kontrollere. Det kører, fordi det tror, det hjælper dig.",
              },
              {
                titel: "Viljestyrke virker ikke her",
                tekst: "Du kan beslutte dig for at sove. Du kan gøre alt rigtigt. Og alligevel ligge vågen. Det er fordi beslutningen og vanen sidder i to forskellige dele af hjernen — og det er den automatiske, der vinder.",
              },
            ].map((k) => (
              <div key={k.titel} style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>{k.titel}</h3>
                <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>{k.tekst}</p>
              </div>
            ))}
          </div>
        </section>

        {/* HVAD HYPNOTERAPI GØR */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Hvad hypnoterapi gør ved søvnproblemer</h2>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>
            Hypnotisk tilstand og søvnindledning aktiverer de samme neurologiske mekanismer. Det giver en unik mulighed: du lærer at lede nervesystemet ned i ro — ikke som en teknik, du skal huske at bruge, men som en ny automatisk reaktion.
          </p>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>
            Arbejdet handler ikke om at lære dig gode søvnvaner. Det handler om at ændre hvad hjernen automatisk forbinder med sengen og med natten. Mange oplever mærkbar forskel allerede efter første session.
          </p>
          <p style={{ fontSize: "15px", color: "#666", maxWidth: "700px" }}>
            Hypnoterapi er ikke for alle søvnproblemer. Hvis søvnen er påvirket af smerter, medicinbivirkninger eller en diagnosticeret søvnforstyrrelse, er det bedst at starte med din læge. Den gratis forsamtale afklarer om det giver mening for dig.
          </p>
        </section>

        {/* OM JAN */}
        <section style={{ marginBottom: "48px", padding: "32px", background: "#f9fafb", borderRadius: "10px", borderLeft: "3px solid #5a7a8f" }}>
          <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>Jan Gaarsdal, hypnoterapeut i Birkerød</h2>
              <p style={{ fontSize: "15px", color: "#555", marginBottom: "16px", lineHeight: 1.7 }}>
                Jan arbejder med søvnproblemer hos voksne og unge. Han tilpasser sin tilgang til hvad der driver dit specifikke søvnproblem — uro, tankemylder, tidlig opvågning eller indsoningsbesvær.
              </p>
              <div style={{ padding: "12px 16px", background: "#f0f4f8", borderRadius: "6px", display: "inline-block" }}>
                <p style={{ fontSize: "14px", fontWeight: 500, color: "#333", margin: "0 0 8px" }}>
                  🎯 Gratis forsamtale, 30 minutter, telefon eller fysisk
                </p>
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                  <Link href="/kontakt" style={{ fontSize: "14px", color: "#fff", background: "#5a7a8f", textDecoration: "none", fontWeight: 500, padding: "8px 16px", borderRadius: "4px" }}>
                    Book forsamtale →
                  </Link>
                  <a href="tel:+4542807474" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", fontWeight: 500, padding: "8px 0" }}>
                    Ring +45 42 80 74 74
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RELATEREDE SIDER */}
        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 500, color: "#888", marginBottom: "12px" }}>Relaterede emner</h2>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href="/kender-du-det" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Kender du det? →</Link>
            <Link href="/hypnoterapi" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Om hypnoterapi →</Link>
            <Link href="/kontakt" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Kontakt Jan →</Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
