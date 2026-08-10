import Head from "next/head"
import Link from "next/link"
import Header from "../components/Header"
import Footer from "../components/Footer"

export default function AdhdPage() {
  return (
    <>
      <Header />
      <Head>
        <title>ADHD og hypnoterapi Birkerød | Gaarsdal</title>
        <meta name="description" content="ADHD handler om et nervesystem der er svært at regulere. Hypnoterapi arbejder med koncentration, impulskontrol og indre uro. Jan Gaarsdal, Birkerød." />
        <link rel="canonical" href="https://gaarsdal.net/adhd" />
        <meta property="og:title" content="ADHD og hypnoterapi | Gaarsdal Birkerød" />
        <meta property="og:description" content="ADHD er et reguleringsproblem, ikke et viljensproblem. Hypnoterapi arbejder med det nervesystem der kæmper med at finde ro og fastholde fokus." />
        <meta property="og:image" content="https://gaarsdal.net/og-jan-gaarsdal.jpg" />
        <meta property="og:url" content="https://gaarsdal.net/adhd" />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              name: "ADHD og hypnoterapi",
              description: "Hypnoterapi til ADHD-relaterede udfordringer i Birkerød. Jan Gaarsdal arbejder med koncentration, impulskontrol og nervesystemsregulering.",
              url: "https://gaarsdal.net/adhd",
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
          dangerouslySetInnerHTML={{ __html: "{\"@context\": \"https://schema.org\", \"@type\": \"FAQPage\", \"mainEntity\": [{\"@type\": \"Question\", \"name\": \"Kan hypnose hjælpe ved ADHD?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Hypnoterapi kan hjælpe med at reducere den indre uro, forbedre evnen til at fastholde fokus og arbejde med impulsreaktioner. Det er ikke en behandling af ADHD som diagnose, men en metode til at arbejde med de mønstre der gør hverdagen svær.\"}}, {\"@type\": \"Question\", \"name\": \"Er hypnoterapi et alternativ til ADHD-medicin?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Nej, ikke nødvendigvis. Hypnoterapi er et supplement der kan arbejde med de mønstre og reaktioner medicin ikke adresserer. Mange bruger begge dele. Beslutningen om medicin træffes altid i samråd med din læge.\"}}, {\"@type\": \"Question\", \"name\": \"Kan voksne med ADHD have gavn af hypnoterapi?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Ja. Mange voksne med ADHD kæmper med uro, prokrastination, selvkritik og vanskeligheder med at afslutte opgaver. Hypnoterapi arbejder med de automatiske reaktioner bag disse mønstre - ikke med at øve teknikker.\"}}, {\"@type\": \"Question\", \"name\": \"Kan man hypnotisere nogen med ADHD?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Ja. ADHD-hjernen er faktisk ofte særligt modtagelig for hypnotisk fokustilstand, da den evner at hyperfokusere. Sessionerne tilpasses det rastløse nervesystem: de er aktive, kortere og strukturerede anderledes end for neurotypiske klienter.\"}}]}" }}
        />
      </Head>

      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "120px 20px 80px", fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif", lineHeight: 1.7, color: "#2C2A28" }}>

        {/* GENKENDELSE */}
        <section style={{ marginBottom: "60px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 600, lineHeight: 1.3, letterSpacing: "-0.01em", marginBottom: "20px" }}>
            Du ved hvad du skal gøre. Du kan bare ikke få dig til det
          </h1>
          <p style={{ fontSize: "19px", lineHeight: 1.65, color: "#4A463F", marginBottom: "18px", maxWidth: "700px" }}>
            Tankerne springer. Opgaverne hober sig op. Du begynder ti ting og afslutter ingen. Ikke fordi du er doven - du kan hyperfokusere i timevis på det der fanger dig. Men det du skal, det sidder fast. Og bagefter er selvkritikken hård.
          </p>
          <p style={{ fontSize: "17px", lineHeight: 1.7, color: "#4A463F", maxWidth: "700px" }}>
            ADHD er ikke et viljensproblem. Det er et nervesystem der regulerer sig anderledes - og det kan der arbejdes med.
          </p>
        </section>

        {/* MEKANISME */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "20px" }}>Hvad der faktisk sker</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
            {[
              {
                titel: "Dopaminsystemet fungerer anderledes",
                tekst: "ADHD-hjernen producerer og håndterer dopamin på en anden måde end neurotypiske hjerner. Det betyder at rutineopgaver, der ikke giver øjeblikkelig belønning, er genuint sværere at starte og fastholde - ikke fordi viljen mangler, men fordi hjernens motivationssystem er koblet anderledes.",
              },
              {
                titel: "Eksekutive funktioner er udfordrede",
                tekst: "Planlægning, prioritering, tidsfornemmelse og impulskontrol sidder i præfrontalkortex og er de funktioner der typisk er sværest ved ADHD. Det er ikke intelligens - mange med ADHD er meget intelligente - det er den automatiske regulering der er svær.",
              },
              {
                titel: "Den indre uro kører konstant",
                tekst: "Selv i hvile er nervesystemet aktivt. Det søger stimulation, skifter fokus, reagerer stærkt på omgivelser. Det udtrætter og gør det svært at lande - i en opgave, i en samtale, i sengen om aftenen.",
              },
            ].map((k) => (
              <div key={k.titel} style={{ padding: "24px", background: "#fff", border: "1px solid #E3DFD5", borderRadius: "8px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>{k.titel}</h3>
                <p style={{ fontSize: "14px", color: "#4A463F", lineHeight: 1.7 }}>{k.tekst}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FORSKNING */}
        <section style={{ marginBottom: "60px", padding: "32px", background: "#F5F3EE", borderRadius: "10px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "16px" }}>Hvad forskning viser om ADHD og hypnoterapi</h2>
          <p style={{ fontSize: "16px", marginBottom: "12px", lineHeight: 1.7 }}>
            ADHD rammer 3-5 pct. af børn og et stigende antal voksne - mange udiagnosticerede. Medicin (centralstimulerende midler) er veldokumenteret, men adresserer ikke de emotionelle og adfærdsmæssige mønstre der typisk følger med: perfektionisme, prokrastination, selvkritik og emotionel reaktivitet.
          </p>
          <p style={{ fontSize: "16px", marginBottom: "12px", lineHeight: 1.7 }}>
            Hyperfokus er en velkendt del af ADHD-profilen, og evnen til at gå helt op i noget er den samme evne hypnose bygger på. Det er en af grundene til at mange med ADHD har lettere ved hypnose end de selv forventer. Hypnoterapi bruges i stigende grad som supplement til medicinsk behandling, særligt for at arbejde med angst, søvn og selvopfattelse.
          </p>
          <p style={{ fontSize: "16px", color: "#6B675F", fontStyle: "italic", lineHeight: 1.7 }}>
            Kilde: ADHD-foreningen Danmark, <a href="https://www.psykiatri-regionh.dk" target="_blank" rel="noopener" style={{ color: "#5A7049", textDecoration: "underline" }}>Psykiatri Region Hovedstaden</a>.
          </p>
        </section>

        {/* HVAD HYPNOTERAPI GØR */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Hvad hypnoterapi kan gøre ved ADHD-mønstre</h2>
          <p style={{ fontSize: "16px", marginBottom: "16px", maxWidth: "700px", lineHeight: 1.7 }}>
            Hypnoterapi behandler ikke ADHD-diagnosen - det gør medicin bedre. Men det arbejder med de mønstre diagnosen medfører: den automatiske selvkritik der siger du burde kunne bedre, den indre uro der ikke slipper, prokrastinationen der ikke kan brydes med viljestyrke, og de emotionelle reaktioner der er stærkere end situationen kalder på.
          </p>
          <p style={{ fontSize: "16px", marginBottom: "16px", maxWidth: "700px", lineHeight: 1.7 }}>
            I den hypnotiske tilstand er hjernen fokuseret og modtagelig - paradoksalt nok er ADHD-hjernen ofte god til at gå ind i denne tilstand, da hyperfokus er en naturlig del af profilen. Her arbejdes der direkte med de automatiske reaktioner: angst for at starte, overbevisninger om manglende evner, og nervesystemets evne til kortvarig ro.
          </p>
          <p style={{ fontSize: "16px", color: "#6B675F", maxWidth: "700px", lineHeight: 1.7 }}>
            Forløbet tilpasses den ADHD-ramte hjernen: sessioner er aktive, varierede og respekterer at 90 minutter i ét stræk kan være for meget.
          </p>
        </section>

        {/* MØNSTRE */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>De mønstre der bringer folk til Jan</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "700px" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Prokrastination og opgaveparalyse</h3>
              <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7, margin: 0 }}>Du ved præcis hvad du skal gøre. Du kan ikke begynde. Jo vigtigere opgaven er, jo sværere er det at starte. Det er ikke lathed - det er et aktiveringsmønster der kan ændres uden at øve teknikker.</p>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Emotionel reaktivitet</h3>
              <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7, margin: 0 }}>Frustrationer, kritik og modgang rammer hårdere end hos andre. Reaktionen er hurtig og intens, og bagefter ved du godt at den var overdreven. Hypnoterapi arbejder med den automatiske reaktion - at skabe et sekunds rum inden systemet aktiveres.</p>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Søvn og nedlukning</h3>
              <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7, margin: 0 }}>At lande i sengen og slukke for tankerne er svært, når nervesystemet er konstant aktivt. Mange med ADHD har sekundære søvnproblemer. Hypnoterapi og søvn er naturlige partnere, da den hypnotiske tilstand og søvnindledning aktiverer de samme mekanismer.</p>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Selvbillede og årtiers selvkritik</h3>
              <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7, margin: 0 }}>Mange voksne med ADHD bærer en lang history af at have skuffet sig selv og andre. Den forventning sidder som en automatisk overbevisning: at man ikke kan, at man er anderledes, at det aldrig lykkes. Det er det mønster der ofte giver størst effekt at arbejde med.</p>
            </div>
          </div>
        </section>

        {/* FORLØB */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Sådan foregår et forløb</h2>
          <p style={{ fontSize: "16px", marginBottom: "16px", maxWidth: "700px", lineHeight: 1.7 }}>
            <strong>Gratis forsamtale (30 min).</strong> Vi taler om hvad der er svært, hvornår det er svært, og hvad du allerede har prøvet. Her afklares om hypnoterapi giver mening som næste skridt - og om du har en diagnose eller blot genkender mønstrene.
          </p>
          <p style={{ fontSize: "16px", marginBottom: "16px", maxWidth: "700px", lineHeight: 1.7 }}>
            <strong>Første session (90 min).</strong> En grundig samtale om dit mønster efterfulgt af den første hypnose. For ADHD-profiler tilpasses sessionsformatet løbende - tempo, struktur og tilgang justeres til hvad der virker for dig.
          </p>
          <p style={{ fontSize: "16px", marginBottom: "16px", maxWidth: "700px", lineHeight: 1.7 }}>
            <strong>Opfølgende sessioner (ca. 60 min).</strong> Arbejdet målrettes det specifikke mønster der er sværest for dig. Prokrastination, søvn, selvbillede og emotionel regulering adresseres som regel i rækkefølge - eller i den kombination der giver mest mening.
          </p>
          <p style={{ fontSize: "16px", color: "#6B675F", maxWidth: "700px", lineHeight: 1.7 }}>
            Sessioner foregår fysisk i Birkerød eller online efter aftale. Se <Link href="/priser" style={{ color: "#5A7049" }}>priser</Link>.
          </p>
        </section>

        {/* VIGTIGT AT VIDE */}
        <section style={{ marginBottom: "60px", padding: "28px 32px", background: "#F7F1E8", borderRadius: "10px", border: "1px solid #E6D9C2" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>Vigtigt at vide</h2>
          <p style={{ fontSize: "16px", color: "#4A463F", maxWidth: "700px", margin: 0, lineHeight: 1.7 }}>
            Hypnoterapi er ikke en behandling af ADHD-diagnosen og erstatter ikke psykiatrisk vurdering, medicinsk behandling eller neuropsykologisk udredning. Jan arbejder med de mønstre og reaktioner ADHD medfører i hverdagen - ikke med diagnosen selv. Har du mistanke om udiagnosticeret ADHD, er det en god idé at starte med en lægelig vurdering.
          </p>
        </section>

        {/* OM JAN */}
        <section style={{ marginBottom: "48px", padding: "32px", background: "#F5F3EE", borderRadius: "10px", borderLeft: "3px solid #5A7049" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>Jan Gaarsdal, hypnoterapeut i Birkerød</h2>
          <p style={{ fontSize: "16px", color: "#4A463F", marginBottom: "16px", lineHeight: 1.7 }}>
            Jan arbejder med ADHD-relaterede mønstre hos voksne og unge. Han tilpasser sin tilgang til den ADHD-ramte hjernen - sessioner er aktive, varierede og tilrettelagt med respekt for at koncentration er en begrænset ressource.
          </p>
          <div style={{ padding: "12px 16px", background: "#E8EBE2", borderRadius: "6px", display: "inline-block" }}>
            <p style={{ fontSize: "14px", fontWeight: 500, color: "#2C2A28", margin: "0 0 8px", lineHeight: 1.7 }}>
              🎯 Gratis forsamtale, 30 minutter, telefon eller fysisk
            </p>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <Link href="/kontakt" style={{ fontSize: "14px", color: "#fff", background: "#627A52", textDecoration: "none", fontWeight: 500, padding: "8px 16px", borderRadius: "4px" }}>
                Book forsamtale →
              </Link>
              <a href="tel:+4542807474" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", fontWeight: 500, padding: "8px 0" }}>
                Ring +45 42 80 74 74
              </a>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "24px" }}>Ofte stillede spørgsmål om ADHD og hypnose</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {[
              {
                q: "Kan hypnose hjælpe ved ADHD?",
                a: "Hypnoterapi kan hjælpe med at reducere den indre uro, forbedre evnen til at fastholde fokus og arbejde med impulsreaktioner. Det er ikke en behandling af ADHD som diagnose, men en metode til at arbejde med de mønstre der gør hverdagen svær.",
              },
              {
                q: "Er hypnoterapi et alternativ til ADHD-medicin?",
                a: "Nej, ikke nødvendigvis. Hypnoterapi er et supplement der kan arbejde med de mønstre og reaktioner medicin ikke adresserer: selvkritik, prokrastination, søvn og emotionel regulering. Mange bruger begge dele. Beslutningen om medicin træffes altid i samråd med din læge.",
              },
              {
                q: "Kan voksne med ADHD have gavn af hypnoterapi?",
                a: "Ja. Mange voksne med ADHD kæmper med uro, prokrastination, selvkritik og vanskeligheder med at afslutte opgaver. Hypnoterapi arbejder med de automatiske reaktioner bag disse mønstre - ikke med at øve teknikker man alligevel glemmer at bruge.",
              },
              {
                q: "Kan man hypnotisere nogen med ADHD?",
                a: "Ja. ADHD-hjernen er faktisk ofte særligt modtagelig for hypnotisk fokustilstand, da den evner at hyperfokusere. Sessionerne tilpasses det rastløse nervesystem: de er aktive, kortere og strukturerede anderledes end for neurotypiske klienter.",
              },
              {
                q: "Kan hypnoterapi hjælpe et barn med ADHD?",
                a: "Jan arbejder med unge fra ca. 12 år med ADHD-relaterede mønstre. For yngre børn er forældreinddragelse central, og tilgangen tilpasses alder og modenhed. Den gratis forsamtale afklarer om det er relevant.",
              },
            ].map((item) => (
              <div key={item.q} style={{ borderBottom: "1px solid #E3DFD5", paddingBottom: "16px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#2C2A28" }}>{item.q}</h3>
                <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7 }}>{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* RELATEREDE EMNER */}
        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 500, color: "#6B675F", marginBottom: "12px" }}>Relaterede emner</h2>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href="/praestationsangst" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", padding: "6px 14px", border: "1px solid #5A7049", borderRadius: "20px" }}>Præstationsangst →</Link>
            <Link href="/sovn" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", padding: "6px 14px", border: "1px solid #5A7049", borderRadius: "20px" }}>Søvnproblemer →</Link>
            <Link href="/selvvaerd" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", padding: "6px 14px", border: "1px solid #5A7049", borderRadius: "20px" }}>Selvværd →</Link>
            <Link href="/tanker" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", padding: "6px 14px", border: "1px solid #5A7049", borderRadius: "20px" }}>Tanker der kører →</Link>
            <Link href="/vaner" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", padding: "6px 14px", border: "1px solid #5A7049", borderRadius: "20px" }}>Vaner →</Link>
            <Link href="/kontakt" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", padding: "6px 14px", border: "1px solid #5A7049", borderRadius: "20px" }}>Kontakt Jan →</Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
