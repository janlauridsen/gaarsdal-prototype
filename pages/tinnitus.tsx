import Head from "next/head"
import Link from "next/link"
import Header from "../components/Header"
import Footer from "../components/Footer"

export default function TinnitusPage() {
  return (
    <>
      <Header />
      <Head>
        <title>Tinnitus og hypnoterapi Birkerød | Gaarsdal</title>
        <meta name="description" content="Tinnitus, øresusen, forværres af stress og fokus. Hypnoterapi arbejder med hjernens reaktion på lyden og reducerer generne markant. Jan Gaarsdal, Birkerød." />
        <link rel="canonical" href="https://gaarsdal.net/tinnitus" />
        <meta property="og:title" content="Tinnitus og hypnoterapi | Gaarsdal Birkerød" />
        <meta property="og:description" content="Tinnitus forværres af stress og opmærksomhed. Hypnoterapi ændrer hjernens reaktion på lyden - ikke lyden selv." />
        <meta property="og:image" content="https://gaarsdal.net/Jan-AI.png" />
        <meta property="og:url" content="https://gaarsdal.net/tinnitus" />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              name: "Tinnitus og hypnoterapi",
              description: "Hypnoterapi til tinnitus i Birkerød. Jan Gaarsdal arbejder med hjernens reaktion på øresusen og det stressniveau der forstærker den.",
              url: "https://gaarsdal.net/tinnitus",
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
          dangerouslySetInnerHTML={{ __html: "{\"@context\": \"https://schema.org\", \"@type\": \"FAQPage\", \"mainEntity\": [{\"@type\": \"Question\", \"name\": \"Kan hypnose hjælpe mod tinnitus?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Ja. Hypnoterapi arbejder med hjernens reaktion på tinnituslyden og det stressniveau der forstærker den. Målet er sjældent at fjerne lyden helt, men at ændre den automatiske reaktion, så lyden fylder mindre i bevidstheden.\"}}, {\"@type\": \"Question\", \"name\": \"Kan hypnose fjerne min tinnitus helt?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Sjældent helt, men mange oplever at lyden fylder markant mindre når hjernens reaktion på den ændres. Når lyden ikke længere udløser uro, falder den i baggrunden som anden konstant baggrundsstøj.\"}}, {\"@type\": \"Question\", \"name\": \"Hvor mange sessioner kræver tinnitus?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Jan anbefaler typisk at starte med et kort forløb og derefter vurdere effekten. Mange oplever bedring efter de første sessioner. Det er vigtigt at have fået tinnitus undersøgt af en læge først.\"}}, {\"@type\": \"Question\", \"name\": \"Hvorfor forværres min tinnitus når jeg er stresset?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Når nervesystemet er i beredskab, skærpes sansernes opmærksomhed, også på tinnituslyden. Stress og tinnitus hænger tæt sammen, og stressreduktion er en central del af hypnoterapien.\"}}]}" }}
        />
      </Head>

      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "120px 20px 80px", fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif", lineHeight: 1.7, color: "#333" }}>

        {/* GENKENDELSE */}
        <section style={{ marginBottom: "60px" }}>
          <h1 style={{ fontSize: "34px", fontWeight: 600, lineHeight: 1.25, marginBottom: "20px" }}>
            Lyden er der altid. Og jo mere du lytter efter den, jo mere fylder den
          </h1>
          <p style={{ fontSize: "18px", color: "#555", marginBottom: "16px", maxWidth: "660px" }}>
            Ringen, susen eller piben der ikke stopper. Værst når der er stille. Værst når du er stresset. Lægen siger der ikke er en kur. Du har lært at leve med den, men den tærer på din søvn, din ro og dit overskud - og nogle dage kan du ikke tænke på andet.
          </p>
          <p style={{ fontSize: "16px", color: "#666", maxWidth: "660px" }}>
            Tinnitus er reel. Men hvor meget den fylder afhænger i høj grad af hjernens reaktion på lyden - og det kan ændres.
          </p>
        </section>

        {/* MEKANISME */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "20px" }}>Hvad der faktisk sker</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
            {[
              {
                titel: "Hjernen forstærker det den fokuserer på",
                tekst: "Tinnitus opfattes ikke kun i øret, men i hjernens bearbejdning af lyden. Jo mere opmærksomhed lyden får, jo mere fremtrædende bliver den. Det er ikke indbildning - det er hvordan hjernens filtrering fungerer, og den mekanisme kan påvirkes.",
              },
              {
                titel: "Stress og tinnitus forstærker hinanden",
                tekst: "Når nervesystemet er i beredskab, skærpes alle sanser - også hørelsen. Mange oplever at tinnitus opstod eller forværredes i en stresset periode. Forbindelsen går begge veje: tinnitusen skaber stress, og stress skærper tinnitusen.",
              },
              {
                titel: "Reaktionen kan ændres, selvom lyden ikke forsvinder",
                tekst: "Målet er sjældent at fjerne lyden helt, men at ændre hjernens automatiske reaktion på den. Når lyden ikke længere udløser uro og frustration, falder den i baggrunden - ligesom køleskabets summen eller trafikstøj udenfor.",
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
          <h2 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "16px" }}>Hvad forskning viser om tinnitus</h2>
          <p style={{ fontSize: "15px", marginBottom: "12px" }}>
            Cirka 15–20 pct. af voksne oplever tinnitus i en grad der påvirker hverdagen. For ca. 2–3 pct. er generne så udtalte at de påvirker søvn, koncentration og livskvalitet alvorligt. Der findes ingen medicinsk kur, og behandlingen fokuserer derfor på at ændre reaktionen på lyden snarere end lyden selv.
          </p>
          <p style={{ fontSize: "15px", marginBottom: "12px" }}>
            Kognitiv adfærdsterapi (KAT) og hypnoterapi dokumenteres begge som effektive til at reducere tinnitusbelastning. Professor Bobby Zachariae, Aarhus Universitet, har forsket i hypnosens effekt på nervesystemet og fremhæver metoden som veldokumenteret til stressreduktion - en central komponent i tinnitusbehandling.
          </p>
          <p style={{ fontSize: "15px", color: "#666", fontStyle: "italic" }}>
            Kilde: <a href="https://hoereforeningen.dk" target="_blank" rel="noopener" style={{ color: "#5a7a8f", textDecoration: "underline" }}>Høreforeningen.dk</a>, British Tinnitus Association, Netdoktor.dk.
          </p>
        </section>

        {/* HVAD HYPNOTERAPI GØR */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Hvad hypnoterapi gør ved tinnitus</h2>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>
            Hypnoterapi arbejder på to niveauer. Det ene er nervesystemet: at bringe stressniveauet ned, så lyden ikke konstant forstærkes af beredskab. Det andet er hjernens opmærksomhedsfilter: at træne hjernen til at deprioritere tinnituslyden på samme måde som den filtrerer anden konstant baggrundsstøj fra.
          </p>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>
            I den hypnotiske tilstand er hjernen særligt modtagelig for at lære nye automatiske reaktioner. Du lærer ikke en teknik du skal huske at bruge - du omprogrammerer den reaktion der sker, inden du når at tænke over det.
          </p>
          <p style={{ fontSize: "15px", color: "#666", maxWidth: "700px" }}>
            Hypnoterapi er ikke det rette for alle tinnitustilfælde. Hvis tinnitusen er opstået pludseligt, er kraftigt ensidig, eller er ledsaget af svimmelhed, bør du tale med din læge, inden du starter. Den gratis forsamtale afklarer om hypnoterapi giver mening for dig.
          </p>
        </section>

        {/* MØNSTRE */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>De typiske tinnitusoplevelser</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "700px" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Lyden er konstant, men varierer i styrke</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7, margin: 0 }}>Mange beskriver at lyden stiger og falder i takt med stress, søvnmangel og koncentrationskrav. Stille miljøer og sengelejet er ofte de sværeste. Her kan hypnoterapi hjælpe med at bryde koblingen mellem stilhed og forværring.</p>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Tinnitus opstod efter støj, medicin eller stress</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7, margin: 0 }}>Uanset årsagen til tinnitusen er det hjernens nuværende reaktion der bestemmer, hvor meget den fylder. Oprindelsen ændrer ikke hvilken tilgang der virker - det er reaktionsmønsteret der skal arbejdes med.</p>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Søvnen er påvirket</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7, margin: 0 }}>Tinnitus og søvnproblemer følges ofte ad. Stilheden om natten giver lyden frit spil, og træthed forværrer igen tinnitusen. Hypnoterapi arbejder med begge - og mange oplever at søvnen bedres som den første synlige effekt.</p>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Du er holdt op med ting du holdt af</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7, margin: 0 }}>Koncerter, biografer, støjende selskaber - steder du undgår fordi lyden bagefter er uudholdelig. Tilpasninger der over tid indsnævrer livet. Det er ikke nødvendigvis en permanent præmis.</p>
            </div>
          </div>
        </section>

        {/* FORLØB */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Sådan foregår et forløb</h2>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>
            <strong>Gratis forsamtale (30 min).</strong> Vi taler om hvornår tinnitusen startede, hvad der forværrer den, og hvad du har prøvet. Her afklares om hypnoterapi er den rette tilgang for dig. Telefon eller fysisk, og helt uforpligtende.
          </p>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>
            <strong>Første session (90 min).</strong> En grundig samtale om dit tinnitusforløb og dine reaktionsmønstre, efterfulgt af den første hypnose. De fleste oplever at den hypnotiske tilstand i sig selv giver en ro de sjældent mærker til daglig.
          </p>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>
            <strong>Opfølgende sessioner (ca. 60 min).</strong> Arbejdet målrettes præcis det mønster der fastholder din tinnitus. For mange viser sig bedring i søvn og stressniveau inden der sker ændring i selve lydoplevelsen - det er et godt tegn, ikke en skuffelse.
          </p>
          <p style={{ fontSize: "15px", color: "#666", maxWidth: "700px" }}>
            Sessioner foregår fysisk i Birkerød eller online efter aftale. Se <Link href="/priser" style={{ color: "#5a7a8f" }}>priser</Link>.
          </p>
        </section>

        {/* VIGTIGT AT VIDE */}
        <section style={{ marginBottom: "60px", padding: "28px 32px", background: "#fdf6f0", borderRadius: "10px", border: "1px solid #ecd9c6" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>Vigtigt at vide</h2>
          <p style={{ fontSize: "15px", color: "#555", maxWidth: "700px", margin: 0 }}>
            Ved pludseligt opstået tinnitus, ensidigt høretab, svimmelhed eller kraftig forværring bør du tale med din læge, inden du starter et hypnoterapiforløb. Disse symptomer kan have fysiske årsager der bør udelukkes. Hypnoterapi er et supplement, ikke en erstatning for lægelig udredning.
          </p>
        </section>

        {/* OM JAN */}
        <section style={{ marginBottom: "48px", padding: "32px", background: "#f9fafb", borderRadius: "10px", borderLeft: "3px solid #5a7a8f" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>Jan Gaarsdal, hypnoterapeut i Birkerød</h2>
          <p style={{ fontSize: "15px", color: "#555", marginBottom: "16px", lineHeight: 1.7 }}>
            Jan arbejder med tinnitus som en del af det samlede nervesystemsbillede - stress, søvn og reaktionsmønstre hænger som regel tæt sammen. Han har erfaring med klienter der har haft tinnitus i mange år og med dem der er i den akutte fase.
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
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "24px" }}>Ofte stillede spørgsmål om tinnitus og hypnose</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {[
              {
                q: "Kan hypnose hjælpe mod tinnitus?",
                a: "Ja. Hypnoterapi arbejder med hjernens reaktion på tinnituslyden og det stressniveau der forstærker den. Målet er sjældent at fjerne lyden helt, men at ændre den automatiske reaktion, så lyden fylder mindre i bevidstheden og i hverdagen.",
              },
              {
                q: "Kan hypnose fjerne min tinnitus helt?",
                a: "Sjældent helt, men mange oplever at lyden fylder markant mindre når hjernens reaktion på den ændres. Når lyden ikke længere udløser uro, falder den i baggrunden - ligesom anden konstant baggrundsstøj man lærer at ignorere.",
              },
              {
                q: "Hvor mange sessioner kræver tinnitus?",
                a: "Jan anbefaler typisk at starte med et kort forløb på 3–4 sessioner og derefter vurdere effekten. Mange oplever bedring i søvn og stressniveau inden selve lydoplevelsen ændrer sig. Det er vigtigt at have fået tinnitusen undersøgt af en læge først.",
              },
              {
                q: "Hvorfor forværres tinnitusen når jeg er stresset?",
                a: "Når nervesystemet er i beredskab, skærpes alle sanser - også hørelsen. Hjernen prioriterer tinnituslyd højere, fordi den fortolker den som en potentiel advarsel. Stressreduktion er derfor en central del af hypnoterapien ved tinnitus.",
              },
              {
                q: "Er hypnoterapi det samme som lydterapi eller TRT?",
                a: "Nej, men de supplerer hinanden. Lydterapi og TRT (Tinnitus Retraining Therapy) arbejder med at vænne hjernen til lyden via ekstern støj. Hypnoterapi arbejder med det indre reaktionsmønster: stressniveauet, opmærksomhedsfilteret og den automatiske emotionelle reaktion på lyden.",
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
            <Link href="/sovn" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Søvnproblemer →</Link>
            <Link href="/angst" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Angst →</Link>
            <Link href="/ibs-spaendinger" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>IBS og spændinger →</Link>
            <Link href="/hypnoterapi" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Om hypnoterapi →</Link>
            <Link href="/kontakt" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Kontakt Jan →</Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
