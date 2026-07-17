import Head from "next/head"
import Link from "next/link"
import Header from "../components/Header"
import Footer from "../components/Footer"

export default function Page() {
  return (
    <>
      <Header />
      <Head>
        <title>Fobi og frygt, hypnoterapi Birkerød | Gaarsdal</title>
        <meta name="description" content="Bange for højder, flyvning, sprøjter, edderkopper eller noget helt andet? Fobi er en lært reaktion, der kan ændres. Jan Gaarsdal, Birkerød." />
        <link rel="canonical" href="https://gaarsdal.net/fobi" />
        <meta property="og:title" content="Fobi og frygt, hypnoterapi Birkerød | Gaarsdal" />
        <meta property="og:description" content="Bange for højder, flyvning, sprøjter, edderkopper eller noget helt andet? Fobi er en lært reaktion der kan ændres. Jan Gaarsdal, Birkerød." />
        <meta property="og:image" content="https://gaarsdal.net/Jan-AI.png" />
        <meta property="og:url" content="https://gaarsdal.net/fobi" />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "MedicalWebPage", name: "Fobi og frygt — hypnoterapi", description: "Hypnoterapi til fobier i Birkerød. Jan Gaarsdal arbejder med den lærte frygtreaktion ved kilden.", url: "https://gaarsdal.net/fobi", provider: { "@type": "Person", name: "Jan Gaarsdal", url: "https://gaarsdal.net/om", telephone: "+4542807474" } }) }}
        />
                <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: "{\"@context\": \"https://schema.org\", \"@type\": \"FAQPage\", \"mainEntity\": [{\"@type\": \"Question\", \"name\": \"Kan hypnose fjerne en fobi?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Ja. Hypnoterapi er et af de mest effektive redskaber mod fobier. Arbejdet sker direkte med den lærte frygtreaktion og erstatter den med ro, ikke ved gradvis eksponering eller rationalisering, men ved at ændre den automatiske respons ved kilden.\"}}, {\"@type\": \"Question\", \"name\": \"Hvorfor hjælper det ikke at vide at fobien er irrationel?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Fordi frygtreaktionen udløses i amygdala, hjernens alarmsystem, hurtigere end den rationelle del af hjernen når at reagere. Derfor kan du godt vide at det er irrationelt og alligevel reagere stærkt. Fobien sidder ikke i fornuften.\"}}, {\"@type\": \"Question\", \"name\": \"Hvor mange sessioner kræver en fobi?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Specifikke fobier reagerer ofte hurtigt på hypnoterapi, nogle gange på få sessioner. Det afhænger af fobien og dens historie. Den gratis forsamtale giver et realistisk billede.\"}}, {\"@type\": \"Question\", \"name\": \"Kan hypnose hjælpe mod køreangst og flyskræk?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Ja. Jan har erfaring med blandt andet køreangst, køreprøveangst, flyskræk, højdeskræk og sprøjteskræk. Tilgangen tilpasses den specifikke fobi.\"}}]}" }}
        />
      </Head>

      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "120px 20px 80px", fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif", lineHeight: 1.7, color: "#333" }}>

        <section style={{ marginBottom: "60px" }}>
          <h1 style={{ fontSize: "34px", fontWeight: 600, lineHeight: 1.25, marginBottom: "20px" }}>Du ved det er irrationelt. Det hjælper ikke.</h1>
          <p style={{ fontSize: "18px", color: "#555", marginBottom: "16px", maxWidth: "660px" }}>Frygtreaktionen kører alligevel, hurtigt og totalt. Du planlægger dit liv delvist for at undgå det. Du har måske prøvet at tale dig selv til ro. Det hjælper ikke i det øjeblik det sker.</p>
          <p style={{ fontSize: "16px", color: "#666", maxWidth: "660px" }}>En fobi er ikke en tanke. Det er en lært reaktion, der sidder i hjernens alarmsystem og ikke kan overtalses væk.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "20px" }}>Hvad der faktisk sker</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
                        <div style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Fobien sidder i amygdala</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>Frygtreaktionen ved en fobi udløses i amygdala, hjernens alarmsystem, og overstyrker den rationelle del af hjernen. Det sker så hurtigt at den rationelle del ikke når at reagere. Det er derfor, du ved, det er irrationelt, og alligevel reagerer, som du gør.</p>
            </div>
            <div style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Det er en lært reaktion</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>Fobier er lærte associationer. På et tidspunkt lærte hjernen at noget bestemt er farligt og aktiverede en stærk reaktion. Den reaktion er nu automatisk og udløses af trigger, uden bevidst styring.</p>
            </div>
            <div style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Undgåelse vedligeholder fobien</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>Når du undgår det du er bange for, bekræfter hjernen at det faktisk er farligt. Undgåelse giver kortvarig lettelse, men forstærker fobien over tid. Det er en fælde de fleste med fobier befinder sig i.</p>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: "60px", padding: "32px", background: "#f5f7fa", borderRadius: "10px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "16px" }}>Hvad forskning viser</h2>
          <p style={{ fontSize: "15px", marginBottom: "12px" }}>Fobier er blandt de mest udbredte angstlidelser. Sundhedsstyrelsen estimerer, at specifikke fobier rammer op mod 10 pct. af befolkningen. Mange lever med deres fobi, fordi de ikke kender til effektive behandlingsmuligheder.</p>
          <p style={{ fontSize: "15px", color: "#666", fontStyle: "italic" }}>Kilde: <a href="https://www.sst.dk" target="_blank" rel="noopener" style={{ color: "#5a7a8f", textDecoration: "underline" }}>Sundhedsstyrelsen.dk</a>, ICD-10 klassifikation.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Hvad hypnoterapi gør</h2>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>Hypnoterapi er et af de mest effektive redskaber mod fobier. Arbejdet sker direkte med den lærte reaktion og erstatter den med ro. Ikke gradvis eksponering eller rationalisering, men en direkte ændring af den automatiske respons ved kilden.</p>
          <p style={{ fontSize: "15px", color: "#666", maxWidth: "700px" }}>Jan har særlig erfaring med køreangst og køreprøveangst samt klassiske fobier som flyvning, sprøjter og højder. Tilgangen tilpasses til den specifikke fobi.</p>
        </section>


        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Sådan fjerner hypnose en fobi</h2>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>En fobi er en lært reaktion, der sidder i amygdala, hjernens alarmsystem. Den er ikke styret af den rationelle del af hjernen, og det er præcis derfor, du kan vide, at frygten er irrationel, og alligevel reagere med fuld kraft. Alarmen udløses automatisk og er designet til at overstyre alt andet på et splitsekund.</p>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>Hypnose er et af de mest effektive redskaber mod fobier, fordi den arbejder netop dér, hvor reaktionen sidder. I stedet for gradvis eksponering, hvor du udsættes for frygten igen og igen, eller rationalisering, hvor du forsøger at tænke dig fra den, ændres selve den automatiske respons ved kilden.</p>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>Den lærte kobling, mellem udløseren og alarmen, erstattes med ro. Det, der før udløste panik, mister gradvist sin ladning. Fordi fobier ofte har én afgrænset udløser, reagerer de tit hurtigt på hypnoterapi, nogle gange på ganske få sessioner.</p>
          <p style={{ fontSize: "15px", color: "#666", maxWidth: "700px" }}>Du beholder en sund respekt for reel fare; det er kun den overdrevne, lammende reaktion, der dæmpes.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Sådan foregår et forløb</h2>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}><strong>Gratis forsamtale (30 min).</strong> Vi taler om hvad du oplever, hvornår det startede, og hvad du har prøvet. Her afklarer vi sammen, om hypnoterapi er den rette tilgang for dig. Telefon eller fysisk, og helt uforpligtende.</p>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}><strong>Første session (90 min).</strong> En grundig samtale om din historie og dit mønster, efterfulgt af den første hypnose. De fleste bliver overraskede over hvor naturligt det føles: en dyb afspænding hvor du hører alt, husker alt og har fuld kontrol.</p>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}><strong>Opfølgende sessioner (ca. 60 min).</strong> Arbejdet målrettes det, der driver netop dit mønster. Mange mærker forandring efter få sessioner; afgrænsede problemstillinger kan ofte klares hurtigt, mens mere indgroede mønstre kræver et lidt længere forløb.</p>
          <p style={{ fontSize: "15px", color: "#666", maxWidth: "700px" }}>Sessioner foregår fysisk i Birkerød eller online efter aftale. Se <Link href="/priser" style={{ color: "#5a7a8f" }}>priser</Link>.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>De typiske fobier</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "700px" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Specifikke fobier</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7, margin: 0 }}>Højder, edderkopper, sprøjter, lukkede rum, flyvning. Frygten er bundet til én bestemt ting, og du planlægger ofte dit liv for at undgå den. Netop fordi udløseren er afgrænset, er denne type ofte hurtig at arbejde med.</p>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Flyskræk</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7, margin: 0 }}>For nogle er det højden, for andre følelsen af at miste kontrol eller være lukket inde. Flyskræk begrænser både ferier og arbejdsliv. Hypnoterapi arbejder med den specifikke frygtreaktion, der udløses ved tanken om og oplevelsen af at flyve.</p>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Sprøjte- og tandlægeskræk</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7, margin: 0 }}>En fobi med reelle konsekvenser, fordi den kan få folk til at undgå nødvendig behandling. Reaktionen er ofte kropslig og stærk, og den kan ændres, så du kan komme igennem behandling uden panik.</p>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Køreangst</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7, margin: 0 }}>Angst for at køre bil, på motorvej, over broer, eller efter en ulykke. Den begrænser hverdagen mærkbart. Se også siden om <Link href="/praestationsangst" style={{ color: "#5a7a8f" }}>køreprøveangst</Link>, hvis det handler om selve prøven.</p>
            </div>
          </div>
        </section>


        <section style={{ marginBottom: "60px", padding: "28px 32px", background: "#fdf6f0", borderRadius: "10px", border: "1px solid #ecd9c6" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>Vigtigt at vide</h2>
          <p style={{ fontSize: "15px", color: "#555", maxWidth: "700px", margin: 0 }}>Fobier er i udgangspunktet afgrænsede, men kan have reelle konsekvenser for hverdagen. Hypnoterapi er ikke egnet ved generaliseret angstlidelse der påvirker din evne til at fungere bredt — her bør du tale med din læge eller en psykolog. Den gratis forsamtale afklarer om din frygtreaktion egner sig til hypnoterapi.</p>
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

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "24px" }}>Ofte stillede spørgsmål</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ borderBottom: "1px solid #eee", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#333" }}>Kan hypnose fjerne en fobi?</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7 }}>Ja. Hypnoterapi er et af de mest effektive redskaber mod fobier. Arbejdet sker direkte med den lærte frygtreaktion og erstatter den med ro, ikke ved gradvis eksponering eller rationalisering, men ved at ændre den automatiske respons ved kilden.</p>
            </div>
            <div style={{ borderBottom: "1px solid #eee", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#333" }}>Hvorfor hjælper det ikke at vide at fobien er irrationel?</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7 }}>Fordi frygtreaktionen udløses i amygdala, hjernens alarmsystem, hurtigere end den rationelle del af hjernen når at reagere. Derfor kan du godt vide at det er irrationelt og alligevel reagere stærkt. Fobien sidder ikke i fornuften.</p>
            </div>
            <div style={{ borderBottom: "1px solid #eee", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#333" }}>Hvor mange sessioner kræver en fobi?</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7 }}>Specifikke fobier reagerer ofte hurtigt på hypnoterapi, nogle gange på få sessioner. Det afhænger af fobien og dens historie. Den gratis forsamtale giver et realistisk billede.</p>
            </div>
            <div style={{ borderBottom: "1px solid #eee", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#333" }}>Kan hypnose hjælpe mod køreangst og flyskræk?</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7 }}>Ja. Jan har erfaring med blandt andet køreangst, køreprøveangst, flyskræk, højdeskræk og sprøjteskræk. Tilgangen tilpasses den specifikke fobi.</p>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 500, color: "#888", marginBottom: "12px" }}>Relaterede emner</h2>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                        <Link href="/angst" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Angst →</Link>
            <Link href="/praestationsangst" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Præstationsangst →</Link>
            <Link href="/kender-du-det" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Kender du det? →</Link>
            <Link href="/kontakt" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Kontakt Jan →</Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
