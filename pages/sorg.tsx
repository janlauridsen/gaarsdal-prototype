import Head from "next/head"
import Link from "next/link"
import Header from "../components/Header"
import Footer from "../components/Footer"

export default function Page() {
  return (
    <>
      <Header />
      <Head>
        <title>Sorg og tab, hypnoterapi Birkerød | Gaarsdal</title>
        <meta name="description" content="Sorg, der ikke slipper. Hypnoterapi hjælper med at bearbejde tab og finde en vej videre. Jan Gaarsdal, Birkerød. Gratis forsamtale 30 minutter." />
        <link rel="canonical" href="https://gaarsdal.net/sorg" />
        <meta property="og:title" content="Sorg og tab, hypnoterapi Birkerød | Gaarsdal" />
        <meta property="og:description" content="Sorg der ikke slipper. Hypnoterapi hjælper med at bearbejde tab og finde en vej videre. Jan Gaarsdal, Birkerød. Gratis forsamtale 30 minutter." />
        <meta property="og:image" content="https://gaarsdal.net/Jan-AI.png" />
        <meta property="og:url" content="https://gaarsdal.net/sorg" />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: "{\"@context\": \"https://schema.org\", \"@type\": \"FAQPage\", \"mainEntity\": [{\"@type\": \"Question\", \"name\": \"Kan hypnose hjælpe mod sorg?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Ja, der hvor sorgen sidder fast. Hypnoterapi fjerner ikke savnet, men hjælper nervesystemet med at bearbejde tabet, så du finder en bæredygtig måde at leve videre på. Det er særligt relevant ved fastlåst eller kompliceret sorg.\"}}, {\"@type\": \"Question\", \"name\": \"Hvornår er sorg fastlåst?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Når sorgen ikke finder vej igennem, men bliver en vedvarende tilstand af uro, tomhed eller smerte uden bedring over tid. Det ses ofte ved pludselige, traumatiske eller uafsluttede tab. Den gratis forsamtale afklarer om det er tilfældet for dig.\"}}, {\"@type\": \"Question\", \"name\": \"Tager hypnose minderne om den jeg har mistet?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Nej. Hypnoterapi fjerner hverken minder eller kærligheden til den du har mistet. Den arbejder med den fastlåste smerte, så minderne kan være der uden at lamme dig.\"}}, {\"@type\": \"Question\", \"name\": \"Hvor lang tid efter et tab kan jeg søge hjælp?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Der er ingen rigtig tidsramme. Nogle søger hjælp tidligt, andre år efter et tab der aldrig blev bearbejdet. Hypnoterapi kan hjælpe uanset hvor lang tid der er gået.\"}}]}" }}
        />
      </Head>
      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "120px 20px 80px", fontFamily: "system-ui, -apple-system, sans-serif", lineHeight: 1.7, color: "#333" }}>
        <section style={{ marginBottom: "60px" }}>
          <h1 style={{ fontSize: "34px", fontWeight: 600, lineHeight: 1.25, marginBottom: "20px" }}>Sorgen fylder mere end omgivelserne forstår</h1>
          <p style={{ fontSize: "18px", color: "#555", marginBottom: "16px", maxWidth: "660px" }}>Du har mistet nogen eller noget der betød alt. Omgivelserne siger det tager tid. Det er rigtigt, men det siger ikke noget om, hvad du gør med den tid. Sorg er ikke noget der bare går over.</p>
          <p style={{ fontSize: "16px", color: "#666", maxWidth: "660px" }}>Sorg der sidder fast er ikke svaghed. Det er et nervesystem, der ikke har fundet vej igennem tabet.</p>
        </section>
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "20px" }}>Hvad der faktisk sker</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
                        <div style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Sorg er ikke lineær</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>Der er ingen rigtig måde at sørge på. Sorg kommer i bølger, vender tilbage uventet og kan aktiveres af steder, lyde og lugte år efter. Det er ikke et tegn på at noget er galt, det er et tegn på at der var noget der betød noget.</p>
            </div>
            <div style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Fastlåst sorg</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>Nogle gange finder sorgen ikke vej igennem. Den sidder fast som en tilstand af uro, tomhed eller vedvarende smerte. Det kan skyldes, at tabet var pludseligt, traumatisk eller kom med uafsluttede forhold.</p>
            </div>
            <div style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Kroppen bærer sorgen</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>Sorg sidder ikke kun i tankerne. Søvnproblemer, træthed, manglende appetit og fysisk tyngde er normale sorgresponser. Kroppen reagerer på tab ligesom den reagerer på fare.</p>
            </div>
          </div>
        </section>
        <section style={{ marginBottom: "60px", padding: "32px", background: "#f5f7fa", borderRadius: "10px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "16px" }}>Hvad forskning viser</h2>
          <p style={{ fontSize: "15px", marginBottom: "12px" }}>Sorg og tab er naturlige menneskelige reaktioner. Sundhedsstyrelsen og WHO anerkender, at kompliceret sorg, som rammer en del af dem, der mister, kræver særlig opmærksomhed og støtte ud over det sociale netværk.</p>
          <p style={{ fontSize: "15px", color: "#666", fontStyle: "italic" }}>Kilde: Sundhedsstyrelsen.dk, WHO Mental Health Report.</p>
        </section>
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Hvad hypnoterapi gør</h2>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>Hypnoterapi kan hjælpe der hvor sorgen sidder fast. Ikke ved at fjerne savnet, men ved at hjælpe nervesystemet med at bearbejde tabet og finde en bæredygtig måde at leve videre med det på.</p>
          <p style={{ fontSize: "15px", color: "#666", maxWidth: "700px" }}>Jan arbejder med sorg og tab hos voksne. Den gratis forsamtale afklarer om hypnoterapi kan støtte netop din sorgreaktion.</p>
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
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#333" }}>Kan hypnose hjælpe mod sorg?</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7 }}>Ja, der hvor sorgen sidder fast. Hypnoterapi fjerner ikke savnet, men hjælper nervesystemet med at bearbejde tabet, så du finder en bæredygtig måde at leve videre på. Det er særligt relevant ved fastlåst eller kompliceret sorg.</p>
            </div>
            <div style={{ borderBottom: "1px solid #eee", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#333" }}>Hvornår er sorg fastlåst?</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7 }}>Når sorgen ikke finder vej igennem, men bliver en vedvarende tilstand af uro, tomhed eller smerte uden bedring over tid. Det ses ofte ved pludselige, traumatiske eller uafsluttede tab. Den gratis forsamtale afklarer om det er tilfældet for dig.</p>
            </div>
            <div style={{ borderBottom: "1px solid #eee", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#333" }}>Tager hypnose minderne om den jeg har mistet?</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7 }}>Nej. Hypnoterapi fjerner hverken minder eller kærligheden til den du har mistet. Den arbejder med den fastlåste smerte, så minderne kan være der uden at lamme dig.</p>
            </div>
            <div style={{ borderBottom: "1px solid #eee", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#333" }}>Hvor lang tid efter et tab kan jeg søge hjælp?</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7 }}>Der er ingen rigtig tidsramme. Nogle søger hjælp tidligt, andre år efter et tab der aldrig blev bearbejdet. Hypnoterapi kan hjælpe uanset hvor lang tid der er gået.</p>
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
