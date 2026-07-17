import Head from "next/head"
import Link from "next/link"
import Header from "../components/Header"
import Footer from "../components/Footer"

export default function Page() {
  return (
    <>
      <Header />
      <Head>
        <title>Følelsesspisning og hypnoterapi Birkerød | Gaarsdal</title>
        <meta name="description" content="Spiser du på følelserne? Maden dækker noget andet end sult. Hypnoterapi arbejder med det underliggende behov. Jan Gaarsdal, Birkerød." />
        <link rel="canonical" href="https://gaarsdal.net/spisning" />
        <meta property="og:title" content="Følelsesspisning og hypnoterapi Birkerød | Gaarsdal" />
        <meta property="og:description" content="Spiser du på følelserne? Maden dækker noget andet end sult. Hypnoterapi arbejder med det underliggende behov. Jan Gaarsdal, Birkerød." />
        <meta property="og:image" content="https://gaarsdal.net/Jan-AI.png" />
        <meta property="og:url" content="https://gaarsdal.net/spisning" />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "MedicalWebPage", name: "Følelsesspisning og spiseproblemer — hypnoterapi", description: "Hypnoterapi til følelsesspisning og spiseproblemer i Birkerød. Jan Gaarsdal arbejder med de automatiske reaktioner der driver spisemønstre.", url: "https://gaarsdal.net/spisning", provider: { "@type": "Person", name: "Jan Gaarsdal", url: "https://gaarsdal.net/om", telephone: "+4542807474" } }) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: "{\"@context\": \"https://schema.org\", \"@type\": \"FAQPage\", \"mainEntity\": [{\"@type\": \"Question\", \"name\": \"Kan hypnose hjælpe mod følelsesspisning?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Ja. Hypnoterapi arbejder med det underliggende behov der driver spisningen, ikke med maden i sig selv. Når hjernen finder andre måder at regulere ubehaget på, falder trangen naturligt, uden restriktioner eller viljestyrke.\"}}, {\"@type\": \"Question\", \"name\": \"Hvorfor kan jeg ikke bare lade være med at spise på følelserne?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Fordi hjernen har lært at mad dæmper ubehag hurtigt og pålideligt. Den reaktion kører automatisk og er stærkere end beslutningen om at lade være i det øjeblik ubehaget opstår. Det er en lært kobling, ikke svag vilje.\"}}, {\"@type\": \"Question\", \"name\": \"Skal jeg på en diæt?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Nej. Hypnoterapi mod følelsesspisning handler ikke om kost eller restriktioner, men om at adressere det behov maden dækker. Restriktioner adresserer ikke årsagen og kan endda øge trangen.\"}}, {\"@type\": \"Question\", \"name\": \"Hvornår er det mere end følelsesspisning?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Ved tegn på en egentlig spiseforstyrrelse som anoreksi, bulimi eller tvangsoverspisning skal du altid starte hos din læge eller et specialiseret behandlingstilbud. Hypnoterapi er her højst et supplement, ikke den primære behandling.\"}}]}" }}
        />
      </Head>

      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "120px 20px 80px", fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif", lineHeight: 1.7, color: "#333" }}>

        <section style={{ marginBottom: "60px" }}>
          <h1 style={{ fontSize: "34px", fontWeight: 600, lineHeight: 1.25, marginBottom: "20px" }}>Det er ikke sult der driver det</h1>
          <p style={{ fontSize: "18px", color: "#555", marginBottom: "16px", maxWidth: "660px" }}>Du ved godt, hvornår du spiser på følelserne. Det er kedsomhed, stress, uro, ensomhed. Maden dæmper det i et øjeblik. Bagefter er der skam oveni. Du har prøvet at lade være. Det virker ikke konsekvent.</p>
          <p style={{ fontSize: "16px", color: "#666", maxWidth: "660px" }}>Følelsesspisning er ikke svag viljestyrke. Det er en reguleringsmekanisme der sidder dybere end beslutninger kan nå.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "20px" }}>Hvad der faktisk sker</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
                        <div style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Maden dækker et behov</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>Hjernen har lært at mad dæmper ubehag hurtigt og pålideligt. Den reaktion kører automatisk og er stærkere end beslutningen om at lade være, i det øjeblik ubehaget opstår. Det er ikke grådighed, det er en lært kobling.</p>
            </div>
            <div style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Skam forstærker mønsteret</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>Skam efter overspisning øger det ubehag, der drev spisningen i første omgang. Det skaber en cirkel: ubehag, spiser, skam, mere ubehag. Viljestyrke og selvkritik bryder ikke cirklen, de forstærker den.</p>
            </div>
            <div style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Restriktioner virker ikke langsigtet</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>At begrænse madvarer eller kalorier adresserer ikke det underliggende behov. Hjernen finder andre måder at dække behovet på, eller øger trangen til præcis det der er forbudt.</p>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: "60px", padding: "32px", background: "#f5f7fa", borderRadius: "10px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "16px" }}>Hvad forskning viser</h2>
          <p style={{ fontSize: "15px", marginBottom: "12px" }}>Følelsesspisning er en af de hyppigste årsager til overspisning og vægtproblemer. Forskning viser at adfærdsbaserede tilgange der adresserer de underliggende følelsesmæssige mønstre er mere effektive end kostbaserede løsninger alene.</p>
          <p style={{ fontSize: "15px", color: "#666", fontStyle: "italic" }}>Kilde: <a href="https://www.sst.dk" target="_blank" rel="noopener" style={{ color: "#5a7a8f", textDecoration: "underline" }}>Sundhedsstyrelsen.dk</a> om følelsesmæssig spisning og vaner.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Hvad hypnoterapi gør</h2>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>Hypnoterapi arbejder med det underliggende behov der driver spisningen, ikke med maden i sig selv. Når hjernen finder andre måder at regulere ubehaget, falder trangen naturligt. Ingen restriktioner, ingen viljestyrke.</p>
          <p style={{ fontSize: "15px", color: "#666", maxWidth: "700px" }}>Jan tilpasser sin tilgang til, hvad der driver dit specifikke mønster, om det primært er stress, kedsomhed, ensomhed eller noget andet.</p>
        </section>


        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Sådan arbejder hypnose med følelsesspisning</h2>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>Følelsesspisning er en reguleringsmekanisme. Det er ikke sult, der driver den, men kedsomhed, stress, uro eller ensomhed, og maden dæmper ubehaget i et øjeblik. Hjernen har lært, at mad virker hurtigt og pålideligt, og den reaktion kører automatisk, stærkere end beslutningen om at lade være i det øjeblik ubehaget opstår.</p>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>Hypnose arbejder med det underliggende behov, der driver spisningen, ikke med maden i sig selv. Når hjernen finder andre måder at regulere ubehaget på, falder trangen naturligt. Der er ingen restriktioner og ingen kamp mod maden, fordi det ikke er maden, der er problemet.</p>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>Det er forskellen på en diæt og reel forandring. En diæt bekæmper symptomet med viljestyrke og udløser ofte endnu mere trang. Hypnoterapien retter sig mod årsagen, så behovet for at spise på følelserne aftager.</p>
          <p style={{ fontSize: "15px", color: "#666", maxWidth: "700px" }}>Samtidig arbejdes der med den skam, der ofte følger efter, fordi skammen i sig selv skaber den uro, der udløser næste episode.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Sådan foregår et forløb</h2>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}><strong>Gratis forsamtale (30 min).</strong> Vi taler om hvad du oplever, hvornår det startede, og hvad du har prøvet. Her afklarer vi sammen, om hypnoterapi er den rette tilgang for dig. Telefon eller fysisk, og helt uforpligtende.</p>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}><strong>Første session (90 min).</strong> En grundig samtale om din historie og dit mønster, efterfulgt af den første hypnose. De fleste bliver overraskede over hvor naturligt det føles: en dyb afspænding hvor du hører alt, husker alt og har fuld kontrol.</p>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}><strong>Opfølgende sessioner (ca. 60 min).</strong> Arbejdet målrettes det, der driver netop dit mønster. Mange mærker forandring efter få sessioner; afgrænsede problemstillinger kan ofte klares hurtigt, mens mere indgroede mønstre kræver et lidt længere forløb.</p>
          <p style={{ fontSize: "15px", color: "#666", maxWidth: "700px" }}>Sessioner foregår fysisk i Birkerød eller online efter aftale. Se <Link href="/priser" style={{ color: "#5a7a8f" }}>priser</Link>.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Sådan viser følelsesspisning sig</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "700px" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Det starter ikke med sult</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7, margin: 0 }}>Du spiser, selvom du ikke er sulten. Trangen kommer pludseligt, ofte efter en følelse: stress, kedsomhed, skuffelse. Det er et signal om regulering, ikke om næring.</p>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Bestemte følelser, bestemt mad</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7, margin: 0 }}>Det er sjældent tilfældigt hvad der spises. Søde eller fede ting dæmper hurtigst, og hjernen ved det. Trangen er målrettet, fordi den tjener et formål: at ændre hvordan du har det lige nu.</p>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Skammen bagefter</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7, margin: 0 }}>Efter episoden kommer skylden og skammen. Den følelse skaber ny uro, som igen kan udløse trang. Det bliver en cirkel, hvor selvbebrejdelsen holder mønsteret kørende.</p>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Det sker oftest alene</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7, margin: 0 }}>Følelsesspisning foregår typisk i det skjulte, om aftenen, alene. Det gør det ensomt og svært at tale om, og mange bærer på det i årevis uden at fortælle nogen det.</p>
            </div>
          </div>
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

        {/* VIGTIG AFGRÆNSNING */}
        <section style={{ marginBottom: "60px", padding: "28px 32px", background: "#fdf6f0", borderRadius: "10px", border: "1px solid #ecd9c6" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>Vigtigt at vide om spiseforstyrrelser</h2>
          <p style={{ fontSize: "15px", color: "#555", maxWidth: "700px", margin: 0 }}>Denne side handler om følelsesmæssig spisning og overspisning. Ved tegn på en egentlig spiseforstyrrelse som anoreksi, bulimi eller tvangsoverspisning skal du altid starte hos din læge eller et specialiseret behandlingstilbud. Spiseforstyrrelser kan være alvorlige og kræver tværfaglig behandling, hvor hypnoterapi højst er et supplement.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "24px" }}>Ofte stillede spørgsmål</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ borderBottom: "1px solid #eee", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#333" }}>Kan hypnose hjælpe mod følelsesspisning?</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7 }}>Ja. Hypnoterapi arbejder med det underliggende behov der driver spisningen, ikke med maden i sig selv. Når hjernen finder andre måder at regulere ubehaget på, falder trangen naturligt, uden restriktioner eller viljestyrke.</p>
            </div>
            <div style={{ borderBottom: "1px solid #eee", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#333" }}>Hvorfor kan jeg ikke bare lade være med at spise på følelserne?</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7 }}>Fordi hjernen har lært at mad dæmper ubehag hurtigt og pålideligt. Den reaktion kører automatisk og er stærkere end beslutningen om at lade være i det øjeblik ubehaget opstår. Det er en lært kobling, ikke svag vilje.</p>
            </div>
            <div style={{ borderBottom: "1px solid #eee", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#333" }}>Skal jeg på en diæt?</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7 }}>Nej. Hypnoterapi mod følelsesspisning handler ikke om kost eller restriktioner, men om at adressere det behov maden dækker. Restriktioner adresserer ikke årsagen og kan endda øge trangen.</p>
            </div>
            <div style={{ borderBottom: "1px solid #eee", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#333" }}>Hvornår er det mere end følelsesspisning?</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7 }}>Ved tegn på en egentlig spiseforstyrrelse som anoreksi, bulimi eller tvangsoverspisning skal du altid starte hos din læge eller et specialiseret behandlingstilbud. Hypnoterapi er her højst et supplement, ikke den primære behandling.</p>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 500, color: "#888", marginBottom: "12px" }}>Relaterede emner</h2>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                        <Link href="/angst" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Angst →</Link>
            <Link href="/stress" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Stress →</Link>
            <Link href="/vaner" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Vaner →</Link>
            <Link href="/kontakt" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Kontakt Jan →</Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
