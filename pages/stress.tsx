import Head from "next/head"
import Link from "next/link"
import Header from "../components/Header"
import Footer from "../components/Footer"

export default function Page() {
  return (
    <>
      <Header />
      <Head>
        <title>Konstant stress og hypnoterapi Birkerød | Gaarsdal</title>
        <meta name="description" content="Stress, der ikke slipper, selv i weekenden. Hypnoterapi arbejder med nervesystemets grundindstilling. Jan Gaarsdal, Birkerød. Gratis forsamtale 30 minutter." />
        <link rel="canonical" href="https://gaarsdal.net/stress" />
        <meta property="og:title" content="Konstant stress og hypnoterapi Birkerød | Gaarsdal" />
        <meta property="og:description" content="Stress der ikke slipper, selv i weekenden. Hypnoterapi arbejder med nervesystemets grundindstilling. Jan Gaarsdal, Birkerød. Gratis forsamtale 30 minutter." />
        <meta property="og:image" content="https://gaarsdal.net/og-jan-gaarsdal.jpg" />
        <meta property="og:url" content="https://gaarsdal.net/stress" />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: "{\"@context\": \"https://schema.org\", \"@type\": \"FAQPage\", \"mainEntity\": [{\"@type\": \"Question\", \"name\": \"Kan hypnose hjælpe mod stress?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Ja. Hypnoterapi arbejder med nervesystemets grundindstilling, så ro får lettere ved at blive standard i stedet for beredskab. Det er en dybere ændring end afspændingsøvelser, fordi det arbejder med hvad nervesystemet automatisk opfatter som normaltilstand.\"}}, {\"@type\": \"Question\", \"name\": \"Hvad er forskellen på hypnose og mindfulness mod stress?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Mindfulness træner din bevidste opmærksomhed. Hypnoterapi arbejder direkte med de automatiske reaktioner under bevidst tænkning. De kan supplere hinanden og arbejder med hver sit lag.\"}}, {\"@type\": \"Question\", \"name\": \"Hvor mange sessioner kræver stressbehandling?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Det afhænger af hvor længe stressen har stået på. Den gratis forsamtale giver et realistisk billede. Mange oplever bedring i søvn og ro tidligt i forløbet.\"}}, {\"@type\": \"Question\", \"name\": \"Kan hypnose hjælpe ved arbejdsrelateret stress?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Ja. Hypnoterapi arbejder med den grundlæggende stressrespons uanset hvad der udløser den. Det ændrer hvordan nervesystemet reagerer på pres, så du genvinder overskud og ro.\"}}]}" }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              name: "Stress og hypnoterapi",
              description: "Stress, der ikke slipper, selv i weekenden. Hypnoterapi arbejder med nervesystemets grundindstilling. Jan Gaarsdal, Birkerød. Gratis forsamtale 30 minutter.",
              url: "https://gaarsdal.net/stress",
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

      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "120px 20px 80px", fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif", lineHeight: 1.7, color: "#2C2A28" }}>

        <section style={{ marginBottom: "60px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 600, lineHeight: 1.3, letterSpacing: "-0.01em", marginBottom: "20px" }}>Du funktionerer, men det koster mere end det burde</h1>
          <p style={{ fontSize: "19px", lineHeight: 1.65, color: "#4A463F", marginBottom: "18px", maxWidth: "700px" }}>Du har altid noget der presser. Selv når der objektivt set ikke er grund til stress, er kroppen på vagt. Du slapper ikke rigtig af, ikke engang i weekenden. Du er ikke i krise, men du er heller ikke i ro.</p>
          <p style={{ fontSize: "17px", lineHeight: 1.7, color: "#4A463F", maxWidth: "700px" }}>Det er ikke et produktivitetsproblem. Det er et nervesystem der er låst i grundberedskab.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "20px" }}>Hvad der faktisk sker</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
                        <div style={{ padding: "24px", background: "#fff", border: "1px solid #E3DFD5", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Kroppen ved ikke at krigen er slut</h3>
              <p style={{ fontSize: "14px", color: "#4A463F", lineHeight: 1.7 }}>Kronisk stress er ikke en reaktion på aktuelle trusler. Det er en grundindstilling. Nervesystemet er kørt i beredskab så længe at det er blevet normaltilstand. Kroppen producerer stresshormoner kontinuerligt, selv når der ikke er noget at flygte fra.</p>
            </div>
            <div style={{ padding: "24px", background: "#fff", border: "1px solid #E3DFD5", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Hjernen scanner konstant for problemer</h3>
              <p style={{ fontSize: "14px", color: "#4A463F", lineHeight: 1.7 }}>Et nervesystem under kronisk stress er altid på udkig. Hvad kan gå galt, hvad er ikke løst, hvad mangler. Det er ikke pessimisme, det er et alarmsystem, der kører på fuld kraft fordi det ikke har lært at sætte sig i ro.</p>
            </div>
            <div style={{ padding: "24px", background: "#fff", border: "1px solid #E3DFD5", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Det akkumulerer</h3>
              <p style={{ fontSize: "14px", color: "#4A463F", lineHeight: 1.7 }}>Kortvarig stress er normal og nødvendig. Kronisk stress er anderledes. Effekterne akkumulerer over tid: søvnkvaliteten falder, koncentrationen svigter, kroppen slider hurtigere. Det er svært at se fordi det sker gradvist.</p>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: "60px", padding: "32px", background: "#F5F3EE", borderRadius: "10px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "16px" }}>Hvad forskning viser</h2>
          <p style={{ fontSize: "16px", marginBottom: "12px", lineHeight: 1.7 }}>Langvarig stress er en af de hyppigste årsager til sygemeldinger i Danmark. Vidensråd for Forebyggelse vurderer, at stress koster det danske samfund betydelige ressourcer i tabte arbejdsdage og sundhedsudgifter. WHO klassificerer udbrændthed som et arbejdsrelateret fænomen i ICD-11.</p>
          <p style={{ fontSize: "16px", color: "#6B675F", fontStyle: "italic", lineHeight: 1.7 }}>Kilde: <a href="https://www.vidensraad.dk" target="_blank" rel="noopener" style={{ color: "#5A7049", textDecoration: "underline" }}>Vidensråd for Forebyggelse</a>, WHO, <a href="https://www.sst.dk" target="_blank" rel="noopener" style={{ color: "#5A7049", textDecoration: "underline" }}>Sundhedsstyrelsen.dk</a>.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Hvad hypnoterapi gør</h2>
          <p style={{ fontSize: "16px", marginBottom: "16px", maxWidth: "700px", lineHeight: 1.7 }}>Hypnoterapi arbejder med nervesystemets grundindstilling. Dit system lærer, at ro er standard, ikke beredskab. Det sker ikke ved afspænding eller mindfulness alene, men ved en dybere ændring i, hvad nervesystemet opfatter som normalt.</p>
          <p style={{ fontSize: "16px", color: "#6B675F", maxWidth: "700px", lineHeight: 1.7 }}>Jan arbejder med kronisk stress hos både erhvervsaktive og unge. Tilgangen tilpasses til om stressen primært sidder i tanker, krop eller overbevisninger om, hvad der er nødvendigt.</p>
        </section>


        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Sådan beroliger hypnose et stresset nervesystem</h2>
          <p style={{ fontSize: "16px", marginBottom: "16px", maxWidth: "700px", lineHeight: 1.7 }}>Kronisk stress er ikke en reaktion på det, der sker omkring dig lige nu. Det er et nervesystem, der er låst i beredskab. Kroppen ved ikke, at faren er ovre, og holder dig på vagt, også i weekenden, også når der objektivt set ikke er noget at frygte. Beredskabet er blevet din grundindstilling.</p>
          <p style={{ fontSize: "16px", marginBottom: "16px", maxWidth: "700px", lineHeight: 1.7 }}>Hypnose arbejder med præcis den grundindstilling. I den hypnotiske tilstand falder alarmberedskabet, og kroppen registrerer, hvordan reel ro føles, ofte for første gang i lang tid. Hvor afspænding og mindfulness træner dig i at falde til ro, arbejder hypnose med, hvad nervesystemet opfatter som normaltilstand.</p>
          <p style={{ fontSize: "16px", marginBottom: "16px", maxWidth: "700px", lineHeight: 1.7 }}>Over sessionerne lærer systemet, at beredskab ikke skal være standard, at ro er det normale, og at det kan vende tilbage til ro hurtigere efter belastning. Det hæver din samlede tærskel, så det skal mere til, før alarmen går.</p>
          <p style={{ fontSize: "16px", color: "#6B675F", maxWidth: "700px", lineHeight: 1.7 }}>Stress hænger ofte sammen med søvn og overtænkning, og de tre forstærker hinanden. Derfor arbejdes der med hele billedet, ikke kun det enkelte symptom.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Sådan foregår et forløb</h2>
          <p style={{ fontSize: "16px", marginBottom: "16px", maxWidth: "700px", lineHeight: 1.7 }}><strong>Gratis forsamtale (30 min).</strong> Vi taler om hvad du oplever, hvornår det startede, og hvad du har prøvet. Her afklarer vi sammen, om hypnoterapi er den rette tilgang for dig. Telefon eller fysisk, og helt uforpligtende.</p>
          <p style={{ fontSize: "16px", marginBottom: "16px", maxWidth: "700px", lineHeight: 1.7 }}><strong>Første session (90 min).</strong> En grundig samtale om din historie og dit mønster, efterfulgt af den første hypnose. De fleste bliver overraskede over hvor naturligt det føles: en dyb afspænding hvor du hører alt, husker alt og har fuld kontrol.</p>
          <p style={{ fontSize: "16px", marginBottom: "16px", maxWidth: "700px", lineHeight: 1.7 }}><strong>Opfølgende sessioner (ca. 60 min).</strong> Arbejdet målrettes det, der driver netop dit mønster. Mange mærker forandring efter få sessioner; afgrænsede problemstillinger kan ofte klares hurtigt, mens mere indgroede mønstre kræver et lidt længere forløb.</p>
          <p style={{ fontSize: "16px", color: "#6B675F", maxWidth: "700px", lineHeight: 1.7 }}>Sessioner foregår fysisk i Birkerød eller online efter aftale. Se <Link href="/priser" style={{ color: "#5A7049" }}>priser</Link>.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Sådan viser kronisk stress sig</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "700px" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Kroppen er konstant på vagt</h3>
              <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7, margin: 0 }}>Spændt kæbe, anspændte skuldre, en uro i maven der ikke forsvinder. Kroppen er i alarmberedskab, selv når du hviler. Du slapper ikke rigtigt af, heller ikke i ferien.</p>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Du fungerer, men det koster</h3>
              <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7, margin: 0 }}>Udadtil klarer du det hele. Indadtil er reserverne ved at være brugt. Mange holder facaden længe, indtil kroppen sætter foden ned med søvnløshed, hovedpine, infektioner eller en pludselig følelse af tomhed.</p>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Søvnen og tankerne følger med</h3>
              <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7, margin: 0 }}>Stress, dårlig søvn og tankemylder hænger sammen. Det stressede nervesystem holder dig vågen, og søvnmanglen øger stressen yderligere. Det bliver en spiral, der er svær at bryde med viljestyrke alene.</p>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Mod udbrændthed</h3>
              <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7, margin: 0 }}>Når den kroniske stress får lov at fortsætte, ender mange i en tilstand af udmattelse, hvor selv små ting bliver uoverskuelige. Jo tidligere nervesystemet får hjælp til at finde ro, jo lettere er vejen tilbage.</p>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: "60px", padding: "28px 32px", background: "#F7F1E8", borderRadius: "10px", border: "1px solid #E6D9C2" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>Vigtigt at vide</h2>
          <p style={{ fontSize: "16px", color: "#4A463F", maxWidth: "700px", margin: 0, lineHeight: 1.7 }}>Ved tegn på alvorlig stressbelastning eller begyndende udbrændthed (vedvarende udmattelse, hukommelsesbesvær, følelse af at bryde sammen) bør du også inddrage din læge. Hypnoterapi kan være en vigtig del af at finde ro, men ved svær stress er det et supplement til lægelig vurdering og eventuel sygemelding.</p>
        </section>

        <section style={{ marginBottom: "48px", padding: "32px", background: "#F5F3EE", borderRadius: "10px", borderLeft: "3px solid #5A7049" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>Jan Gaarsdal, hypnoterapeut i Birkerød</h2>
          <p style={{ fontSize: "16px", color: "#4A463F", marginBottom: "16px", lineHeight: 1.7 }}>
            Jan arbejder med dette område hos voksne og unge. Den gratis forsamtale på 30 minutter afklarer om hypnoterapi er den rette tilgang for dig.
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
        </section>

        {/* INDSIGT ER IKKE NOK */}
        <section style={{ marginBottom: "60px", padding: "28px 32px", background: "#E8EBE2", borderRadius: "10px", borderLeft: "3px solid #5A7049" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>Indsigt er ikke det samme som forandring</h2>
          <p style={{ fontSize: "16px", color: "#4A463F", maxWidth: "700px", margin: 0, lineHeight: 1.7 }}>Du ved godt du er stresset, og måske endda hvorfor. Men at vide det får ikke nervesystemet til at slippe ned. Forandring sker ikke gennem indsigt, men ved at arbejde der hvor stressresponsen faktisk sidder.</p>
        </section>

                <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "24px" }}>Ofte stillede spørgsmål</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ borderBottom: "1px solid #E3DFD5", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#2C2A28" }}>Kan hypnose hjælpe mod stress?</h3>
              <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7 }}>Ja. Hypnoterapi arbejder med nervesystemets grundindstilling, så ro får lettere ved at blive standard i stedet for beredskab. Det er en dybere ændring end afspændingsøvelser, fordi det arbejder med hvad nervesystemet automatisk opfatter som normaltilstand.</p>
            </div>
            <div style={{ borderBottom: "1px solid #E3DFD5", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#2C2A28" }}>Hvad er forskellen på hypnose og mindfulness mod stress?</h3>
              <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7 }}>Mindfulness træner din bevidste opmærksomhed. Hypnoterapi arbejder direkte med de automatiske reaktioner under bevidst tænkning. De kan supplere hinanden og arbejder med hver sit lag.</p>
            </div>
            <div style={{ borderBottom: "1px solid #E3DFD5", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#2C2A28" }}>Hvor mange sessioner kræver stressbehandling?</h3>
              <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7 }}>Det afhænger af hvor længe stressen har stået på. Den gratis forsamtale giver et realistisk billede. Mange oplever bedring i søvn og ro tidligt i forløbet.</p>
            </div>
            <div style={{ borderBottom: "1px solid #E3DFD5", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#2C2A28" }}>Kan hypnose hjælpe ved arbejdsrelateret stress?</h3>
              <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7 }}>Ja. Hypnoterapi arbejder med den grundlæggende stressrespons uanset hvad der udløser den. Det ændrer hvordan nervesystemet reagerer på pres, så du genvinder overskud og ro.</p>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 500, color: "#6B675F", marginBottom: "12px" }}>Relaterede emner</h2>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                        <Link href="/angst" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", padding: "6px 14px", border: "1px solid #5A7049", borderRadius: "20px" }}>Angst</Link>
            <Link href="/digital-udbraendthed" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", padding: "6px 14px", border: "1px solid #5A7049", borderRadius: "20px" }}>Digital udbrændthed →</Link>
            <Link href="/irritation" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", padding: "6px 14px", border: "1px solid #5A7049", borderRadius: "20px" }}>Irritabilitet →</Link>
            <Link href="/sovn" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", padding: "6px 14px", border: "1px solid #5A7049", borderRadius: "20px" }}>Søvnproblemer</Link>
            <Link href="/kender-du-det" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", padding: "6px 14px", border: "1px solid #5A7049", borderRadius: "20px" }}>Kender du det?</Link>
            <Link href="/kontakt" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", padding: "6px 14px", border: "1px solid #5A7049", borderRadius: "20px" }}>Kontakt Jan</Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
