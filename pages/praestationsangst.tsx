import Head from "next/head"
import Link from "next/link"
import Header from "../components/Header"
import Footer from "../components/Footer"

export default function PraestationsangstPage() {
  return (
    <>
      <Header />
      <Head>
        <title>Præstationsangst og eksamensangst, hypnoterapi Birkerød | Gaarsdal</title>
        <meta name="description" content="Præstationsangst og eksamensangst. Du ved hvad du kan, men kroppen blokerer. Hypnoterapi arbejder med reaktionen, ikke pensummet. Jan Gaarsdal, Birkerød." />
        <link rel="canonical" href="https://gaarsdal.net/praestationsangst" />
        <meta property="og:title" content="Præstationsangst og eksamensangst | Gaarsdal Birkerød" />
        <meta property="og:description" content="Du har forberedt dig. Og alligevel blokerer du. Præstationsangst sidder ikke i pensummet, det sidder i nervesystemet." />
        <meta property="og:image" content="https://gaarsdal.net/Jan-AI.png" />
        <meta property="og:url" content="https://gaarsdal.net/praestationsangst" />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              name: "Præstationsangst og eksamensangst, hypnoterapi",
              description: "Hypnoterapi til præstationsangst og eksamensangst i Birkerød.",
              url: "https://gaarsdal.net/praestationsangst",
              provider: {
                "@type": "Person",
                name: "Jan Gaarsdal",
                url: "https://gaarsdal.net/om",
                telephone: "+4542807474",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: "{\"@context\": \"https://schema.org\", \"@type\": \"FAQPage\", \"mainEntity\": [{\"@type\": \"Question\", \"name\": \"Kan hypnose hjælpe mod præstationsangst?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Ja. Hypnoterapi ændrer den fysiologiske stressrespons i præstationssituationen, så nervesystemet aktiverer ro og fokus i stedet for panik. Resultater kommer ofte hurtigt ved situationsbestemt præstationsangst.\"}}, {\"@type\": \"Question\", \"name\": \"Kan hypnose hjælpe mod eksamensangst?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Ja. Eksamensangst er en stressrespons hvor adgangen til det man ved blokeres. Hypnoterapi træner nervesystemet til at forblive roligt og fokuseret i prøvesituationen, så du kan præstere efter dit faktiske niveau.\"}}, {\"@type\": \"Question\", \"name\": \"Hvor lang tid før min eksamen skal jeg starte?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Helst nogle uger før, så der er tid til at arbejde med reaktionen. Men selv få sessioner tæt på en eksamen kan have effekt. Kontakt Jan i god tid hvis muligt.\"}}, {\"@type\": \"Question\", \"name\": \"Hjælper hypnose mod køreprøveangst?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Ja. Jan har hjulpet over 25 klienter med køreprøveangst, hvor alle har bestået efter blot én behandling, og enkelte har ønsket en opfølgende session. Køreprøveangst reagerer ofte hurtigt på hypnoterapi.\"}}]}" }}
        />
      </Head>

      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "120px 20px 80px", fontFamily: "system-ui, -apple-system, sans-serif", lineHeight: 1.7, color: "#333" }}>

        {/* GENKENDELSE */}
        <section style={{ marginBottom: "60px" }}>
          <h1 style={{ fontSize: "34px", fontWeight: 600, lineHeight: 1.25, marginBottom: "20px" }}>
            Du ved hvad du kan, men kroppen blokerer
          </h1>
          <p style={{ fontSize: "18px", color: "#555", marginBottom: "16px", maxWidth: "660px" }}>
            Du har forberedt dig. Du kender stoffet. Og alligevel, når det gælder, er det som om adgangen til det, du ved, forsvinder. Hjernen kører i tomgang. Kroppen spænder op. Du ser andre klare det tilsyneladende uden besvær.
          </p>
          <p style={{ fontSize: "16px", color: "#666", maxWidth: "660px" }}>
            Det er ikke et spørgsmål om forberedelse eller intelligens. Det er et nervesystem, der reagerer forkert på det rette tidspunkt.
          </p>
        </section>

        {/* HVAD DER SKER */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "20px" }}>Hvad der faktisk sker</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
            {[
              {
                titel: "Kroppen aktiverer flugt-respons",
                tekst: "Præstationsangst er ikke svaghed. Det er en reel stressrespons, aktiveret af hjernen, fordi den opfatter situationen som farlig. Cortisol og adrenalin frigives. Blod ledes væk fra den tænkende del af hjernen. Du blokerer ikke, fordi du er dårlig forberedt, men fordi din krop prøver at beskytte dig.",
              },
              {
                titel: "Resultatet definerer din værdi",
                tekst: "Bag præstationsangst ligger ofte en dyb overbevisning: at resultatet siger noget fundamentalt om, hvem du er. Den overbevisning aktiverer alarmsystemet. Jo mere der er på spil, jo stærkere reaktionen. Det er ikke en tankegang, det er en automatisk reaktion.",
              },
              {
                titel: "Forberedelse løser det ikke",
                tekst: "De fleste med præstationsangst er faktisk godt forberedte. Problemet er ikke viden, det er hvad der sker i kroppen i den afgørende situation. Mere forberedelse dæmper angsten kortvarigt, men ændrer ikke grundmønsteret.",
              },
            ].map((k) => (
              <div key={k.titel} style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>{k.titel}</h3>
                <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>{k.tekst}</p>
              </div>
            ))}
          </div>
        </section>

        {/* HVEM DET RAMMER */}
        <section style={{ marginBottom: "60px", padding: "32px", background: "#f5f7fa", borderRadius: "10px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "16px" }}>Hvem præstationsangst rammer</h2>
          <p style={{ fontSize: "15px", marginBottom: "16px" }}>
            Præstationsangst er udbredt ved eksamener, mundtlige fremlæggelser, vigtige jobsamtaler, sportskonkurrencer og præstationssituationer på arbejdet. Det rammer på tværs af alder, og Jan arbejder med både unge under eksamenspres og voksne i professionelle sammenhænge.
          </p>
          <p style={{ fontSize: "15px", marginBottom: "16px" }}>
            Forskning viser, at eksamensangst påvirker en betydelig del af studerende og kan have direkte indvirkning på resultater, uanset det faglige niveau. Sundhedsstyrelsen anerkender præstationsangst som en af de hyppigste årsager til psykisk mistrivsel hos unge.
          </p>
          <p style={{ fontSize: "15px", color: "#666", fontStyle: "italic" }}>
            Kilde: Sundhedsstyrelsen.dk, Vidensråd for Forebyggelse.
          </p>
        </section>


        {/* CITAT - KØREPRØVE */}
        <section style={{ marginBottom: "60px", padding: "32px", background: "#fff", borderRadius: "10px", border: "1px solid #e5e7eb", borderLeft: "4px solid #5a7a8f" }}>
          <p style={{ fontSize: "18px", lineHeight: 1.7, color: "#333", marginBottom: "16px", fontStyle: "italic" }}>
            "Jeg har behandlet over 25 klienter, der havde problemer med at gennemføre og blive indstillet til køreprøven, samt bestå selve prøven. Alle har bestået efter blot én behandling. Enkelte ønskede selv en opfølgende session."
          </p>
          <p style={{ fontSize: "14px", color: "#888", fontWeight: 500 }}>Jan Gaarsdal, hypnoterapeut</p>
        </section>

        {/* HVAD HYPNOTERAPI GØR */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Hvad hypnoterapi gør ved præstationsangst</h2>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>
            Hypnoterapi arbejder med to ting samtidigt. Den ene er overbevisningen om at resultatet definerer din værdi. Den anden er kroppens automatiske stressrespons i præstationssituationen.
          </p>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>
            Under hypnoterapi lærer nervesystemet at aktivere ro og fokus i stedet for panik. Det sker ikke ved at du taler dig til ro, men ved at du øver den faktiske fysiologiske tilstand i en kontekst der ligner præstationssituationen. Reaktionen ændres ved kilden, ikke ved overfladen.
          </p>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>
            Jan arbejder også med de unge der har eksamen forude, og tilpasser sit arbejde til om angsten primært sidder i kroppen, i tankerne eller i overbevisninger om, hvad der sker, hvis det går galt.
          </p>
          <p style={{ fontSize: "15px", color: "#666", maxWidth: "700px" }}>
            Resultater kan komme hurtigt, særligt ved situationsbestemt præstationsangst. Den gratis forsamtale afklarer om hypnoterapi er det rette for dig.
          </p>
        </section>

        {/* OM JAN */}
        <section style={{ marginBottom: "48px", padding: "32px", background: "#f9fafb", borderRadius: "10px", borderLeft: "3px solid #5a7a8f" }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>Jan Gaarsdal, hypnoterapeut i Birkerød</h2>
            <p style={{ fontSize: "15px", color: "#555", marginBottom: "16px", lineHeight: 1.7 }}>
              Jan arbejder med præstationsangst hos både unge under eksamenspres og voksne i professionelle situationer. Han tilpasser sin tilgang til om angsten er situationsbestemt eller et dybere mønster.
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
          </div>
        </section>

        {/* FAQ */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "24px" }}>Ofte stillede spørgsmål</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ borderBottom: "1px solid #eee", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#333" }}>Kan hypnose hjælpe mod præstationsangst?</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7 }}>Ja. Hypnoterapi ændrer den fysiologiske stressrespons i præstationssituationen, så nervesystemet aktiverer ro og fokus i stedet for panik. Resultater kommer ofte hurtigt ved situationsbestemt præstationsangst.</p>
            </div>
            <div style={{ borderBottom: "1px solid #eee", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#333" }}>Kan hypnose hjælpe mod eksamensangst?</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7 }}>Ja. Eksamensangst er en stressrespons hvor adgangen til det man ved blokeres. Hypnoterapi træner nervesystemet til at forblive roligt og fokuseret i prøvesituationen, så du kan præstere efter dit faktiske niveau.</p>
            </div>
            <div style={{ borderBottom: "1px solid #eee", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#333" }}>Hvor lang tid før min eksamen skal jeg starte?</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7 }}>Helst nogle uger før, så der er tid til at arbejde med reaktionen. Men selv få sessioner tæt på en eksamen kan have effekt. Kontakt Jan i god tid hvis muligt.</p>
            </div>
            <div style={{ borderBottom: "1px solid #eee", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#333" }}>Hjælper hypnose mod køreprøveangst?</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7 }}>Ja. Jan har hjulpet over 25 klienter med køreprøveangst, hvor alle har bestået efter blot én behandling, og enkelte har ønsket en opfølgende session. Køreprøveangst reagerer ofte hurtigt på hypnoterapi.</p>
            </div>
          </div>
        </section>

        {/* RELATEREDE */}
        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 500, color: "#888", marginBottom: "12px" }}>Relaterede emner</h2>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href="/sovn" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Søvnproblemer</Link>
            <Link href="/kender-du-det" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Kender du det?</Link>
            <Link href="/children" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Børn og unge</Link>
            <Link href="/kontakt" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Kontakt Jan</Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
