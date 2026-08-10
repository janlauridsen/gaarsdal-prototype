import Head from "next/head"
import Link from "next/link"
import Header from "../components/Header"
import Footer from "../components/Footer"

export default function PraestationsangstPage() {
  return (
    <>
      <Header />
      <Head>
        <title>Præstationsangst og eksamensangst | Gaarsdal</title>
        <meta name="description" content="Præstationsangst og eksamensangst. Du ved hvad du kan, men kroppen blokerer. Hypnoterapi arbejder med reaktionen, ikke pensummet. Jan Gaarsdal, Birkerød." />
        <link rel="canonical" href="https://gaarsdal.net/praestationsangst" />
        <meta property="og:title" content="Præstationsangst og eksamensangst | Gaarsdal Birkerød" />
        <meta property="og:description" content="Du har forberedt dig. Og alligevel blokerer du. Præstationsangst sidder ikke i pensummet, det sidder i nervesystemet." />
        <meta property="og:image" content="https://gaarsdal.net/og-jan-gaarsdal.jpg" />
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
          dangerouslySetInnerHTML={{ __html: "{\"@context\": \"https://schema.org\", \"@type\": \"FAQPage\", \"mainEntity\": [{\"@type\": \"Question\", \"name\": \"Kan hypnose hjælpe mod præstationsangst?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Ja. Hypnoterapi ændrer den fysiologiske stressrespons i præstationssituationen, så nervesystemet aktiverer ro og fokus i stedet for panik. Resultater kommer ofte hurtigt ved situationsbestemt præstationsangst.\"}}, {\"@type\": \"Question\", \"name\": \"Kan hypnose hjælpe mod eksamensangst?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Ja. Eksamensangst er en stressrespons hvor adgangen til det man ved blokeres. Hypnoterapi træner nervesystemet til at forblive roligt og fokuseret i prøvesituationen, så du kan præstere efter dit faktiske niveau.\"}}, {\"@type\": \"Question\", \"name\": \"Hvor lang tid før min eksamen skal jeg starte?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Helst nogle uger før, så der er tid til at arbejde med reaktionen. Men selv få sessioner tæt på en eksamen kan have effekt. Kontakt Jan i god tid hvis muligt.\"}}, {\"@type\": \"Question\", \"name\": \"Hjælper hypnose mod køreprøveangst?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Ja. Jan har arbejdet med over 25 med køreprøveangst, henvist af den samme kørelærer, som fortæller at de består. De fleste har kun brug for én session.\"}}]}" }}
        />
      </Head>

      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "120px 20px 80px", fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif", lineHeight: 1.7, color: "#2C2A28" }}>

        {/* GENKENDELSE */}
        <section style={{ marginBottom: "60px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 600, lineHeight: 1.3, letterSpacing: "-0.01em", marginBottom: "20px" }}>
            Du ved hvad du kan, men kroppen blokerer
          </h1>
          <p style={{ fontSize: "19px", lineHeight: 1.65, color: "#4A463F", marginBottom: "18px", maxWidth: "700px" }}>
            Du har forberedt dig. Du kender stoffet. Og alligevel, når det gælder, er det som om adgangen til det, du ved, forsvinder. Hjernen kører i tomgang. Kroppen spænder op. Du ser andre klare det tilsyneladende uden besvær.
          </p>
          <p style={{ fontSize: "17px", lineHeight: 1.7, color: "#4A463F", maxWidth: "700px" }}>
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
              <div key={k.titel} style={{ padding: "24px", background: "#fff", border: "1px solid #E3DFD5", borderRadius: "8px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>{k.titel}</h3>
                <p style={{ fontSize: "14px", color: "#4A463F", lineHeight: 1.7 }}>{k.tekst}</p>
              </div>
            ))}
          </div>
        </section>

        {/* HVEM DET RAMMER */}
        <section style={{ marginBottom: "60px", padding: "32px", background: "#F5F3EE", borderRadius: "10px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "16px" }}>Hvem præstationsangst rammer</h2>
          <p style={{ fontSize: "16px", marginBottom: "16px", lineHeight: 1.7 }}>
            Præstationsangst er udbredt ved eksamener, mundtlige fremlæggelser, vigtige jobsamtaler, sportskonkurrencer og præstationssituationer på arbejdet. Det rammer på tværs af alder, og Jan arbejder med både unge under eksamenspres og voksne i professionelle sammenhænge.
          </p>
          <p style={{ fontSize: "16px", marginBottom: "16px", lineHeight: 1.7 }}>
            Forskning viser, at eksamensangst påvirker en betydelig del af studerende og kan have direkte indvirkning på resultater, uanset det faglige niveau. Sundhedsstyrelsen anerkender præstationsangst som en af de hyppigste årsager til psykisk mistrivsel hos unge.
          </p>
          <p style={{ fontSize: "16px", color: "#6B675F", fontStyle: "italic", lineHeight: 1.7 }}>
            Kilde: <a href="https://www.sst.dk" target="_blank" rel="noopener" style={{ color: "#5A7049", textDecoration: "underline" }}>Sundhedsstyrelsen.dk</a>, <a href="https://www.vidensraad.dk" target="_blank" rel="noopener" style={{ color: "#5A7049", textDecoration: "underline" }}>Vidensråd for Forebyggelse</a>.
          </p>
        </section>


        {/* CITAT - KØREPRØVE */}
        <section style={{ marginBottom: "60px", padding: "32px", background: "#fff", borderRadius: "10px", border: "1px solid #E3DFD5", borderLeft: "4px solid #5A7049" }}>
          <p style={{ fontSize: "18px", lineHeight: 1.7, color: "#2C2A28", marginBottom: "16px", fontStyle: "italic" }}>
            "Jeg har arbejdet med over 25 med køreprøveangst, henvist af den samme kørelærer. Han fortæller mig, at de består. De fleste har kun brug for én session."
          </p>
          <p style={{ fontSize: "14px", color: "#6B675F", fontWeight: 500, lineHeight: 1.7 }}>Jan Gaarsdal, hypnoterapeut</p>
        </section>

        {/* HVAD HYPNOTERAPI GØR */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Hvad hypnoterapi gør ved præstationsangst</h2>
          <p style={{ fontSize: "16px", marginBottom: "16px", maxWidth: "700px", lineHeight: 1.7 }}>
            Hypnoterapi arbejder med to ting samtidigt. Den ene er overbevisningen om at resultatet definerer din værdi. Den anden er kroppens automatiske stressrespons i præstationssituationen.
          </p>
          <p style={{ fontSize: "16px", marginBottom: "16px", maxWidth: "700px", lineHeight: 1.7 }}>
            Under hypnoterapi lærer nervesystemet at aktivere ro og fokus i stedet for panik. Det sker ikke ved at du taler dig til ro, men ved at du øver den faktiske fysiologiske tilstand i en kontekst der ligner præstationssituationen. Reaktionen ændres ved kilden, ikke ved overfladen.
          </p>
          <p style={{ fontSize: "16px", marginBottom: "16px", maxWidth: "700px", lineHeight: 1.7 }}>
            Jan arbejder også med de unge der har eksamen forude, og tilpasser sit arbejde til om angsten primært sidder i kroppen, i tankerne eller i overbevisninger om, hvad der sker, hvis det går galt.
          </p>
          <p style={{ fontSize: "16px", color: "#6B675F", maxWidth: "700px", lineHeight: 1.7 }}>
            Resultater kan komme hurtigt, særligt ved situationsbestemt præstationsangst. Den gratis forsamtale afklarer om hypnoterapi er det rette for dig.
          </p>
        </section>


        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Sådan hjælper hypnose mod præstationsangst</h2>
          <p style={{ fontSize: "16px", marginBottom: "16px", maxWidth: "700px", lineHeight: 1.7 }}>Præstationsangst er ikke mangel på evner eller forberedelse. Det er to ting, der arbejder sammen: en overbevisning om, at resultatet definerer din værdi, og en krop, der aktiverer en reel stressrespons i det øjeblik, det gælder. Under den respons lukker adgangen til din arbejdshukommelse, og du kan ikke komme til det, du faktisk ved. Blackout til eksamen er ikke manglende forberedelse; det er en alarmreaktion.</p>
          <p style={{ fontSize: "16px", marginBottom: "16px", maxWidth: "700px", lineHeight: 1.7 }}>Hypnose arbejder med begge dele. Den automatiske stressrespons i præstationssituationen dæmpes, så kroppen kan blive i ro og fokus i stedet for panik. Og overbevisningen om, at din værdi afhænger af resultatet, ændres dér, hvor den er lagret, under den bevidste tænkning.</p>
          <p style={{ fontSize: "16px", marginBottom: "16px", maxWidth: "700px", lineHeight: 1.7 }}>Resultatet er, at du får adgang til dine evner, når det gælder. Du lærer at aktivere ro og koncentration i situationer, der før udløste blokering. Det er en reel ændring i nervesystemet, ikke en mental teknik du skal huske midt i presset.</p>
          <p style={{ fontSize: "16px", color: "#6B675F", maxWidth: "700px", lineHeight: 1.7 }}>Paradoksalt nok stiger præstationen ofte, netop når frygten for at fejle falder, fordi energien ikke længere bruges på at bekæmpe panikken.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Sådan foregår et forløb</h2>
          <p style={{ fontSize: "16px", marginBottom: "16px", maxWidth: "700px", lineHeight: 1.7 }}><strong>Gratis forsamtale (30 min).</strong> Vi taler om hvad du oplever, hvornår det startede, og hvad du har prøvet. Her afklarer vi sammen, om hypnoterapi er den rette tilgang for dig. Telefon eller fysisk, og helt uforpligtende.</p>
          <p style={{ fontSize: "16px", marginBottom: "16px", maxWidth: "700px", lineHeight: 1.7 }}><strong>Første session (90 min).</strong> En grundig samtale om din historie og dit mønster, efterfulgt af den første hypnose. De fleste bliver overraskede over hvor naturligt det føles: en dyb afspænding hvor du hører alt, husker alt og har fuld kontrol.</p>
          <p style={{ fontSize: "16px", marginBottom: "16px", maxWidth: "700px", lineHeight: 1.7 }}><strong>Opfølgende sessioner (ca. 60 min).</strong> Arbejdet målrettes det, der driver netop dit mønster. Mange mærker forandring efter få sessioner; afgrænsede problemstillinger kan ofte klares hurtigt, mens mere indgroede mønstre kræver et lidt længere forløb.</p>
          <p style={{ fontSize: "16px", color: "#6B675F", maxWidth: "700px", lineHeight: 1.7 }}>Sessioner foregår fysisk i Birkerød eller online efter aftale. Se <Link href="/priser" style={{ color: "#5A7049" }}>priser</Link>.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Sådan viser præstationsangst sig</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "700px" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Blokering når det gælder</h3>
              <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7, margin: 0 }}>Til daglig kan du det hele, men i eksamen, til præsentationen eller jobsamtalen forsvinder det. Hjernen går i alarm, og adgangen til det, du ved, lukker. Bagefter kommer det hele tilbage.</p>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Eksamens- og prøveangst</h3>
              <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7, margin: 0 }}>Måneders forberedelse, og så blackout i selve situationen. Eller søvnløse nætter og mavepine op til. Eksamensangst rammer ofte de dygtige og samvittighedsfulde, fordi de har mest på spil i egne øjne.</p>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Køreprøveangst</h3>
              <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7, margin: 0 }}>Du kan køre fint i timerne, men til prøven tager nerverne over. Presset, den vurderende eksaminator og frygten for at dumpe skaber præcis den blokering, der får dig til at fejle. Et af de områder, hvor hypnose ofte virker hurtigt.</p>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Værd koblet til præstation</h3>
              <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7, margin: 0 }}>Bag angsten ligger ofte en overbevisning om, at du kun er noget værd, hvis du præsterer. Det gør hver præstation til en test af din værdi som menneske, og presset bliver enormt. Det er den kobling, der skal løsnes.</p>
            </div>
          </div>
        </section>

        {/* OM JAN */}

        <section style={{ marginBottom: "60px", padding: "28px 32px", background: "#F7F1E8", borderRadius: "10px", border: "1px solid #E6D9C2" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>Vigtigt at vide</h2>
          <p style={{ fontSize: "16px", color: "#4A463F", maxWidth: "700px", margin: 0, lineHeight: 1.7 }}>Hypnoterapi er et supplement til - ikke en erstatning for - lægelig eller psykologisk behandling ved svær angstlidelse. Ved panikangst, generaliseret angst der lammet hverdagen, eller mistanke om PTSD, bør du starte med at tale med din læge.</p>
        </section>
        <section style={{ marginBottom: "48px", padding: "32px", background: "#F5F3EE", borderRadius: "10px", borderLeft: "3px solid #5A7049" }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>Jan Gaarsdal, hypnoterapeut i Birkerød</h2>
            <p style={{ fontSize: "16px", color: "#4A463F", marginBottom: "16px", lineHeight: 1.7 }}>
              Jan arbejder med præstationsangst hos både unge under eksamenspres og voksne i professionelle situationer. Han tilpasser sin tilgang til om angsten er situationsbestemt eller et dybere mønster.
            </p>
            <div style={{ padding: "12px 16px", background: "#E8EBE2", borderRadius: "6px", display: "inline-block" }}>
              <p style={{ fontSize: "14px", fontWeight: 500, color: "#2C2A28", margin: "0 0 8px", lineHeight: 1.7 }}>
                🎯 Gratis forsamtale, 30 minutter, telefon eller fysisk
              </p>
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <Link href="/kontakt" style={{ fontSize: "14px", color: "#fff", background: "#627A52", textDecoration: "none", fontWeight: 500, padding: "8px 16px", borderRadius: "4px" }}>
                  Book forsamtale
                </Link>
                <a href="tel:+4542807474" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", fontWeight: 500, padding: "8px 0" }}>
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
            <div style={{ borderBottom: "1px solid #E3DFD5", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#2C2A28" }}>Kan hypnose hjælpe mod præstationsangst?</h3>
              <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7 }}>Ja. Hypnoterapi ændrer den fysiologiske stressrespons i præstationssituationen, så nervesystemet aktiverer ro og fokus i stedet for panik. Resultater kommer ofte hurtigt ved situationsbestemt præstationsangst.</p>
            </div>
            <div style={{ borderBottom: "1px solid #E3DFD5", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#2C2A28" }}>Kan hypnose hjælpe mod eksamensangst?</h3>
              <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7 }}>Ja. Eksamensangst er en stressrespons hvor adgangen til det man ved blokeres. Hypnoterapi træner nervesystemet til at forblive roligt og fokuseret i prøvesituationen, så du kan præstere efter dit faktiske niveau.</p>
            </div>
            <div style={{ borderBottom: "1px solid #E3DFD5", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#2C2A28" }}>Hvor lang tid før min eksamen skal jeg starte?</h3>
              <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7 }}>Helst nogle uger før, så der er tid til at arbejde med reaktionen. Men selv få sessioner tæt på en eksamen kan have effekt. Kontakt Jan i god tid hvis muligt.</p>
            </div>
            <div style={{ borderBottom: "1px solid #E3DFD5", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#2C2A28" }}>Hjælper hypnose mod køreprøveangst?</h3>
              <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7 }}>Ja. Jan har arbejdet med over 25 med køreprøveangst, henvist af den samme kørelærer, som fortæller at de består. De fleste har kun brug for én session.</p>
            </div>
          </div>
        </section>

        {/* RELATEREDE */}
        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 500, color: "#6B675F", marginBottom: "12px" }}>Relaterede emner</h2>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href="/sovn" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", padding: "6px 14px", border: "1px solid #5A7049", borderRadius: "20px" }}>Søvnproblemer →</Link>
            <Link href="/kender-du-det" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", padding: "6px 14px", border: "1px solid #5A7049", borderRadius: "20px" }}>Kender du det? →</Link>
            <Link href="/children" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", padding: "6px 14px", border: "1px solid #5A7049", borderRadius: "20px" }}>Børn og unge</Link>
            <Link href="/kontakt" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", padding: "6px 14px", border: "1px solid #5A7049", borderRadius: "20px" }}>Kontakt Jan →</Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
