import Head from "next/head"
import Link from "next/link"
import Header from "../components/Header"
import Footer from "../components/Footer"

export default function PtsdPage() {
  return (
    <>
      <Header />
      <Head>
        <title>PTSD og traumer, hypnoterapi Birkerød | Gaarsdal</title>
        <meta name="description" content="Traumer og PTSD sætter sig i kroppens alarmsystem. Hypnoterapi arbejder med traumet der hvor det er lagret - skånsomt og i dit tempo. Jan Gaarsdal, Birkerød." />
        <link rel="canonical" href="https://gaarsdal.net/ptsd" />
        <meta property="og:title" content="PTSD og traumer - hypnoterapi | Gaarsdal Birkerød" />
        <meta property="og:description" content="Du ved det er overstået. Men kroppen reagerer som om det sker igen. Hypnoterapi arbejder med traumet der hvor det sidder - i de automatiske reaktioner." />
        <meta property="og:image" content="https://gaarsdal.net/Jan-AI.png" />
        <meta property="og:url" content="https://gaarsdal.net/ptsd" />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "MedicalWebPage", name: "PTSD og traumer - hypnoterapi", description: "Hypnoterapi til traumer og PTSD i Birkerød. Jan Gaarsdal arbejder med kroppens alarmsystem skånsomt og i klientens tempo.", url: "https://gaarsdal.net/ptsd", provider: { "@type": "Person", name: "Jan Gaarsdal", url: "https://gaarsdal.net/om", telephone: "+4542807474" } }) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: "{\"@context\":\"https://schema.org\",\"@type\":\"FAQPage\",\"mainEntity\":[{\"@type\":\"Question\",\"name\":\"Kan hypnose hjælpe mod PTSD?\",\"acceptedAnswer\":{\"@type\":\"Answer\",\"text\":\"Ja. Hypnoterapi har en lang dokumentationshistorie i traumebehandling. Den arbejder med traumet der hvor det er lagret - i kroppens alarmsystem og de automatiske reaktioner. Ved svær PTSD bruges det bedst som supplement til psykologisk eller psykiatrisk behandling.\"}},{\"@type\":\"Question\",\"name\":\"Skal jeg genopleve traumet under hypnose?\",\"acceptedAnswer\":{\"@type\":\"Answer\",\"text\":\"Nej, ikke nødvendigvis. Moderne traumearbejde med hypnose handler ikke om at tvinge dig gennem hændelsen igen. Arbejdet sker skånsomt og i dit tempo - nervesystemet hjælpes til at slippe alarmberedskabet uden at du behøver at gennemleve traumet fuldt ud.\"}},{\"@type\":\"Question\",\"name\":\"Hvad er forskellen på enkelttraume og kompleks PTSD?\",\"acceptedAnswer\":{\"@type\":\"Answer\",\"text\":\"Et enkelttraume er en afgrænsbar hændelse - en ulykke, et overgreb, en kritisk oplevelse. Kompleks PTSD opstår typisk ved gentagne traumer over tid, ofte i tidlig alder. Begge kan arbejdes med hypnoterapi, men kompleks PTSD kræver et længere og mere gradvist forløb.\"}},{\"@type\":\"Question\",\"name\":\"Er hypnose nok, eller skal jeg også have anden behandling?\",\"acceptedAnswer\":{\"@type\":\"Answer\",\"text\":\"Ved svær PTSD, aktuelle selvmordstanker eller akut krise skal du altid have lægelig eller psykiatrisk hjælp. Hypnoterapi kan være en værdifuld del af et samlet forløb, men erstatter ikke behandling i sundhedssystemet ved svære tilstande.\"}}]}" }} />
      </Head>

      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "120px 20px 80px", fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif", lineHeight: 1.7, color: "#2C2A28" }}>

        <section style={{ marginBottom: "60px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 600, lineHeight: 1.3, letterSpacing: "-0.01em", marginBottom: "20px" }}>Det er overstået. Men kroppen reagerer som om det sker igen</h1>
          <p style={{ fontSize: "19px", lineHeight: 1.65, color: "#4A463F", marginBottom: "18px", maxWidth: "700px" }}>En lyd, en lugt, en situation - og pludselig er du tilbage i det. Hjertet hamrer, kroppen er i alarm. Måske uden at du engang bevidst tænker på hændelsen. Du ved at faren er ovre. Men din krop har ikke fået besked.</p>
          <p style={{ fontSize: "17px", lineHeight: 1.7, color: "#4A463F", maxWidth: "700px" }}>Traumer og PTSD er ikke et spørgsmål om at komme videre ved viljestyrke. Det er lagret i kroppens alarmsystem og de automatiske reaktioner - ikke i den bevidste hukommelse alene.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "20px" }}>Hvad der faktisk sker</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
            {[
              { titel: "Traumet er lagret i kroppen", tekst: "Ved traume gemmes hændelsen ikke som et almindeligt minde, men som en kropslig alarmtilstand. Amygdala, hjernens alarmsystem, reagerer på triggere før den bevidste tanke når med. Kroppen går i fuld alarm på brøkdele af et sekund - og den reaktion korer udenfor bevidst kontrol." },
              { titel: "Undgåelse fastholder traumet", tekst: "PTSD kendetegnes ved flashbacks, mareridt, hypervågenhed og undgåelse af det der minder om hændelsen. Undgåelsen giver kortvarig lettelse men fastholder traumet, fordi nervesystemet aldrig får mulighed for at lære at faren er ovre." },
              { titel: "Det kan ikke tænkes væk", tekst: "At forstå hvad der skete - og endda at have talt om det mange gange - ændrer ikke nødvendigvis den kropslige reaktion. Traumet sidder under den bevidste tænkning. Det er derfor indsigt alene sjældent er nok til at slippe det." },
            ].map((k) => (
              <div key={k.titel} style={{ padding: "24px", background: "#fff", border: "1px solid #E3DFD5", borderRadius: "8px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>{k.titel}</h3>
                <p style={{ fontSize: "14px", color: "#4A463F", lineHeight: 1.7 }}>{k.tekst}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: "60px", padding: "32px", background: "#F5F3EE", borderRadius: "10px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "16px" }}>Hvad forskning viser om hypnose og traumer</h2>
          <p style={{ fontSize: "16px", marginBottom: "12px", lineHeight: 1.7 }}>Hypnose har en lang klinisk historie i traumebehandling. American Psychological Association (APA) anerkender hypnose som et redskab der kan indgå i behandling af traumer og PTSD. Hypnoterapi fremhæves i APA's Division 30 som evidensbaseret supplement til kognitiv behandling af traume.</p>
          <p style={{ fontSize: "16px", marginBottom: "12px", lineHeight: 1.7 }}>PTSD er anerkendt som selvstændig diagnose i WHO's ICD-11 (2019) og DSM-5. Forskning viser at effektive traumebehandlinger har til fælles at de adresserer kroppens alarmsystem - ikke kun den bevidste forståelse af hændelsen. Hypnoterapi gør netop dette.</p>
          <p style={{ fontSize: "16px", color: "#6B675F", fontStyle: "italic", lineHeight: 1.7 }}>Kilde: WHO ICD-11, <a href="https://www.apa.org" target="_blank" rel="noopener" style={{ color: "#5A7049", textDecoration: "underline" }}>American Psychological Association</a>, Hammond (2010) American Journal of Clinical Hypnosis.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Hvad hypnoterapi gør ved traumer</h2>
          <p style={{ fontSize: "16px", marginBottom: "16px", maxWidth: "700px", lineHeight: 1.7 }}>Hypnoterapi arbejder med traumet der hvor det er lagret - i kroppens alarmsystem og de automatiske reaktioner. I den hypnotiske tilstand er hjernen i en fokuseret, modtagelig tilstand der tillader arbejde med det som ellers er låst fast under bevidst kontrol.</p>
          <p style={{ fontSize: "16px", marginBottom: "16px", maxWidth: "700px", lineHeight: 1.7 }}>Arbejdet sker skånsomt og i dit tempo. Moderne traumearbejde med hypnose handler ikke om at tvinge dig gennem hændelsen igen - men om at hjælpe nervesystemet med gradvist at slippe sit alarmberedskab og lære at faren er ovre.</p>
          <p style={{ fontSize: "16px", color: "#6B675F", maxWidth: "700px", lineHeight: 1.7 }}>Jan har erfaring med traumer efter ulykker, overgreb, tab og andre belastende oplevelser. Arbejdet tilpasses altid den enkeltes situation, tempo og behov.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>De typiske traumemønstre</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "700px" }}>
            {[
              { titel: "Flashbacks og påtrængende minder", tekst: "Hændelsen dukker op uventet - billeder, lyde, fornemmelser der pludselig er der igen. Det sker typisk uden at du søger dem frem. Det er ikke et tegn på svaghed, men på et alarmsystem der ikke har fundet ro." },
              { titel: "Hypervågenhed og overreaktion", tekst: "Du er konstant på vagt. Lyde, bevægelser og situationer der minder om hændelsen udløser stærke fysiske reaktioner. Det er udmattende og svært at forklare for omgivelserne. Nervesystemet er stadig på det beredskab det lærte da faren var reel." },
              { titel: "Undgåelse og indskrænkning", tekst: "Du undgår steder, situationer, mennesker eller sammenkomster der kan trigge minder. Over tid bliver livsrummet mindre. Undgåelse er forståelig - men den fortæller nervesystemet at der stadig er noget at frygte." },
              { titel: "Søvn, mareridt og uro", tekst: "Mareridt om traumet eller om farer. Søvn der ikke restituerer. En baggrundsstøj af uro der sjældent slipper helt. Søvnforstyrrelser er et af de mest udbredte PTSD-symptomer og forstærker alle de øvrige." },
              { titel: "Kompleks PTSD fra tidlige erfaringer", tekst: "Gentagne traumer i barn- eller ungdom - omsorgssvigt, misbrug, ustabile rammer - sidder anderledes end et enkelt voksent traume. Kompleks PTSD viser sig typisk som dybe selvbilledproblemer, relationsvanskeligheder og svær følelsesregulering. Det kan arbejdes med, men kræver et gradvist og tålmodigt forløb." },
            ].map((k) => (
              <div key={k.titel}>
                <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>{k.titel}</h3>
                <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7, margin: 0 }}>{k.tekst}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Sådan foregår et forløb</h2>
          <p style={{ fontSize: "16px", marginBottom: "16px", maxWidth: "700px", lineHeight: 1.7 }}><strong>Gratis forsamtale (30 min).</strong> Vi taler om hvad du oplever, hvornår det startede, og hvad du har prøvet. Ingen krav om at gå i detaljer med hændelsen i denne fase. Her afklares om hypnoterapi er den rette tilgang og hvad der er realistisk at forvente.</p>
          <p style={{ fontSize: "16px", marginBottom: "16px", maxWidth: "700px", lineHeight: 1.7 }}><strong>Første session (90 min).</strong> En grundig samtale om dine reaktioner og dit nervesystems mønster - fulgt af den første hypnose. Tempoet sættes altid af dig. Mange beskriver allerede her en kropslig ro de sjældent mærker.</p>
          <p style={{ fontSize: "16px", marginBottom: "16px", maxWidth: "700px", lineHeight: 1.7 }}><strong>Opfølgende sessioner (ca. 60 min).</strong> Arbejdet dykker gradvist dybere. For afgrænsede enkelttraumer kan der komme mærkbare resultater relativt hurtigt. Kompleks PTSD fra tidlige erfaringer kræver et længere, mere gradvist forløb.</p>
          <p style={{ fontSize: "16px", color: "#6B675F", maxWidth: "700px", lineHeight: 1.7 }}>Sessioner foregår fysisk i Birkerød eller online efter aftale. Se <Link href="/priser" style={{ color: "#5A7049" }}>priser</Link>.</p>
        </section>

        <section style={{ marginBottom: "60px", padding: "28px 32px", background: "#F7F1E8", borderRadius: "10px", border: "1px solid #E6D9C2" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>Vigtigt at vide om svær PTSD</h2>
          <p style={{ fontSize: "16px", color: "#4A463F", maxWidth: "700px", margin: 0, lineHeight: 1.7 }}>Ved svær PTSD, aktuelle selvmordstanker, aktiv selvskade eller akut krise skal du altid kontakte din læge, psykiatrisk skadestue eller en relevant behandler. Hypnoterapi kan være en værdifuld del af et samlet forløb, men erstatter ikke psykiatrisk eller psykologisk behandling ved svære tilstande. Jan samarbejder gerne med behandlere i sundhedssystemet.</p>
        </section>

        <section style={{ marginBottom: "48px", padding: "32px", background: "#F5F3EE", borderRadius: "10px", borderLeft: "3px solid #5A7049" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>Jan Gaarsdal, hypnoterapeut i Birkerød</h2>
          <p style={{ fontSize: "16px", color: "#4A463F", marginBottom: "16px", lineHeight: 1.7 }}>Jan arbejder med traumer og PTSD hos voksne. Han møder klienten der hvor de er og tilpasser tempo og tilgang til den enkeltes situation. Ingen krav om at fortælle alt fra første dag.</p>
          <div style={{ padding: "12px 16px", background: "#E8EBE2", borderRadius: "6px", display: "inline-block" }}>
            <p style={{ fontSize: "14px", fontWeight: 500, color: "#2C2A28", margin: "0 0 8px", lineHeight: 1.7 }}>🎯 Gratis forsamtale, 30 minutter, telefon eller fysisk</p>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <Link href="/kontakt" style={{ fontSize: "14px", color: "#fff", background: "#627A52", textDecoration: "none", fontWeight: 500, padding: "8px 16px", borderRadius: "4px" }}>Book forsamtale →</Link>
              <a href="tel:+4542807474" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", fontWeight: 500, padding: "8px 0" }}>Ring +45 42 80 74 74</a>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "24px" }}>Ofte stillede spørgsmål om PTSD og hypnose</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {[
              { q: "Kan hypnose hjælpe mod PTSD?", a: "Ja. Hypnoterapi er anerkendt af American Psychological Association som et redskab i traumebehandling. Den arbejder med traumet der hvor det er lagret - i kroppens alarmsystem og de automatiske reaktioner der kører uden om den bevidste tanke." },
              { q: "Skal jeg genopleve traumet under hypnose?", a: "Nej, ikke nødvendigvis. Moderne traumearbejde med hypnose handler ikke om at tvinge dig igennem hændelsen igen. Arbejdet sker skånsomt og i dit tempo - nervesystemet hjælpes til at slippe alarmberedskabet gradvist." },
              { q: "Hvad er forskellen på enkelttraume og kompleks PTSD?", a: "Et enkelttraume er en afgrænsbar hændelse - en ulykke, et overfald, et pludseligt tab. Kompleks PTSD opstår typisk ved gentagne traumer over tid, ofte i tidlig alder. Begge kan arbejdes med hypnoterapi, men kompleks PTSD kræver et længere og mere gradvist forløb." },
              { q: "Kan jeg have gavn af hypnoterapi selv om jeg allerede er i psykologforløb?", a: "Ja. Hypnoterapi bruges ofte som supplement til samtaleterapi. De to tilgange adresserer traumet fra hver sin vinkel: samtaleterapi arbejder primært med den bevidste forståelse, hypnoterapi med kroppens automatiske reaktioner. Mange klienter oplever at de to supplerer hinanden godt." },
              { q: "Er hypnose nok, eller skal jeg have anden behandling?", a: "Det afhænger af sværhedsgraden. For afgrænsede traumer kan hypnoterapi alene give markante resultater. Ved svær PTSD, aktuelle kriser eller selvmordstanker skal du altid have lægelig eller psykiatrisk hjælp. Jan kan indgå i et samlet forløb og samarbejder gerne med andre behandlere." },
            ].map((item) => (
              <div key={item.q} style={{ borderBottom: "1px solid #E3DFD5", paddingBottom: "16px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#2C2A28" }}>{item.q}</h3>
                <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7 }}>{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 500, color: "#6B675F", marginBottom: "12px" }}>Relaterede emner</h2>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href="/angst" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", padding: "6px 14px", border: "1px solid #5A7049", borderRadius: "20px" }}>Angst →</Link>
            <Link href="/sovn" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", padding: "6px 14px", border: "1px solid #5A7049", borderRadius: "20px" }}>Søvnproblemer →</Link>
            <Link href="/stress" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", padding: "6px 14px", border: "1px solid #5A7049", borderRadius: "20px" }}>Stress →</Link>
            <Link href="/selvvaerd" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", padding: "6px 14px", border: "1px solid #5A7049", borderRadius: "20px" }}>Selvværd →</Link>
            <Link href="/hypnoterapi" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", padding: "6px 14px", border: "1px solid #5A7049", borderRadius: "20px" }}>Om hypnoterapi →</Link>
            <Link href="/kontakt" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", padding: "6px 14px", border: "1px solid #5A7049", borderRadius: "20px" }}>Kontakt Jan →</Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
