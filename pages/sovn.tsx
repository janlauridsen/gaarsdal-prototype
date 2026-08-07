import Head from "next/head"
import Link from "next/link"
import Header from "../components/Header"
import Footer from "../components/Footer"

export default function SovnPage() {
  return (
    <>
      <Header />
      <Head>
        <title>Søvnproblemer og hypnoterapi i Birkerød | Gaarsdal</title>
        <meta name="description" content="Kan du ikke sove? Vågner om natten? Hypnoterapi arbejder med nervesystemet, der holder dig vågen. Ikke med viljestyrke. Jan Gaarsdal, Birkerød." />
        <link rel="canonical" href="https://gaarsdal.net/sovn" />
        <meta property="og:title" content="Søvnproblemer og hypnoterapi | Gaarsdal Birkerød" />
        <meta property="og:description" content="Søvnproblemer sidder dybere end gode vaner og skærmfri aftener. Hypnoterapi arbejder der, hvor viljestyrken ikke når ind." />
        <meta property="og:image" content="https://gaarsdal.net/Jan-AI.png" />
        <meta property="og:url" content="https://gaarsdal.net/sovn" />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              name: "Søvnproblemer og hypnoterapi",
              description: "Hypnoterapi til søvnproblemer i Birkerød. Jan Gaarsdal arbejder med nervesystemet der holder dig vågen.",
              url: "https://gaarsdal.net/sovn",
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
          dangerouslySetInnerHTML={{ __html: "{\"@context\": \"https://schema.org\", \"@type\": \"FAQPage\", \"mainEntity\": [{\"@type\": \"Question\", \"name\": \"Kan hypnose hjælpe mod søvnproblemer?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Ja. Hypnotisk tilstand og søvnindledning aktiverer de samme neurologiske mekanismer. Hypnoterapi lærer nervesystemet at slippe ned i ro, så søvnen kommer naturligt i stedet for at skulle tvinges frem.\"}}, {\"@type\": \"Question\", \"name\": \"Hvor hurtigt virker hypnose mod søvnløshed?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Nogle mærker en forskel hurtigt, andre har brug for længere tid. Da søvnproblemer ofte handler om en lært association mellem sengen og uro, kan ændringen af det mønster ske relativt hurtigt.\"}}, {\"@type\": \"Question\", \"name\": \"Hvorfor virker gode søvnvaner ikke for mig?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Fordi søvnproblemer sjældent handler om vaner alene. De handler om et nervesystem i beredskab og en hjerne der har lært at forbinde sengen med uro. Den association kan ikke ændres ved viljestyrke eller rutiner alene.\"}}, {\"@type\": \"Question\", \"name\": \"Er hypnose mod søvn det samme som søvnmedicin?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Nej. Søvnmedicin dæmper symptomet midlertidigt, mens hypnoterapi arbejder med årsagen til at nervesystemet ikke slipper ned. Hypnose har ingen bivirkninger og skaber ikke afhængighed.\"}}]}" }}
        />
      </Head>

      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "120px 20px 80px", fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif", lineHeight: 1.7, color: "#333" }}>

        {/* GENKENDELSE */}
        <section style={{ marginBottom: "60px" }}>
          <h1 style={{ fontSize: "34px", fontWeight: 600, lineHeight: 1.25, marginBottom: "20px" }}>
            Du er træt, men kan ikke sove
          </h1>
          <p style={{ fontSize: "18px", color: "#555", marginBottom: "16px", maxWidth: "660px" }}>
            Du lægger dig. Tankerne starter. Du vågner kl. 3 og kan ikke falde i søvn igen. Du har prøvet alt, ingen skærm, magnesium, melatonin, podcasts. Det hjælper lidt. Men ikke nok. Og ikke konsekvent.
          </p>
          <p style={{ fontSize: "16px", color: "#666", maxWidth: "660px" }}>
            Det er ikke din viljestyrke der svigter. Problemet sidder et andet sted.
          </p>
        </section>

        {/* HVAD FORSKNING VISER */}
        <section style={{ marginBottom: "60px", padding: "32px", background: "#f5f7fa", borderRadius: "10px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "16px" }}>Hvad forskning viser om søvn</h2>
          <p style={{ fontSize: "15px", marginBottom: "12px" }}>
            Sundhedsstyrelsen anbefaler, at voksne sover mindst 7 timer pr. nat. Ny forskning publiceret i Nature (2025) viser, at både for kort og for lang søvn accelererer den biologiske aldring i otte organer, hjernen, lunger, lever, immunsystem og flere andre.
          </p>
          <p style={{ fontSize: "15px", marginBottom: "12px" }}>
            Samme forskning finder, at for lidt søvn øger risikoen for hjerte-kar-sygdomme, diabetes og en række muskel- og ledsygdomme. Mænd ser ud til at være mere sårbare overfor søvnunderskud end kvinder.
          </p>
          <p style={{ fontSize: "15px", color: "#666", fontStyle: "italic" }}>
            Kilde: Nature, maj 2025. <a href="https://www.sst.dk" target="_blank" rel="noopener" style={{ color: "#5a7a8f", textDecoration: "underline" }}>Sundhedsstyrelsen.dk</a>.
          </p>
        </section>

        {/* HVAD DER SKER */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "20px" }}>Hvorfor gode søvnvaner ikke er nok</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
            {[
              {
                titel: "Nervesystemet er i beredskab",
                tekst: "Søvnproblemer handler sjældent om søvn i sig selv. De handler om et nervesystem der ikke slipper ned. Hjernen opfatter sengen som et sted med uro, ikke ro. Den association kører automatisk og kan ikke brydes ved at tænke sig til det.",
              },
              {
                titel: "Tankerne kører af sig selv",
                tekst: "Overtænkning om natten er ikke et tegn på, at du er bekymret over noget konkret. Det er et nervesystem der kompenserer for usikkerhed ved at simulere og kontrollere. Det kører, fordi det tror, det hjælper dig.",
              },
              {
                titel: "Viljestyrke virker ikke her",
                tekst: "Du kan beslutte dig for at sove. Du kan gøre alt rigtigt. Og alligevel ligge vågen. Det er fordi beslutningen og vanen sidder i to forskellige dele af hjernen, og det er den automatiske, der vinder.",
              },
            ].map((k) => (
              <div key={k.titel} style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>{k.titel}</h3>
                <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>{k.tekst}</p>
              </div>
            ))}
          </div>
        </section>

        {/* HVAD HYPNOTERAPI GØR */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Hvad hypnoterapi gør ved søvnproblemer</h2>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>
            Hypnotisk tilstand og søvnindledning aktiverer de samme neurologiske mekanismer. Det giver en unik mulighed: du lærer at lede nervesystemet ned i ro, ikke som en teknik, du skal huske at bruge, men som en ny automatisk reaktion.
          </p>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>
            Arbejdet handler ikke om at lære dig gode søvnvaner. Det handler om at ændre hvad hjernen automatisk forbinder med sengen og med natten. Nogle mærker en forskel hurtigt, andre har brug for længere tid.
          </p>
          <p style={{ fontSize: "15px", color: "#666", maxWidth: "700px" }}>
            Hypnoterapi er ikke for alle søvnproblemer. Hvis søvnen er påvirket af smerter, medicinbivirkninger eller en diagnosticeret søvnforstyrrelse, er det bedst at starte med din læge. Den gratis forsamtale afklarer om det giver mening for dig.
          </p>
        </section>


        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Sådan hjælper hypnose dig med at sove</h2>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>Søvnproblemer hos voksne er sjældent et søvnproblem i sig selv. Det er et nervesystem, der er for aktiveret til at slippe ned. Du er træt, men i det øjeblik du lægger dig, tænder systemet: tankerne starter, kroppen er på vagt. Sengen er blevet koblet til uro i stedet for ro.</p>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>Hypnose arbejder direkte med den kobling. Den hypnotiske tilstand og den naturlige indsovning aktiverer de samme neurologiske mekanismer: en gradvis nedlukning hvor opmærksomheden vender indad og kroppen falder til ro. I sessionen lærer nervesystemet vejen ned igen.</p>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>Det afgørende er, at det ikke er en teknik du skal huske at bruge klokken 23. Det er en ny automatisk reaktion: sengen og mørket kommer igen til at betyde ro frem for alarm. For mange kommer resultaterne relativt hurtigt, fordi søvn er kroppens naturlige tilstand, når alarmberedskabet slipper.</p>
          <p style={{ fontSize: "15px", color: "#666", maxWidth: "700px" }}>Samtidig arbejdes der med det, der holder dig vågen: bekymringerne der får frit løb i stilheden, eller den vedvarende uro der ikke vil falde til ro.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Sådan foregår et forløb</h2>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}><strong>Gratis forsamtale (30 min).</strong> Vi taler om hvad du oplever, hvornår det startede, og hvad du har prøvet. Her afklarer vi sammen, om hypnoterapi er den rette tilgang for dig. Telefon eller fysisk, og helt uforpligtende.</p>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}><strong>Første session (90 min).</strong> En grundig samtale om din historie og dit mønster, efterfulgt af den første hypnose. De fleste bliver overraskede over hvor naturligt det føles: en dyb afspænding hvor du hører alt, husker alt og har fuld kontrol.</p>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}><strong>Opfølgende sessioner (ca. 60 min).</strong> Arbejdet målrettes det, der driver netop dit mønster. Mange mærker forandring efter få sessioner; afgrænsede problemstillinger kan ofte klares hurtigt, mens mere indgroede mønstre kræver et lidt længere forløb.</p>
          <p style={{ fontSize: "15px", color: "#666", maxWidth: "700px" }}>Sessioner foregår fysisk i Birkerød eller online efter aftale. Se <Link href="/priser" style={{ color: "#5a7a8f" }}>priser</Link>.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>De typiske søvnmønstre</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "700px" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Du kan ikke falde i søvn</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7, margin: 0 }}>Du ligger vågen i timevis selvom du er udmattet. Tankerne kører, kroppen vil ikke slippe. Ofte er sengen blevet en kampplads, og selve det at prøve at sove holder dig vågen.</p>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Du vågner om natten</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7, margin: 0 }}>Du falder i søvn, men vågner kl. 3 og kan ikke falde i søvn igen. Hjernen tænder med det samme, ofte med bekymringer eller en diffus uro. Nattevågenhed er et af de tydeligste tegn på et overaktiveret nervesystem.</p>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Bekymringer ved sengetid</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7, margin: 0 }}>Når dagens distraktioner forsvinder, får tankerne frit løb. Sengen bliver det sted, hvor alt det uafsluttede melder sig. Det er ofte angst eller stress, der viser sig om natten, og begge dele kan der arbejdes med.</p>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Du sover, men er aldrig udhvilet</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7, margin: 0 }}>Du får måske timerne, men vågner træt. Søvnen er overfladisk, fordi nervesystemet aldrig kommer helt ned i den dybe, restituerende søvn. Her arbejdes der med selve dybden, ikke kun med at falde i søvn.</p>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: "60px", padding: "28px 32px", background: "#fdf6f0", borderRadius: "10px", border: "1px solid #ecd9c6" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>Vigtigt at vide</h2>
          <p style={{ fontSize: "15px", color: "#555", maxWidth: "700px", margin: 0 }}>Ved mistanke om søvnapnø (kraftig snorken med vejrtrækningspauser), rastløse ben eller hvis søvnproblemet er opstået pludseligt uden årsag, bør du tale med din læge, så fysiske årsager udelukkes. Hypnoterapi arbejder med de uro- og mønsterdrevne søvnproblemer.</p>
        </section>

        {/* OM JAN */}
        <section style={{ marginBottom: "48px", padding: "32px", background: "#f9fafb", borderRadius: "10px", borderLeft: "3px solid #5a7a8f" }}>
          <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>Jan Gaarsdal, hypnoterapeut i Birkerød</h2>
              <p style={{ fontSize: "15px", color: "#555", marginBottom: "16px", lineHeight: 1.7 }}>
                Jan arbejder med søvnproblemer hos voksne og unge. Han tilpasser sin tilgang til hvad der driver dit specifikke søvnproblem, uro, tankemylder, tidlig opvågning eller indsoningsbesvær.
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
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "24px" }}>Ofte stillede spørgsmål</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ borderBottom: "1px solid #eee", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#333" }}>Kan hypnose hjælpe mod søvnproblemer?</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7 }}>Ja. Hypnotisk tilstand og søvnindledning aktiverer de samme neurologiske mekanismer. Hypnoterapi lærer nervesystemet at slippe ned i ro, så søvnen kommer naturligt i stedet for at skulle tvinges frem.</p>
            </div>
            <div style={{ borderBottom: "1px solid #eee", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#333" }}>Hvor hurtigt virker hypnose mod søvnløshed?</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7 }}>Nogle mærker en forskel hurtigt, andre har brug for længere tid. Da søvnproblemer ofte handler om en lært association mellem sengen og uro, kan ændringen af det mønster ske relativt hurtigt.</p>
            </div>
            <div style={{ borderBottom: "1px solid #eee", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#333" }}>Hvorfor virker gode søvnvaner ikke for mig?</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7 }}>Fordi søvnproblemer sjældent handler om vaner alene. De handler om et nervesystem i beredskab og en hjerne der har lært at forbinde sengen med uro. Den association kan ikke ændres ved viljestyrke eller rutiner alene.</p>
            </div>
            <div style={{ borderBottom: "1px solid #eee", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#333" }}>Er hypnose mod søvn det samme som søvnmedicin?</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7 }}>Nej. Søvnmedicin dæmper symptomet midlertidigt, mens hypnoterapi arbejder med årsagen til at nervesystemet ikke slipper ned. Hypnose har ingen bivirkninger og skaber ikke afhængighed.</p>
            </div>
          </div>
        </section>

        {/* RELATEREDE SIDER */}
        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 500, color: "#888", marginBottom: "12px" }}>Relaterede emner</h2>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href="/kender-du-det" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Kender du det? →</Link>
            <Link href="/hypnoterapi" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Om hypnoterapi →</Link>
            <Link href="/kontakt" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Kontakt Jan →</Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
