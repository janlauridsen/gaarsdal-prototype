import Head from "next/head"
import Link from "next/link"
import Header from "../components/Header"
import Footer from "../components/Footer"

export default function Page() {
  return (
    <>
      <Header />
      <Head>
        <title>Skærmafhængighed hos børn, Birkerød | Gaarsdal</title>
        <meta name="description" content="Dit barn kan ikke lægge telefonen. Humøret afhænger af, hvad der sker online. Hypnoterapi arbejder med det underliggende behov. Jan Gaarsdal, Birkerød." />
        <link rel="canonical" href="https://gaarsdal.net/skaerm-born" />
        <meta property="og:title" content="Skærmafhængighed hos børn og unge, hypnoterapi Birkerød | Gaarsdal" />
        <meta property="og:description" content="Dit barn kan ikke lægge telefonen. Humøret afhænger af hvad der sker online. Hypnoterapi arbejder med det underliggende behov. Jan Gaarsdal, Birkerød." />
        <meta property="og:image" content="https://gaarsdal.net/Jan-AI.png" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://gaarsdal.net/skaerm-born" />
        <meta name="robots" content="index, follow" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              name: "Skærmafhængighed hos børn og unge",
              description: "Dit barn kan ikke lægge telefonen. Humøret afhænger af, hvad der sker online. Hypnoterapi arbejder med det underliggende behov. Jan Gaarsdal, Birkerød.",
              url: "https://gaarsdal.net/skaerm-born",
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
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                            {
                                          "@type": "Question",
                                          "name": "Kan hypnoterapi få mit barn til at bruge mindre skærm?",
                                          "acceptedAnswer": {
                                                        "@type": "Answer",
                                                        "text": "Ikke som fjernbetjening. Hypnoterapi arbejder med behovet bag brugen - anerkendelse, tilhørsforhold eller flugt fra noget ubehageligt. Bliver det behov mødt andre steder, falder skærmtiden som regel af sig selv. Går man direkte efter timerne uden at røre behovet, flytter det bare form."
                                          }
                            },
                            {
                                          "@type": "Question",
                                          "name": "Skal vi indføre forbud imens?",
                                          "acceptedAnswer": {
                                                        "@type": "Answer",
                                                        "text": "Rammer er fornuftige, men forbud alene adresserer ikke hvorfor barnet søger derhen. Det er også den hurtigste vej til daglige konflikter, hvor I bruger jeres energi på at kontrollere i stedet for at forstå. Hvad der giver mening hos jer, tager vi i forsamtalen."
                                          }
                            },
                            {
                                          "@type": "Question",
                                          "name": "Mit barn synes ikke selv det er et problem.",
                                          "acceptedAnswer": {
                                                        "@type": "Answer",
                                                        "text": "Det er meget almindeligt, og det udelukker ikke et forløb. Men det ændrer hvor man starter. Er der ingen egen motivation, arbejder vi sjældent direkte med skærmen. Vi arbejder med det barnet selv oplever som svært - dårlig søvn, uro, det med at sammenligne sig - og skærmen kommer ind ad den vej."
                                          }
                            },
                            {
                                          "@type": "Question",
                                          "name": "Er skærmafhængighed en rigtig diagnose?",
                                          "acceptedAnswer": {
                                                        "@type": "Answer",
                                                        "text": "Ikke som selvstændig diagnose i Danmark. Det er en beskrivelse af et mønster, ikke en sygdom. Det betyder ikke at det er harmløst: forskningen viser en klar sammenhæng mellem højt skærmforbrug og angst, depression og søvnproblemer hos børn og unge."
                                          }
                            }
              ]
            }),
          }}
        />
      </Head>
      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "120px 20px 80px", fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif", lineHeight: 1.7, color: "#333" }}>

        <section style={{ marginBottom: "60px" }}>
          <h1 style={{ fontSize: "34px", fontWeight: 600, lineHeight: 1.25, marginBottom: "20px" }}>Dit barn kan ikke lægge telefonen, og konflikter om det er hverdag</h1>
          <p style={{ fontSize: "18px", color: "#555", marginBottom: "16px", maxWidth: "660px" }}>Humøret afhænger af hvad der sker online. Det sover dårligt fordi det ligger med telefonen om natten. Det er irritabelt og trækker sig fra familien. Forbud og regler fører til konflikter. Du er bekymret, men ved ikke hvad der vil virke.</p>
          <p style={{ fontSize: "16px", color: "#666", maxWidth: "660px" }}>Skærmafhængighed er ikke et opdragelsesproblem. Det er et belønningssystem i hjernen, der er aktiveret på samme måde som andre afhængighedsmekanismer.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "20px" }}>Hvad der faktisk sker</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
                        <div style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Sociale medier er designet til afhængighed</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>Notifikationer, likes og uforudsigelig belønning aktiverer dopaminsystemet på præcis den måde der skaber afhængighed. Det er ikke tilfældigt, det er designet. Barnet reagerer neurologisk præcis som det er meningen.</p>
            </div>
            <div style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Sammenligningskulturen rammer selvbilledet</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>Sociale medier leverer konstant sammenligningsgrundlag med andres tilsyneladende bedste øjeblikke. For børn og unge i identitetsudvikling er dette særligt skadeligt og kan forstærke lavt selvbillede og social angst markant.</p>
            </div>
            <div style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Skærmen dækker et underliggende behov</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>Bag skærmafhængighed ligger typisk et uopfyldt behov for anerkendelse, tilhørsforhold eller flugt fra ubehag. Barnet finder det online fordi det ikke finder det tilstrækkeligt andetsteds. Forbud adresserer ikke det behov.</p>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: "60px", padding: "32px", background: "#f5f7fa", borderRadius: "10px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "16px" }}>Hvad forskning viser</h2>
          <p style={{ fontSize: "15px", marginBottom: "12px" }}>Forskning viser en klar sammenhæng mellem høj skærmtid og øget forekomst af angst, depression og søvnproblemer hos børn og unge. Sundhedsstyrelsen og WHO anbefaler begrænsning af skærmtid og adressering af de sociale og psykologiske behov bag brugen.</p>
          <p style={{ fontSize: "15px", color: "#666", fontStyle: "italic" }}>Kilde: <a href="https://www.sst.dk" target="_blank" rel="noopener" style={{ color: "#5a7a8f", textDecoration: "underline" }}>Sundhedsstyrelsen.dk</a>, WHO Guidelines on Physical Activity and Sedentary Behaviour, Twenge et al. 2018.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Hvad hypnoterapi gør</h2>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>Hypnoterapi arbejder med det underliggende behov der driver skærmbrugen. Når behovet mødes på anden måde, falder afhængigheden naturligt. Det er ikke en kamp mod telefonen, det er en forandring indefra.</p>
          <p style={{ fontSize: "15px", color: "#666", maxWidth: "700px" }}>Jan arbejder med skærmproblematikker som en del af et bredere billede. Tilgangen tilpasses, hvad der driver dit barns specifikke brug.</p>
        </section>


        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Sådan virker hypnose for børn</h2>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>Det første mange forældre spørger om: er det trygt? Svaret er ja. Hypnose hos børn er ikke kontroltab eller noget mystisk. Det er en fokuseret, afslappet tilstand, som børn faktisk kender bedre end voksne: det er den samme tilstand, de er i, når de er helt opslugt af leg eller en god historie. Børn er ofte lettere at arbejde med end voksne, netop fordi deres fantasi er stærk og deres mønstre endnu ikke har sat sig fast gennem årtier.</p>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>I den tilstand arbejdes der med barnets indre billeder og automatiske reaktioner. Barnet behøver ikke kunne forklare eller analysere sit problem, og det er en afgørende forskel fra samtaleterapi. Mange børn kan ikke sætte ord på hvorfor de har det som de har det, men de kan sagtens forestille sig, mærke og opleve. Det er præcis dér hypnoterapien arbejder.</p>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>Barnet hører alt, husker alt og har fuld kontrol undervejs. De fleste børn beskriver det som rart og afslappende, og for skærmvaner er det centralt: barnet skal ikke skammes ud af skærmen, men have mødt det behov, skærmen dækker.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Sådan foregår et forløb</h2>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}><strong>Gratis forsamtale (30 min).</strong> Vi taler sammen, forældre og Jan, om hvad I oplever derhjemme: hvornår det startede, hvad I har prøvet, og hvordan barnet har det. Her afklarer vi om hypnoterapi er det rette skridt. Ingen forpligtelse.</p>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}><strong>Første session (90 min).</strong> Barnet og Jan lærer hinanden at kende i ro og mag. Tilgangen tilpasses barnets alder og temperament: for nogle børn ligner det mest en fantasirejse, for andre en rolig samtale med lukkede øjne. Du kan være til stede, hvis barnet ønsker det.</p>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}><strong>Opfølgning og forældreinddragelse.</strong> Du deltager i opsamlende samtaler, så du ved hvad der arbejdes med, og hvordan du støtter derhjemme. Ældre børn arbejder nogle gange bedst med rummet for sig selv; separate samtaler er også en mulighed. Mange familier oplever mærkbar bedring efter få sessioner.</p>
          <p style={{ fontSize: "15px", color: "#666", maxWidth: "700px" }}>Samme priser som for voksne: gratis forsamtale, 900 kr første session, 600 kr opfølgning. Se <Link href="/priser" style={{ color: "#5a7a8f" }}>priser</Link>.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Hvad skærmen dækker over</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "700px" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Skærmen er sjældent problemet i sig selv</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7, margin: 0 }}>Bag massiv skærmbrug ligger næsten altid et behov: ro fra uro, pause fra krav, fællesskab man ikke finder i skolegården, eller flugt fra kedsomhed og svære følelser. Tages skærmen uden at behovet mødes, finder mistrivslen bare et andet udtryk.</p>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Hjernens belønningssystem er designet til at tabe</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7, margin: 0 }}>Spil og sociale medier er bygget af professionelle til at fastholde, med variable belønninger, streaks og uendelige feeds. Det er ikke svag vilje, når et barn ikke kan stoppe: det er et umodent belønningssystem mod et milliardindustri-design. Derfor virker skæld ud så dårligt.</p>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Konflikten forstærker mønsteret</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7, margin: 0 }}>Når hver aften ender i kamp om skærmen, kobles familien til konflikt og skærmen til fristed. Hypnoterapien arbejder med barnets indre regulering, så det selv kan mærke og styre, i stedet for at al regulering skal komme udefra gennem regler og kamp.</p>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Hvad der faktisk virker</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7, margin: 0 }}>Målet er ikke nul skærm, men et barn der kan stoppe selv, mærke sig selv og har noget der trækker den anden vej. Arbejdet kombinerer det underliggende behov, den automatiske trang og barnets oplevelse af eget valg.</p>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: "48px", padding: "32px", background: "#f9fafb", borderRadius: "10px", borderLeft: "3px solid #5a7a8f" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>Jan Gaarsdal, hypnoterapeut i Birkerød</h2>
          <p style={{ fontSize: "15px", color: "#555", marginBottom: "16px", lineHeight: 1.7 }}>
            Jan arbejder med børn fra 8 år og involverer altid forældrene i forløbet. Den gratis forsamtale på 30 minutter, telefon eller fysisk, afklarer om hypnoterapi er det rette for dit barn.
          </p>
          <div style={{ padding: "12px 16px", background: "#f0f4f8", borderRadius: "6px", display: "inline-block" }}>
            <p style={{ fontSize: "14px", fontWeight: 500, color: "#333", margin: "0 0 8px" }}>🎯 Gratis forsamtale, 30 minutter, telefon eller fysisk</p>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <Link href="/kontakt" style={{ fontSize: "14px", color: "#fff", background: "#5a7a8f", textDecoration: "none", fontWeight: 500, padding: "8px 16px", borderRadius: "4px" }}>Book forsamtale</Link>
              <a href="tel:+4542807474" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", fontWeight: 500, padding: "8px 0" }}>Ring +45 42 80 74 74</a>
            </div>
          </div>
        </section>

        {/* VIGTIG AFGRÆNSNING */}
        <section style={{ marginBottom: "60px", padding: "28px 32px", background: "#fdf6f0", borderRadius: "10px", border: "1px solid #ecd9c6" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>Når skærmbrug kan være et symptom</h2>
          <p style={{ fontSize: "15px", color: "#555", maxWidth: "700px", margin: 0 }}>Massiv skærmbrug kan nogle gange være et symptom på noget andet, for eksempel ADHD, autisme, angst eller depression. Hvis I oplever at problemet er en del af et bredere billede, eller at barnet mistrives markant, bør I tale med egen læge eller PPR. Hypnoterapi kan arbejde med vanen og det underliggende behov, men erstatter ikke en udredning.</p>
        </section>

        {/* FAQ */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "24px" }}>Ofte stillede spørgsmål om skærmforbrug hos børn</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {[
              {
                q: "Kan hypnoterapi få mit barn til at bruge mindre skærm?",
                a: "Ikke som fjernbetjening. Hypnoterapi arbejder med behovet bag brugen - anerkendelse, tilhørsforhold eller flugt fra noget ubehageligt. Bliver det behov mødt andre steder, falder skærmtiden som regel af sig selv. Går man direkte efter timerne uden at røre behovet, flytter det bare form.",
              },
              {
                q: "Skal vi indføre forbud imens?",
                a: "Rammer er fornuftige, men forbud alene adresserer ikke hvorfor barnet søger derhen. Det er også den hurtigste vej til daglige konflikter, hvor I bruger jeres energi på at kontrollere i stedet for at forstå. Hvad der giver mening hos jer, tager vi i forsamtalen.",
              },
              {
                q: "Mit barn synes ikke selv det er et problem.",
                a: "Det er meget almindeligt, og det udelukker ikke et forløb. Men det ændrer hvor man starter. Er der ingen egen motivation, arbejder vi sjældent direkte med skærmen. Vi arbejder med det barnet selv oplever som svært - dårlig søvn, uro, det med at sammenligne sig - og skærmen kommer ind ad den vej.",
              },
              {
                q: "Er skærmafhængighed en rigtig diagnose?",
                a: "Ikke som selvstændig diagnose i Danmark. Det er en beskrivelse af et mønster, ikke en sygdom. Det betyder ikke at det er harmløst: forskningen viser en klar sammenhæng mellem højt skærmforbrug og angst, depression og søvnproblemer hos børn og unge.",
              },
            ].map((item) => (
              <div key={item.q} style={{ borderBottom: "1px solid #eee", paddingBottom: "16px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#333" }}>{item.q}</h3>
                <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7 }}>{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 500, color: "#888", marginBottom: "12px" }}>Relaterede emner</h2>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href="/selvbillede-born" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Selvbillede</Link>
            <Link href="/angst-born" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Angst hos børn</Link>
            <Link href="/sovn-born" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Søvnproblemer</Link>
            <Link href="/children" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Børn & Unge</Link>
            <Link href="/priser" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Priser</Link>
            <Link href="/kontakt" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Kontakt Jan</Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
