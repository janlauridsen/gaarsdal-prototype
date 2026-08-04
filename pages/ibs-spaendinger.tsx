import Head from "next/head"
import Link from "next/link"
import Header from "../components/Header"
import Footer from "../components/Footer"

export default function IbsSpaendingerPage() {
  return (
    <>
      <Header />
      <Head>
        <title>IBS og spændinger, hypnoterapi Birkerød | Gaarsdal</title>
        <meta name="description" content="IBS og kroniske spændinger opstår ofte i nervesystemet, ikke i organet. Hypnoterapi arbejder med stress-tarmsignalet og muskelspændinger. Jan Gaarsdal, Birkerød." />
        <link rel="canonical" href="https://gaarsdal.net/ibs-spaendinger" />
        <meta property="og:title" content="IBS og spændinger — hypnoterapi | Gaarsdal Birkerød" />
        <meta property="og:description" content="IBS og kroniske spændinger er kroppen der taler. Hypnoterapi arbejder med det nervesystem der driver symptomerne." />
        <meta property="og:image" content="https://gaarsdal.net/Jan-AI.png" />
        <meta property="og:url" content="https://gaarsdal.net/ibs-spaendinger" />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              name: "IBS, maveproblemer og spændinger — hypnoterapi",
              description: "Hypnoterapi til IBS og kroniske spændinger i Birkerød. Jan Gaarsdal arbejder med det autonome nervesystem der driver mave- og muskelreaktioner.",
              url: "https://gaarsdal.net/ibs-spaendinger",
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
          dangerouslySetInnerHTML={{ __html: "{\"@context\": \"https://schema.org\", \"@type\": \"FAQPage\", \"mainEntity\": [{\"@type\": \"Question\", \"name\": \"Kan hypnose hjælpe mod IBS?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Ja. Gut-directed hypnotherapy er en af de mest veldokumenterede ikke-medicinske behandlinger ved IBS. Den arbejder direkte med kommunikationen mellem hjerne og tarm og reducerer både symptomhyppighed og intensitet.\"}}, {\"@type\": \"Question\", \"name\": \"Kan hypnoterapi hjælpe mod kroniske spændinger?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Ja. Kroniske spændinger i nakke, skuldre, kæbe og ryg er ofte et nervesystem i vedvarende beredskab. Hypnoterapi arbejder med det autonome nervesystem og de mønstre der fastholder musklerne i spænding.\"}}, {\"@type\": \"Question\", \"name\": \"Jeg har fået konstateret IBS af min læge — hvad kan hypnose tilføje?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Medicinsk behandling af IBS fokuserer typisk på symptomlindring. Hypnoterapi arbejder med årsagen til at tarmen overreagerer: et nervesystem der sender for mange stresssignaler til mave-tarm-kanalen. Mange oplever vedvarende bedring frem for blot symptomlindring.\"}}, {\"@type\": \"Question\", \"name\": \"Hvad er gut-directed hypnotherapy?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Gut-directed hypnotherapy er en specifik tilgang til hypnoterapi ved IBS, dokumenteret i adskillige kliniske studier. Den kombinerer den hypnotiske tilstand med imagery og suggestioner rettet direkte mod tarmens reaktioner og nerve-tarmsignalet.\"}}]}" }}
        />
      </Head>

      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "120px 20px 80px", fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif", lineHeight: 1.7, color: "#333" }}>

        {/* GENKENDELSE */}
        <section style={{ marginBottom: "60px" }}>
          <h1 style={{ fontSize: "34px", fontWeight: 600, lineHeight: 1.25, marginBottom: "20px" }}>
            Kroppen spænder. Maven reagerer. Og du ved ikke hvornår det slår til
          </h1>
          <p style={{ fontSize: "18px", color: "#555", marginBottom: "16px", maxWidth: "660px" }}>
            Mavepine der ikke har en forklaring. Nakken der altid er stram. IBS-anfald der ødelægger planer. Kæben der spænder om natten. Lægerne siger der ikke er noget galt fysisk. Men det gør ondt, og det påvirker din hverdag, dit arbejde og dit liv.
          </p>
          <p style={{ fontSize: "16px", color: "#666", maxWidth: "660px" }}>
            Disse symptomer er ikke i dit hoved. De er i dit nervesystem — og nervesystemet kan påvirkes.
          </p>
        </section>

        {/* MEKANISME */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "20px" }}>Hvad der faktisk sker</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
            {[
              {
                titel: "Tarmen er en anden hjerne",
                tekst: "Mave-tarm-kanalen har sit eget nervesystem — det enteriske nervesystem — med over 100 millioner neuroner. Det kommunikerer konstant med hjernen via vagusnerven. Ved IBS og stressrelaterede maveproblemer er denne kommunikation overaktiveret: tarmen overreagerer på signaler der normalt filtreres fra.",
              },
              {
                titel: "Spændinger er fastfrosset beredskab",
                tekst: "Kroniske muskelspændinger er et nervesystem der ikke slipper beredskabet ned. Musklerne forbliver i en let aktiveret tilstand, fordi nervesystemet fortolker hverdagen som en konstant, lav trussel. Det er ikke viljestyret — det er automatisk og kan ændres.",
              },
              {
                titel: "Stress og krop er direkte forbundne",
                tekst: "Kortisol og adrenalin påvirker direkte tarmens bevægelighed og muskeltonussen i hele kroppen. Mange oplever IBS-anfald og spændingsopblussen i pressede perioder — ikke som tilfældig sammenfald, men som en direkte biologisk reaktion.",
              },
            ].map((k) => (
              <div key={k.titel} style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>{k.titel}</h3>
                <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>{k.tekst}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FORSKNING */}
        <section style={{ marginBottom: "60px", padding: "32px", background: "#f5f7fa", borderRadius: "10px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "16px" }}>Hvad forskning viser om hypnose og IBS</h2>
          <p style={{ fontSize: "15px", marginBottom: "12px" }}>
            Gut-directed hypnotherapy er en af de bedst dokumenterede ikke-medicinske behandlinger ved IBS. En metaanalyse publiceret i American Journal of Gastroenterology (2019) fandt at hypnoterapi reducerede IBS-symptomer hos 70–80 pct. af deltagerne, og at effekten holdt sig i op til 5 år efter behandlingen.
          </p>
          <p style={{ fontSize: "15px", marginBottom: "12px" }}>
            National Institute for Health and Care Excellence (NICE) i UK anbefaler gut-directed hypnotherapy som behandling ved IBS for patienter der ikke har tilstrækkelig effekt af kost- og medicinbehandling. Det er en af de meget få komplementære behandlinger med officiel klinisk anbefaling.
          </p>
          <p style={{ fontSize: "15px", color: "#666", fontStyle: "italic" }}>
            Kilde: American Journal of Gastroenterology, <a href="https://www.nice.org.uk" target="_blank" rel="noopener" style={{ color: "#5a7a8f", textDecoration: "underline" }}>NICE guidelines</a>, IBS-forbundet Danmark.
          </p>
        </section>

        {/* HVAD HYPNOTERAPI GØR */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Hvad hypnoterapi gør ved IBS og spændinger</h2>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>
            Ved IBS arbejder hypnoterapi direkte med kommunikationen mellem hjerne og tarm. I den hypnotiske tilstand bruges imagery og suggestioner der retter sig mod tarmens reaktioner — beroligende nerveaktiviteten og reducerende den sensoriske overfølsomhed der giver smerter og ubehag.
          </p>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>
            Ved kroniske spændinger arbejdes der med det autonome nervesystem — at bringe kroppen ud af det vedvarende beredskab. Mange oplever at spændinger i nakke, skuldre og kæbe slipper gradvist, efterhånden som nervesystemet lærer at fortolke hverdagen som sikker.
          </p>
          <p style={{ fontSize: "15px", color: "#666", maxWidth: "700px" }}>
            IBS og spændinger optræder ofte sammen — og arbejdet med dem er ikke adskilt. Et nervesystem i ro påvirker begge.
          </p>
        </section>

        {/* MØNSTRE */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>De typiske mønstre</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "700px" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>IBS med angst for anfald</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7, margin: 0 }}>Du planlægger din dag ud fra toiletters tilgængelighed. Sociale situationer og transport giver ekstra angst. Selve angsten for et anfald kan udløse anfaldet. Hypnoterapi bryder denne cirkel ved at arbejde med begge dele — tarmreaktionen og angsten for den.</p>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Nakke, skuldre og kæbespændinger</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7, margin: 0 }}>Du vågner om morgenen med stiv nakke. Din kæbe er presset om natten. Skuldrene sidder oppe ved ørerne. Massage hjælper kortvarigt. Spændingerne kommer tilbage. Det er fordi årsagen — et nervesystem i beredskab — ikke er adresseret.</p>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Mavepine uden medicinsk forklaring</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7, margin: 0 }}>Alle undersøgelser er normale. Lægerne finder intet. Men du har ondt, og det er virkeligt. Funktionelle mavegener — pine uden strukturel årsag — er typisk nervesystemsrelaterede og reagerer godt på hypnoterapeutisk arbejde.</p>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Symptomerne forværres i pres-perioder</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7, margin: 0 }}>Du ved godt at stress spiller ind. Men at vide det ændrer ikke symptomerne. Hypnoterapi arbejder ikke med din bevidste viden om stress — det arbejder med den automatiske reaktion der sker, inden du når at tænke over det.</p>
            </div>
          </div>
        </section>

        {/* FORLØB */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Sådan foregår et forløb</h2>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>
            <strong>Gratis forsamtale (30 min).</strong> Vi taler om dine symptomer, hvornår de opstod, hvad der udløser dem, og hvad du har prøvet. Her afklares om hypnoterapi er den rette tilgang. Telefon eller fysisk, uforpligtende.
          </p>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>
            <strong>Første session (90 min).</strong> En grundig samtale om din krop og dit nervesystems mønster, efterfulgt af den første hypnose. Mange beskriver at de allerede her mærker en kropslig ro de sjældent oplever.
          </p>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>
            <strong>Opfølgende sessioner (ca. 60 min).</strong> Arbejdet dykker dybere ned i det specifikke mønster. Ved IBS følges en protokol der typisk kræver 6–8 sessioner for varig effekt. Ved spændinger ses effekt ofte tidligere.
          </p>
          <p style={{ fontSize: "15px", color: "#666", maxWidth: "700px" }}>
            Sessioner foregår fysisk i Birkerød eller online efter aftale. Se <Link href="/priser" style={{ color: "#5a7a8f" }}>priser</Link>.
          </p>
        </section>

        {/* VIGTIGT AT VIDE */}
        <section style={{ marginBottom: "60px", padding: "28px 32px", background: "#fdf6f0", borderRadius: "10px", border: "1px solid #ecd9c6" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>Vigtigt at vide</h2>
          <p style={{ fontSize: "15px", color: "#555", maxWidth: "700px", margin: 0 }}>
            Nye, uforklarede mave-tarm-symptomer bør altid undersøges af din læge, inden du starter hypnoterapi. Det gælder særligt ved blod i afføringen, uventet vægttab, feber eller symptomer der eskalerer hurtigt. Hypnoterapi er ikke en erstatning for lægelig udredning, men et supplement der virker bedst når fysiske årsager er udelukket.
          </p>
        </section>

        {/* OM JAN */}
        <section style={{ marginBottom: "48px", padding: "32px", background: "#f9fafb", borderRadius: "10px", borderLeft: "3px solid #5a7a8f" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>Jan Gaarsdal, hypnoterapeut i Birkerød</h2>
          <p style={{ fontSize: "15px", color: "#555", marginBottom: "16px", lineHeight: 1.7 }}>
            Jan arbejder med IBS og kroniske spændinger som et nervesystemsfænomen. Han anvender gut-directed hypnotherapy ved IBS og tilpasser tilgangen til det specifikke mønster — om det primært er tarm, muskulatur eller en kombination.
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
        </section>

        {/* FAQ */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "24px" }}>Ofte stillede spørgsmål om IBS, spændinger og hypnose</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {[
              {
                q: "Kan hypnose hjælpe mod IBS?",
                a: "Ja. Gut-directed hypnotherapy er en af de mest veldokumenterede ikke-medicinske behandlinger ved IBS. Den arbejder direkte med kommunikationen mellem hjerne og tarm og reducerer både symptomhyppighed og intensitet. Effekten er dokumenteret i adskillige kliniske studier.",
              },
              {
                q: "Kan hypnoterapi hjælpe mod kroniske spændinger?",
                a: "Ja. Kroniske spændinger i nakke, skuldre, kæbe og ryg er ofte et nervesystem i vedvarende beredskab. Hypnoterapi arbejder med det autonome nervesystem og de mønstre der fastholder musklerne i spænding — ikke symptomerne, men årsagen.",
              },
              {
                q: "Jeg har fået konstateret IBS af min læge — hvad kan hypnose tilføje?",
                a: "Medicinsk behandling af IBS fokuserer typisk på symptomlindring. Hypnoterapi arbejder med årsagen til at tarmen overreagerer: et nervesystem der sender for mange stresssignaler til mave-tarm-kanalen. Mange oplever vedvarende bedring frem for blot symptomlindring.",
              },
              {
                q: "Hvad er gut-directed hypnotherapy?",
                a: "Gut-directed hypnotherapy er en specifik tilgang til hypnoterapi ved IBS, dokumenteret i adskillige kliniske studier. Den kombinerer den hypnotiske tilstand med imagery og suggestioner rettet direkte mod tarmens reaktioner og nerve-tarmsignalet.",
              },
              {
                q: "Kan hypnoterapi hjælpe, selv om mine spændinger er fysisk begrundede?",
                a: "Ofte er sondringen uklar. Kroniske spændinger har typisk både fysiske og nervesystemsmæssige komponenter. Hypnoterapi adresserer nervesystemskomponenten — og selv ved primært fysiske årsager kan reduktion af beredskabsniveauet give merkbar lindring.",
              },
            ].map((item) => (
              <div key={item.q} style={{ borderBottom: "1px solid #eee", paddingBottom: "16px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#333" }}>{item.q}</h3>
                <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7 }}>{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* RELATEREDE EMNER */}
        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 500, color: "#888", marginBottom: "12px" }}>Relaterede emner</h2>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href="/stress" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Stress →</Link>
            <Link href="/angst" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Angst →</Link>
            <Link href="/sovn" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Søvnproblemer →</Link>
            <Link href="/tinnitus" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Tinnitus →</Link>
            <Link href="/hypnoterapi" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Om hypnoterapi →</Link>
            <Link href="/kontakt" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Kontakt Jan →</Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
