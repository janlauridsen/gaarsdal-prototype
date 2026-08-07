import Head from "next/head"
import Link from "next/link"
import Header from "../components/Header"
import Footer from "../components/Footer"

export default function Page() {
  return (
    <>
      <Header />
      <Head>
        <title>Socialt udenfor, børn og unge | Gaarsdal</title>
        <meta name="description" content="Dit barn føler sig udenfor og har svært ved venskaber. Hypnoterapi arbejder med selvopfattelsen, der driver adfærden. Jan Gaarsdal, Birkerød." />
        <link rel="canonical" href="https://gaarsdal.net/social-angst-born" />
        <meta property="og:title" content="Socialt udenfor, børn og unge, hypnoterapi Birkerød | Gaarsdal" />
        <meta property="og:description" content="Dit barn føler sig udenfor og har svært ved venskaber. Hypnoterapi arbejder med selvopfattelsen der driver adfærden. Jan Gaarsdal, Birkerød." />
        <meta property="og:image" content="https://gaarsdal.net/Jan-AI.png" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://gaarsdal.net/social-angst-born" />
        <meta name="robots" content="index, follow" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              name: "Social angst hos børn og unge",
              description: "Dit barn føler sig udenfor og har svært ved venskaber. Hypnoterapi arbejder med selvopfattelsen, der driver adfærden. Jan Gaarsdal, Birkerød.",
              url: "https://gaarsdal.net/social-angst-born",
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
                                          "name": "Er vores barn bare genert?",
                                          "acceptedAnswer": {
                                                        "@type": "Answer",
                                                        "text": "Generthed er et temperament, og det behøver ikke laves om. Social angst er noget andet: barnet vil gerne være med, men holder sig tilbage af frygt for hvad de andre tænker, og bagefter gennemgår det situationen igen og igen. Det er lidelsen ved det, ikke tilbageholdenheden, der er signalet."
                                          }
                            },
                            {
                                          "@type": "Question",
                                          "name": "Hjælper det ikke at melde barnet til flere aktiviteter?",
                                          "acceptedAnswer": {
                                                        "@type": "Answer",
                                                        "text": "Sjældent alene. Flere sociale situationer giver ikke automatisk flere positive erfaringer, hvis barnet går ind i dem med en forventning om at blive vurderet. Så bliver aktiviteterne endnu et sted hvor overbevisningen bekræftes."
                                          }
                            },
                            {
                                          "@type": "Question",
                                          "name": "Vores barn klarer sig fint i skolen, men har ingen venner.",
                                          "acceptedAnswer": {
                                                        "@type": "Answer",
                                                        "text": "Det er et almindeligt billede. Mange børn med social angst fungerer godt i strukturerede situationer, hvor det er tydeligt hvad man skal, og går i stå i frikvarteret hvor det ikke er. At det går godt fagligt betyder ikke at der ikke er noget at arbejde med."
                                          }
                            },
                            {
                                          "@type": "Question",
                                          "name": "Vi går allerede hos psykolog eller PPR. Kan vi bruge begge dele?",
                                          "acceptedAnswer": {
                                                        "@type": "Answer",
                                                        "text": "Ja, og ved svær social angst bør flere fagligheder samarbejde. Hypnoterapi står bedst alene ved afgrænsede mønstre. Sig i forsamtalen hvad I ellers har gang i, så tilrettelægges det derefter i stedet for at trække i hver sin retning."
                                          }
                            }
              ]
            }),
          }}
        />
      </Head>
      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "120px 20px 80px", fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif", lineHeight: 1.7, color: "#333" }}>

        <section style={{ marginBottom: "60px" }}>
          <h1 style={{ fontSize: "34px", fontWeight: 600, lineHeight: 1.25, marginBottom: "20px" }}>Dit barn er der, men føler sig ikke med</h1>
          <p style={{ fontSize: "18px", color: "#555", marginBottom: "16px", maxWidth: "660px" }}>Det er inviteret med men trækker sig. Det har klassekammerater men ingen rigtige venner. Det deltager ikke i samtaler og sidder for sig selv i frikvarteret. Du kan se, at det er ensomt men det vil ikke tale om det, eller ved ikke selv, hvad der er galt.</p>
          <p style={{ fontSize: "16px", color: "#666", maxWidth: "660px" }}>Sociale vanskeligheder hos børn handler sjældent om manglende sociale evner. Det handler næsten altid om, hvad barnet tror om sig selv i andres øjne.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "20px" }}>Hvad der faktisk sker</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
                        <div style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Selvopfattelsen styrer adfærden</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>Børn, der tror, de ikke er værd at kende trækker sig, undgår initiativ og fortolker andres adfærd negativt. Overbevisningen er selvforstærkende: jo mere barnet trækker sig, jo færre positive sociale erfaringer, jo stærkere bekræftes overbevisningen.</p>
            </div>
            <div style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Det er ikke generthed</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>Generthed er en temperamentsmæssig disposition. Social angst er en lært frygtreaktion. Barnet ønsker socialt samvær, men frygter det og undgår det. Forskellen er vigtig, fordi løsningen er forskellig.</p>
            </div>
            <div style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Sociale teknikker løser det ikke</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>At lære barnet at stille spørgsmål og huske navne hjælper ikke, hvis grundoverbevisningen er, at andre ikke bryder sig. Teknikker oven på en negativ selvopfattelse holder ikke. Selvopfattelsen skal ændres ved roden.</p>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: "60px", padding: "32px", background: "#f5f7fa", borderRadius: "10px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "16px" }}>Hvad forskning viser</h2>
          <p style={{ fontSize: "15px", marginBottom: "12px" }}>Social angst er en af de hyppigste angstlidelser hos børn og unge. Forskning viser, at ubehandlet social angst i barndommen øger risikoen for depression og isolation i voksenlivet. WHO og Sundhedsstyrelsen fremhæver tidlig intervention som afgørende.</p>
          <p style={{ fontSize: "15px", color: "#666", fontStyle: "italic" }}>Kilde: <a href="https://www.sst.dk" target="_blank" rel="noopener" style={{ color: "#5a7a8f", textDecoration: "underline" }}>Sundhedsstyrelsen.dk</a>, WHO Mental Health Atlas, Dansk Institut for Psykiatri.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Hvad hypnoterapi gør</h2>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>Hypnoterapi arbejder direkte med den grundlæggende overbevisning barnet har om sin egen sociale værdi. Et barn, der inderst inde tror, det er værd at kende, opfører sig anderledes, spontant og uden at øve sig. Forandringen kommer indefra.</p>
          <p style={{ fontSize: "15px", color: "#666", maxWidth: "700px" }}>Jan tilpasser sin tilgang til barnets alder og de konkrete situationer der er vanskelige. Forældrene er altid med i processen.</p>
        </section>


        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Sådan virker hypnose for børn</h2>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>Det første mange forældre spørger om: er det trygt? Svaret er ja. Hypnose hos børn er ikke kontroltab eller noget mystisk. Det er en fokuseret, afslappet tilstand, som børn faktisk kender bedre end voksne: det er den samme tilstand, de er i, når de er helt opslugt af leg eller en god historie. Børn er ofte lettere at arbejde med end voksne, netop fordi deres fantasi er stærk og deres mønstre endnu ikke har sat sig fast gennem årtier.</p>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>I den tilstand arbejdes der med barnets indre billeder og automatiske reaktioner. Barnet behøver ikke kunne forklare eller analysere sit problem, og det er en afgørende forskel fra samtaleterapi. Mange børn kan ikke sætte ord på hvorfor de har det som de har det, men de kan sagtens forestille sig, mærke og opleve. Det er præcis dér hypnoterapien arbejder.</p>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>Barnet hører alt, husker alt og har fuld kontrol undervejs. De fleste børn beskriver det som rart og afslappende, og for socialt ængstelige børn er det ofte en lettelse, at de ikke skal præstere eller forklare sig: de skal bare være med.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Sådan foregår et forløb</h2>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}><strong>Gratis forsamtale (30 min).</strong> Vi taler sammen, forældre og Jan, om hvad I oplever derhjemme: hvornår det startede, hvad I har prøvet, og hvordan barnet har det. Her afklarer vi om hypnoterapi er det rette skridt. Ingen forpligtelse.</p>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}><strong>Første session (90 min).</strong> Barnet og Jan lærer hinanden at kende i ro og mag. Tilgangen tilpasses barnets alder og temperament: for nogle børn ligner det mest en fantasirejse, for andre en rolig samtale med lukkede øjne. Du kan være til stede, hvis barnet ønsker det.</p>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}><strong>Opfølgning og forældreinddragelse.</strong> Du deltager i opsamlende samtaler, så du ved hvad der arbejdes med, og hvordan du støtter derhjemme. Ældre børn arbejder nogle gange bedst med rummet for sig selv; separate samtaler er også en mulighed. Mange familier oplever mærkbar bedring efter få sessioner.</p>
          <p style={{ fontSize: "15px", color: "#666", maxWidth: "700px" }}>Samme priser som for voksne: gratis forsamtale, 900 kr første session, 600 kr opfølgning. Se <Link href="/priser" style={{ color: "#5a7a8f" }}>priser</Link>.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Sådan viser social angst sig hos børn</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "700px" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Det stille barn der forsvinder</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7, margin: 0 }}>Nogle socialt ængstelige børn larmer ikke: de bliver væk. De rækker aldrig hånden op, undgår at læse højt og finder på undskyldninger ved fødselsdage og fritidsaktiviteter. Fordi de ikke skaber problemer, opdages deres mistrivsel ofte sent.</p>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Frygten for at blive set</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7, margin: 0 }}>Kernen er frygten for andres blikke: at sige noget forkert, rødme, blive grinet ad. Hjernens alarmsystem har koblet sociale situationer til fare, og reaktionen kommer automatisk, uanset hvor meget barnet ved, at der ikke sker noget.</p>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Undgåelsen gør verden mindre</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7, margin: 0 }}>Hver gang barnet slipper for det, der gør det utrygt, falder angsten kortvarigt, og hjernen lærer at undgåelse virker. Med tiden bliver komfortzonen mindre og mindre. Derfor arbejdes der med selve alarmreaktionen, så barnet kan møde situationerne i stedet for at flygte fra dem.</p>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Forskellen på generthed og social angst</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7, margin: 0 }}>Generthed er et temperament: barnet varmer langsomt op men deltager. Social angst begrænser: barnet går glip af venskaber, oplevelser og læring. Når undgåelsen styrer barnets valg, er det tid til at gøre noget.</p>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: "60px", padding: "28px 32px", background: "#fdf6f0", borderRadius: "10px", border: "1px solid #ecd9c6" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>Hvornår skal I søge anden hjælp</h2>
          <p style={{ fontSize: "15px", color: "#555", maxWidth: "700px", margin: 0 }}>Hvis den sociale angst er invaliderende, barnet isolerer sig markant eller mistrives dybt, skal I inddrage egen læge eller PPR. Hypnoterapi virker godt på afgrænsede sociale angstmønstre, men ved svær angst skal flere fagligheder samarbejde.</p>
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

        {/* FAQ */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "24px" }}>Ofte stillede spørgsmål om social angst hos børn og unge</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {[
              {
                q: "Er vores barn bare genert?",
                a: "Generthed er et temperament, og det behøver ikke laves om. Social angst er noget andet: barnet vil gerne være med, men holder sig tilbage af frygt for hvad de andre tænker, og bagefter gennemgår det situationen igen og igen. Det er lidelsen ved det, ikke tilbageholdenheden, der er signalet.",
              },
              {
                q: "Hjælper det ikke at melde barnet til flere aktiviteter?",
                a: "Sjældent alene. Flere sociale situationer giver ikke automatisk flere positive erfaringer, hvis barnet går ind i dem med en forventning om at blive vurderet. Så bliver aktiviteterne endnu et sted hvor overbevisningen bekræftes.",
              },
              {
                q: "Vores barn klarer sig fint i skolen, men har ingen venner.",
                a: "Det er et almindeligt billede. Mange børn med social angst fungerer godt i strukturerede situationer, hvor det er tydeligt hvad man skal, og går i stå i frikvarteret hvor det ikke er. At det går godt fagligt betyder ikke at der ikke er noget at arbejde med.",
              },
              {
                q: "Vi går allerede hos psykolog eller PPR. Kan vi bruge begge dele?",
                a: "Ja, og ved svær social angst bør flere fagligheder samarbejde. Hypnoterapi står bedst alene ved afgrænsede mønstre. Sig i forsamtalen hvad I ellers har gang i, så tilrettelægges det derefter i stedet for at trække i hver sin retning.",
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
            <Link href="/ensomhed-born" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Ensomhed</Link>
            <Link href="/angst-born" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Angst hos børn</Link>
            <Link href="/children" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Børn & Unge</Link>
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
