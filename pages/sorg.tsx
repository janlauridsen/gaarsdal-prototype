import Head from "next/head"
import Link from "next/link"
import Header from "../components/Header"
import Footer from "../components/Footer"

export default function SorgPage() {
  return (
    <>
      <Header />
      <Head>
        <title>Sorg og tab, hypnoterapi Birkerød | Gaarsdal</title>
        <meta name="description" content="Sorg der ikke slipper. Hypnoterapi hjælper med at bearbejde tab og fastlåst sorg - og finde en vej videre. Jan Gaarsdal, Birkerød. Gratis forsamtale." />
        <link rel="canonical" href="https://gaarsdal.net/sorg" />
        <meta property="og:title" content="Sorg og tab - hypnoterapi | Gaarsdal Birkerød" />
        <meta property="og:description" content="Sorg der sidder fast er ikke svaghed. Det er et nervesystem der ikke har fundet vej igennem tabet. Hypnoterapi hjælper der hvor ord ikke rækker." />
        <meta property="og:image" content="https://gaarsdal.net/Jan-AI.png" />
        <meta property="og:url" content="https://gaarsdal.net/sorg" />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "MedicalWebPage", name: "Sorg og tab - hypnoterapi", description: "Hypnoterapi til sorg og tab i Birkerød. Jan Gaarsdal hjælper med fastlåst sorg og bearbejdning af tab.", url: "https://gaarsdal.net/sorg", provider: { "@type": "Person", name: "Jan Gaarsdal", url: "https://gaarsdal.net/om", telephone: "+4542807474" } }) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: "{\"@context\":\"https://schema.org\",\"@type\":\"FAQPage\",\"mainEntity\":[{\"@type\":\"Question\",\"name\":\"Kan hypnose hjælpe mod sorg?\",\"acceptedAnswer\":{\"@type\":\"Answer\",\"text\":\"Ja, der hvor sorgen sidder fast. Hypnoterapi fjerner ikke savnet, men hjælper nervesystemet med at bearbejde tabet, så du finder en bæredygtig måde at leve videre med det. Det er særligt relevant ved fastlåst eller kompliceret sorg.\"}},{\"@type\":\"Question\",\"name\":\"Hvornår er sorg fastlåst?\",\"acceptedAnswer\":{\"@type\":\"Answer\",\"text\":\"Når sorgen ikke finder vej igennem, men bliver en vedvarende tilstand af uro, tomhed eller smerte uden bedring over tid. Det ses især ved pludselige, traumatiske eller uafsluttede tab. Den gratis forsamtale afklarer om det er tilfældet for dig.\"}},{\"@type\":\"Question\",\"name\":\"Tager hypnose minderne om den jeg har mistet?\",\"acceptedAnswer\":{\"@type\":\"Answer\",\"text\":\"Nej. Hypnoterapi fjerner hverken minder eller kærlighed til den du har mistet. Den arbejder med den fastlåste smerte - så minderne kan være der uden at lamme dig.\"}},{\"@type\":\"Question\",\"name\":\"Hvor lang tid efter et tab kan jeg søge hjælp?\",\"acceptedAnswer\":{\"@type\":\"Answer\",\"text\":\"Der er ingen rigtig tidsramme. Nogle søger hjælp tidligt, andre år efter et tab der aldrig blev bearbejdet. Hypnoterapi kan hjælpe uanset hvor lang tid der er gået siden tabet.\"}}]}" }} />
      </Head>

      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "120px 20px 80px", fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif", lineHeight: 1.7, color: "#2C2A28" }}>

        <section style={{ marginBottom: "60px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 600, lineHeight: 1.3, letterSpacing: "-0.01em", marginBottom: "20px" }}>Sorgen fylder mere end omgivelserne forstår</h1>
          <p style={{ fontSize: "19px", lineHeight: 1.65, color: "#4A463F", marginBottom: "18px", maxWidth: "700px" }}>Du har mistet nogen eller noget der betød alt. Omgivelserne siger det tager tid. Men de siger ikke noget om, hvad du gør med den tid. Sorgen er ikke noget der bare passerer. Og jo mere du prøver at fungere udadtil, jo mere sidder den fast indeni.</p>
          <p style={{ fontSize: "17px", lineHeight: 1.7, color: "#6B675F", maxWidth: "700px" }}>Sorg der sidder fast er ikke svaghed. Det er et nervesystem der ikke har fundet vej igennem tabet - og det kan der arbejdes med.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "20px" }}>Hvad der faktisk sker</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
            {[
              { titel: "Sorg er ikke lineær", tekst: "Der er ingen rigtig rækkefølge. Sorg kommer i bølger, vender tilbage uventet og kan aktiveres af steder, lyde og lugte år efter. Det er ikke et tegn på at noget er galt - det er et tegn på at der var noget der betød noget." },
              { titel: "Fastlåst sorg", tekst: "Nogle gange finder sorgen ikke vej igennem. Den sidder fast som en vedvarende tilstand af uro, tomhed eller smerte. Det kan skyldes at tabet var pludseligt eller traumatisk, at der var uafsluttede forhold, eller at omstændighederne ikke gav rum til at sørge." },
              { titel: "Kroppen bærer sorgen", tekst: "Sorg sidder ikke kun i tankerne. Søvnproblemer, træthed, manglende appetit, tyngde i kroppen - det er normale sorgresponser. Kroppen reagerer på tab som den reagerer på fare, og nervesystemet retter sig ikke automatisk selv." },
            ].map((k) => (
              <div key={k.titel} style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>{k.titel}</h3>
                <p style={{ fontSize: "14px", color: "#4A463F", lineHeight: 1.7 }}>{k.tekst}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: "60px", padding: "32px", background: "#F5F3EE", borderRadius: "10px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "16px" }}>Hvad forskning viser om sorg</h2>
          <p style={{ fontSize: "16px", marginBottom: "12px", lineHeight: 1.7 }}>For de fleste aftager sorgen gradvist, men hos 10–15 pct. af efterladte bliver den vedvarende og invaliderende. Denne tilstand - forlænget sorglidelse - blev anerkendt som selvstændig diagnose i WHO's ICD-11 i 2022. Den kendetegnes ved intens, fastlåst sorg der hindrer livet i at gå videre, typisk mere end 12 måneder efter tabet.</p>
          <p style={{ fontSize: "16px", marginBottom: "12px", lineHeight: 1.7 }}>Hypnoterapi er undersøgt i forhold til angst, depression og søvnproblemer - de tilstande der typisk ledsager fastlåst sorg. Arbejdet med de automatiske emotionelle reaktioner er præcis det nervesystemsarbejde sorgebearbejdning kræver.</p>
          <p style={{ fontSize: "16px", lineHeight: 1.7, color: "#6B675F", fontStyle: "italic" }}>Kilde: WHO ICD-11 (2022) om forlænget sorglidelse, <a href="https://www.sst.dk" target="_blank" rel="noopener" style={{ color: "#5A7049", textDecoration: "underline" }}>Sundhedsstyrelsen.dk</a>.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Hvad hypnoterapi gør ved sorg</h2>
          <p style={{ fontSize: "16px", marginBottom: "16px", maxWidth: "700px", lineHeight: 1.7 }}>Hypnoterapi kan hjælpe der hvor sorgen sidder fast. Ikke ved at fjerne savnet - savnet hører til. Men ved at hjælpe nervesystemet med at bearbejde tabet, så du gradvist finder en bæredygtig måde at leve videre med det på.</p>
          <p style={{ fontSize: "16px", marginBottom: "16px", maxWidth: "700px", lineHeight: 1.7 }}>I den hypnotiske tilstand kan der arbejdes med de dele af sorgen der er for svære at nå i ord - de ting der er uafsluttede, usagte, eller fastlåste som en kropslig reaktion snarere end en tanke. Mange beskriver at der i sessionen åbner sig rum til noget de ikke vidste de bar på.</p>
          <p style={{ fontSize: "16px", lineHeight: 1.7, color: "#6B675F", maxWidth: "700px" }}>Arbejdet fjerner ikke minderne. Det ændrer den fastlåste smerte - så minderne kan være der, uden at de lammer.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Sorg tager mange former</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "700px" }}>
            {[
              { titel: "Tab af en nær person", tekst: "Dødsfald - pludseligt eller forventet - sætter sig forskelligt. Det pludselige tab giver sjældent tid til forberedelse. Det forventede kan have sin egen kompleksitet: lettelse og sorg side om side, skyld over at have levet videre. Begge er naturlige og kan bearbejdes." },
              { titel: "Sorg der aldrig fik lov at sætte sig", tekst: "Mange bærer på sorg der aldrig fik rum: en abort, et misbrug, et svigt der ikke blev anerkendt, en relation der sluttede brat. Sorgen kan sidde i årtier uden at have et navn. Det er stadig sorg - og det kan stadig bearbejdes." },
              { titel: "Tab af det man troede livet ville blive", tekst: "Skilsmisse, infertilitet, alvorlig sygdom, miste sit arbejde. Tab er ikke kun mennesker - det er også drømme, planer og forestillinger om fremtiden. Den slags sorg tages sjældent seriøst af omgivelserne, men den sidder ligeså dybt." },
              { titel: "Sorg og skyld", tekst: "Mange bærer på skyld over det der ikke blev sagt, gjort eller gjort anderledes. Skyld forstærker og fastholder sorgen. Hypnoterapi kan arbejde med begge lag - ikke for at tilgive eller glemme, men for at slippe det der holder dig fast i fortiden." },
            ].map((k) => (
              <div key={k.titel}>
                <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>{k.titel}</h3>
                <p style={{ fontSize: "16px", lineHeight: 1.7, color: "#4A463F", margin: 0 }}>{k.tekst}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Sådan foregår et forløb</h2>
          <p style={{ fontSize: "16px", marginBottom: "16px", maxWidth: "700px", lineHeight: 1.7 }}><strong>Gratis forsamtale (30 min).</strong> Vi taler om hvem eller hvad du har mistet, hvornår det skete, og hvad der er sværest nu. Ingen krav om at gå i detaljer med det smertefulde i denne fase. Her afklares om hypnoterapi er den rette tilgang.</p>
          <p style={{ fontSize: "16px", marginBottom: "16px", maxWidth: "700px", lineHeight: 1.7 }}><strong>Første session (90 min).</strong> En grundig samtale om din sorg og dens karakter, efterfulgt af den første hypnose. Tempoet sættes af dig. Mange oplever en lettelse allerede efter den første session - ikke fordi sorgen er væk, men fordi noget er begyndt at bevæge sig.</p>
          <p style={{ fontSize: "16px", marginBottom: "16px", maxWidth: "700px", lineHeight: 1.7 }}><strong>Opfølgende sessioner (ca. 60 min).</strong> Arbejdet dykker gradvist dybere. Nylig sorg og fastlåst langtidssorg kræver forskelligt antal sessioner. Den gratis forsamtale giver et realistisk billede af hvad der er relevant for dig.</p>
          <p style={{ fontSize: "16px", lineHeight: 1.7, color: "#6B675F", maxWidth: "700px" }}>Sessioner foregår fysisk i Birkerød eller online efter aftale. Se <Link href="/priser" style={{ color: "#5A7049" }}>priser</Link>.</p>
        </section>

        <section style={{ marginBottom: "60px", padding: "28px 32px", background: "#F7F1E8", borderRadius: "10px", border: "1px solid #E6D9C2" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>Når sorgen er mere end sorg</h2>
          <p style={{ fontSize: "16px", lineHeight: 1.7, color: "#4A463F", maxWidth: "700px", margin: 0 }}>Hvis sorgen ledsages af vedvarende håbløshed, tanker om ikke at ville leve, eller manglende evne til at fungere i hverdagen over længere tid, bør du tale med din læge. Det kan være tegn på depression eller forlænget sorglidelse der kræver professionel behandling. Hypnoterapi kan støtte sorgbearbejdning, men erstatter ikke lægelig hjælp ved disse tegn.</p>
        </section>

        <section style={{ marginBottom: "60px", padding: "28px 32px", background: "#F7F1E8", borderRadius: "10px", border: "1px solid #E6D9C2" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>Vigtigt at vide om fastlåst sorg</h2>
          <p style={{ fontSize: "16px", lineHeight: 1.7, color: "#4A463F", maxWidth: "700px", margin: 0 }}>Hvis sorgen står stille i mere end et år, fylder det meste af hverdagen og gør det svært at fungere, kan der være tale om forlænget sorglidelse. Det er en selvstændig diagnose, og den hører til hos egen læge, der kan henvise videre. Det samme gælder ved vedvarende tristhed, hvis du mister lysten til at være her, eller hvis alkohol er blevet en måde at holde det ud på. Hypnoterapi kan være en del af et samlet forløb, men erstatter ikke psykologisk eller psykiatrisk behandling. Jan samarbejder gerne med behandlere i sundhedssystemet.</p>
        </section>

        <section style={{ marginBottom: "48px", padding: "32px", background: "#F5F3EE", borderRadius: "10px", borderLeft: "3px solid #5a7a8f" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>Jan Gaarsdal, hypnoterapeut i Birkerød</h2>
          <p style={{ fontSize: "16px", lineHeight: 1.7, color: "#4A463F", marginBottom: "16px" }}>Jan arbejder med sorg og tab i mange former - nylig sorg, fastlåst langtidssorg, og tab der aldrig fik et navn. Han møder det der er svært med ro og uden at skynde på processen.</p>
          <div style={{ padding: "12px 16px", background: "#E8EBE2", borderRadius: "6px", display: "inline-block" }}>
            <p style={{ fontSize: "14px", fontWeight: 500, color: "#2C2A28", margin: "0 0 8px", lineHeight: 1.7 }}>🎯 Gratis forsamtale, 30 minutter, telefon eller fysisk</p>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <Link href="/kontakt" style={{ fontSize: "14px", color: "#fff", background: "#627A52", textDecoration: "none", fontWeight: 500, padding: "8px 16px", borderRadius: "4px" }}>Book forsamtale →</Link>
              <a href="tel:+4542807474" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", fontWeight: 500, padding: "8px 0" }}>Ring +45 42 80 74 74</a>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "24px" }}>Ofte stillede spørgsmål om sorg og hypnose</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {[
              { q: "Kan hypnose hjælpe mod sorg?", a: "Ja, der hvor sorgen sidder fast. Hypnoterapi fjerner ikke savnet - savnet hører til. Men den hjælper nervesystemet med at bearbejde tabet, så du finder en bæredygtig måde at leve videre med det. Det er særligt relevant ved fastlåst eller kompliceret sorg." },
              { q: "Hvornår er sorg fastlåst?", a: "Når sorgen ikke finder vej igennem, men bliver en vedvarende tilstand af uro, tomhed eller smerte uden bedring over tid. Det ses typisk ved pludselige, traumatiske eller uafsluttede tab - og ved sorg der aldrig fik rum til at blive bearbejdet." },
              { q: "Tager hypnose minderne om den jeg har mistet?", a: "Nej. Hypnoterapi fjerner hverken minder eller kærlighed til den du har mistet. Den arbejder med den fastlåste smerte - så minderne kan være der, og du kan tænke på dem, uden at det lammer dig." },
              { q: "Kan hypnoterapi hjælpe selv om tabet skete for mange år siden?", a: "Ja. Der er ingen tidsgrænse for sorgbearbejdning. Mange søger hjælp til sorg der er årtier gammel og aldrig rigtig fandt vej igennem. Nervesystemet arbejder med det der er, ikke med hvornår det skete." },
              { q: "Kan hypnoterapi hjælpe med sorg og skyld?", a: "Ja. Skyld er en af de mest udbredte og fastholdende komponenter i sorg. Hypnoterapi kan arbejde med begge lag - ikke for at tilgive eller glemme, men for at slippe det der holder dig fast i fortiden og hindrer dig i at leve videre." },
            ].map((item) => (
              <div key={item.q} style={{ borderBottom: "1px solid #eee", paddingBottom: "16px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#2C2A28" }}>{item.q}</h3>
                <p style={{ fontSize: "16px", lineHeight: 1.7, color: "#4A463F" }}>{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 500, color: "#6B675F", marginBottom: "12px" }}>Relaterede emner</h2>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href="/angst" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Angst →</Link>
            <Link href="/ptsd" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>PTSD og traumer →</Link>
            <Link href="/sovn" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Søvnproblemer →</Link>
            <Link href="/kaerlighed" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Kærlighed og relationer →</Link>
            <Link href="/hypnoterapi" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Om hypnoterapi →</Link>
            <Link href="/kontakt" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Kontakt Jan →</Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
