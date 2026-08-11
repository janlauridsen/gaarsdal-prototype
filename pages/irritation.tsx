import Head from "next/head"
import Link from "next/link"
import Header from "../components/Header"
import Footer from "../components/Footer"

export default function Page() {
  return (
    <>
      <Header />
      <Head>
        <title>Irritabilitet og kort lunte, hypnoterapi | Gaarsdal</title>
        <meta name="description" content="Ikke mere vrede, men mindre overskud til at være tolerant. Kort lunte, afbrydelser der fylder for meget, undskyldninger bagefter. Jan Gaarsdal, Birkerød." />
        <link rel="canonical" href="https://gaarsdal.net/irritation" />
        <meta property="og:title" content="Irritabilitet og kort lunte, hypnoterapi | Gaarsdal" />
        <meta property="og:description" content="Ikke mere vrede, men mindre overskud til at være tolerant. Hypnoterapi i Birkerød ved irritabilitet og kort lunte." />
        <meta property="og:image" content="https://gaarsdal.net/og-jan-gaarsdal.jpg" />
        <meta property="og:url" content="https://gaarsdal.net/irritation" />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({"@context": "https://schema.org", "@type": "MedicalWebPage", "name": "Irritabilitet og kort lunte", "description": "Ikke mere vrede, men mindre overskud til at være tolerant. Hypnoterapi i Birkerød ved irritabilitet og kort lunte.", "url": "https://gaarsdal.net/irritation", "provider": {"@type": "Person", "name": "Jan Gaarsdal", "url": "https://gaarsdal.net/om", "telephone": "+4542807474"}}) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": "Er det ikke bare stress?", "acceptedAnswer": {"@type": "Answer", "text": "Ofte hænger de sammen, men irritabilitet kan også stå alene. Man kan have kort lunte uden at føle sig presset af opgaver, og man kan være presset uden at blive irritabel. Det der kendetegner irritabilitet er ikke mængden af krav, men at tolerancen er blevet mindre end den plejer."}}, {"@type": "Question", "name": "Hvorfor kan jeg ikke bare tage mig sammen?", "acceptedAnswer": {"@type": "Answer", "text": "Fordi det ikke er et spørgsmål om vilje. Tolerance er ikke noget man beslutter sig for - det er noget der er der, når nervesystemet har overskud, og som forsvinder når det ikke har. Derfor virker gode forsætter i to dage og holder sjældent længere."}}, {"@type": "Question", "name": "Betyder det, at jeg er en dårlig forælder eller partner?", "acceptedAnswer": {"@type": "Answer", "text": "Nej. Mange beskriver netop, at de kan se sig selv overreagere mens det sker, og bliver kede af det bagefter. Den erkendelse er ikke et tegn på at man ikke bryder sig om sine nærmeste - den er et tegn på, at reaktionen kommer et andet sted fra end fra ens holdning til dem."}}, {"@type": "Question", "name": "Skal jeg finde ud af årsagen først?", "acceptedAnswer": {"@type": "Answer", "text": "Ikke nødvendigvis alene. Irritabilitet er som regel nedstrøms for noget andet - dårlig søvn, vedvarende pres, for mange indtryk, hormonelle forandringer eller vanskeligheder med at holde fokus. Forsamtalen bruges blandt andet til at få øje på hvad der ligger under hos netop dig."}}]}) }} />
      </Head>

      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "120px 20px 80px", fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif", lineHeight: 1.7, color: "#2C2A28" }}>

        <section style={{ marginBottom: "60px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 600, lineHeight: 1.3, letterSpacing: "-0.01em", marginBottom: "20px" }}>Det er ikke mere vrede. Det er mindre overskud</h1>
          <p style={{ fontSize: "19px", lineHeight: 1.65, color: "#4A463F", marginBottom: "18px", maxWidth: "700px" }}>Du er blevet irriteret over ting, du normalt ville lade passere. Et spørgsmål, en afbrydelse, telefonen der ringer. Der skal næsten ingenting til, og bagefter tænker du: hvorfor reagerede jeg sådan?</p>
          <p style={{ fontSize: "17px", lineHeight: 1.7, color: "#4A463F", maxWidth: "700px" }}>Du har ikke fået mere vrede. Du har fået mindre overskud til at være tolerant. Det er en vigtig forskel, for tolerance er ikke noget man beslutter sig for - det er noget der er der, når nervesystemet har plads, og som forsvinder når det ikke har.</p>
        </section>

        <section style={{ marginBottom: "60px", padding: "24px 28px", background: "#E8EBE2", borderRadius: "10px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>Er du i tvivl om hvad der ligger under?</h2>
          <p style={{ fontSize: "16px", color: "#4A463F", maxWidth: "700px", marginBottom: "14px", lineHeight: 1.7 }}>Sæt kryds ved det du genkender, og få et billede af hvad der trækker på dit overskud.</p>
          <Link href="/irritation-skema" style={{ fontSize: "15px", color: "#fff", background: "#627A52", textDecoration: "none", fontWeight: 500, padding: "10px 18px", borderRadius: "6px", display: "inline-block" }}>Prøv refleksionsskemaet →</Link>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "20px" }}>Hvad der sker</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
            <div style={{ padding: "24px", background: "#fff", border: "1px solid #E3DFD5", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Tolerance er en kapacitet</h3>
              <p style={{ fontSize: "14px", color: "#4A463F", lineHeight: 1.7 }}>Evnen til at lade noget passere kræver overskud. Er overskuddet brugt, forsvinder tolerancen først - længe før man selv opdager, at man er belastet.</p>
            </div>
            <div style={{ padding: "24px", background: "#fff", border: "1px solid #E3DFD5", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Reaktionen kommer før tanken</h3>
              <p style={{ fontSize: "14px", color: "#4A463F", lineHeight: 1.7 }}>Derfor kan man se sig selv overreagere midt i det. Man er ikke uenig i sin egen vurdering - reaktionen er bare hurtigere end den.</p>
            </div>
            <div style={{ padding: "24px", background: "#fff", border: "1px solid #E3DFD5", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Gode forsætter holder to dage</h3>
              <p style={{ fontSize: "14px", color: "#4A463F", lineHeight: 1.7 }}>Man tager sig sammen, og det virker et stykke tid. Så bliver man træt, og det er tilbage. Viljen er ikke problemet - den er bare ikke dét, der styrer.</p>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Sådan viser det sig</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "700px" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Der skal næsten ingenting til</h3>
              <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7, margin: 0 }}>Små spørgsmål, en afbrydelse eller en ringende telefon udløser en reaktion, der er større end anledningen.</p>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Det går ud over de nærmeste</h3>
              <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7, margin: 0 }}>Man snerrer ad sin partner eller bliver hurtigt irriteret på børnene - ikke fordi de gør noget særligt, men fordi der ikke er mere at rumme med.</p>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Man kan se det, mens det sker</h3>
              <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7, margin: 0 }}>Mange beskriver, at det værste er at kunne se sig selv overreagere midt i det, uden at kunne stoppe det.</p>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Undskyldningen og løftet</h3>
              <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7, margin: 0 }}>Man siger undskyld, lover sig selv at gøre det anderledes næste gang - og så sker det igen. Det er ikke manglende vilje. Det er at viljen ikke er dét, der styrer.</p>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Lyst til at være i fred</h3>
              <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7, margin: 0 }}>Man har mest lyst til, at folk lader en være. Og får dårlig samvittighed over at have det sådan.</p>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Indtryk fylder mere end før</h3>
              <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7, margin: 0 }}>Støj, mennesker og mange indtryk påvirker mere, end de plejede. Tolerancen føles simpelthen mindre.</p>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Drænet uden at have lavet noget</h3>
              <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7, margin: 0 }}>En tung fornemmelse, selvom der ikke har været fysisk aktivitet.</p>
            </div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Fornemmelsen af ikke at være sig selv</h3>
              <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7, margin: 0 }}>Man plejer ellers at kunne klare meget, og forstår ikke helt hvad der er sket.</p>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "8px" }}>Hvad ligger som regel under</h2>
          <p style={{ fontSize: "16px", color: "#6B675F", marginBottom: "20px", maxWidth: "700px", lineHeight: 1.7 }}>Irritabilitet er sjældent problemet i sig selv. Den er som regel det første synlige tegn på noget andet. Her er det, der oftest viser sig at ligge under.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
            <div style={{ padding: "20px 24px", background: "#F5F3EE", borderRadius: "10px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Søvn</h3>
              <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7, margin: "0 0 8px" }}>Efter en dårlig nat kan tolerancen være væk allerede fra morgenstunden. Søvn er den hyppigste enkeltårsag, og den mest oversete.</p>
              <Link href="/sovn" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", fontWeight: 500 }}>Læs om søvn →</Link>
            </div>
            <div style={{ padding: "20px 24px", background: "#F5F3EE", borderRadius: "10px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Vedvarende pres</h3>
              <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7, margin: "0 0 8px" }}>Når nervesystemet har stået i beredskab længe nok, bliver irritabilitet ofte det første synlige tegn - før træthed og før uro.</p>
              <Link href="/stress" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", fontWeight: 500 }}>Læs om vedvarende pres →</Link>
            </div>
            <div style={{ padding: "20px 24px", background: "#F5F3EE", borderRadius: "10px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>For mange indtryk</h3>
              <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7, margin: "0 0 8px" }}>Beskeder, notifikationer og konstante skift. Når hovedet hele tiden skal forholde sig til noget nyt, er der ikke overskud tilbage til at være tålmodig.</p>
              <Link href="/digital-udbraendthed" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", fontWeight: 500 }}>Læs om for mange indtryk →</Link>
            </div>
            <div style={{ padding: "20px 24px", background: "#F5F3EE", borderRadius: "10px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Hormonelle forandringer</h3>
              <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7, margin: "0 0 8px" }}>Irritabilitet er et velkendt og undervurderet træk ved overgangsalderen, og opleves ofte som en personlighedsændring frem for som en fysisk forandring.</p>
              <Link href="/overgangsalder" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", fontWeight: 500 }}>Læs om hormonelle forandringer →</Link>
            </div>
            <div style={{ padding: "20px 24px", background: "#F5F3EE", borderRadius: "10px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Vanskeligt ved at holde fokus</h3>
              <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7, margin: "0 0 8px" }}>Afbrydelser koster mere, når det i forvejen kræver noget at holde tråden. Derfor rammer forstyrrelser hårdere.</p>
              <Link href="/adhd" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", fontWeight: 500 }}>Læs om vanskeligt ved at holde fokus →</Link>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Hvad hypnoterapi gør</h2>
          <p style={{ fontSize: "16px", marginBottom: "16px", maxWidth: "700px", lineHeight: 1.7 }}>Hypnoterapi arbejder med nervesystemets grundindstilling frem for med selve reaktionerne. Målet er ikke at du bliver bedre til at styre dig, men at der er mere at rumme med, så du ikke skal styre dig.</p>
          <p style={{ fontSize: "16px", marginBottom: "16px", maxWidth: "700px", lineHeight: 1.7 }}>I hypnose oplever kroppen en tilstand af reel ro. Det er den tilstand, nervesystemet skal lære at finde tilbage til af sig selv - også når der bliver spurgt om noget, afbrudt eller ringet.</p>
          <p style={{ fontSize: "16px", color: "#6B675F", maxWidth: "700px", lineHeight: 1.7 }}>Viser det sig undervejs, at irritabiliteten primært skyldes søvn, vedvarende pres eller for mange indtryk, arbejdes der med dét frem for med symptomet.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Sådan foregår et forløb</h2>
          <p style={{ fontSize: "16px", marginBottom: "16px", maxWidth: "700px", lineHeight: 1.7 }}><strong>Gratis forsamtale (30 minutter).</strong> Vi taler om hvornår det begyndte, hvornår det er værst, og hvad du har prøvet. Du finder ud af om hypnoterapi giver mening for dig.</p>
          <p style={{ fontSize: "16px", marginBottom: "16px", maxWidth: "700px", lineHeight: 1.7 }}><strong>Første session (90 minutter).</strong> Vi ser på hvad der typisk udløser det, og hvad der sker i kroppen lige inden reaktionen kommer.</p>
          <p style={{ fontSize: "16px", marginBottom: "16px", maxWidth: "700px", lineHeight: 1.7 }}><strong>Opfølgende sessioner (60 minutter).</strong> Antallet afhænger af hvor længe det har stået på, og af hvad der ligger under.</p>
          <p style={{ fontSize: "16px", color: "#6B675F", maxWidth: "700px", lineHeight: 1.7 }}>Sessioner foregår fysisk i Birkerød eller online efter aftale. Se <Link href="/priser" style={{ color: "#5A7049" }}>priser</Link>.</p>
        </section>

        <section style={{ marginBottom: "60px", padding: "28px 32px", background: "#F7F1E8", borderRadius: "10px", border: "1px solid #E6D9C2" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>Vigtigt at vide</h2>
          <p style={{ fontSize: "16px", color: "#4A463F", maxWidth: "700px", margin: 0, lineHeight: 1.7 }}>Vedvarende irritabilitet kan også være et tegn på depression, stofskiftesygdom, blodmangel eller søvnapnø - og hos mænd viser depression sig oftere som irritabilitet end som tristhed. Har det stået på i måneder, følges det af manglende glæde ved det du plejer, eller er du bekymret for at det går ud over dine nærmeste, så tal med din egen læge. Er der vold eller frygt i hjemmet, hører det til hos læge eller relevant rådgivning med det samme, ikke hos en hypnoterapeut.</p>
        </section>

        <section style={{ marginBottom: "48px", padding: "32px", background: "#F5F3EE", borderRadius: "10px", borderLeft: "3px solid #5A7049" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>Jan Gaarsdal, hypnoterapeut i Birkerød</h2>
          <p style={{ fontSize: "16px", color: "#4A463F", marginBottom: "16px", lineHeight: 1.7 }}>
            Jan arbejder med dette område hos voksne og unge. Den gratis forsamtale på 30 minutter afklarer om hypnoterapi giver mening for dig.
          </p>
          <div style={{ padding: "12px 16px", background: "#E8EBE2", borderRadius: "6px", display: "inline-block" }}>
            <p style={{ fontSize: "14px", fontWeight: 500, color: "#2C2A28", margin: "0 0 8px", lineHeight: 1.7 }}>
              🎯 Gratis forsamtale, 30 minutter, telefon eller fysisk
            </p>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <Link href="/irritation-skema" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", padding: "6px 14px", border: "1px solid #5A7049", borderRadius: "20px" }}>Skema: kort lunte →</Link>
              <Link href="/kontakt" style={{ fontSize: "14px", color: "#fff", background: "#627A52", textDecoration: "none", fontWeight: 500, padding: "8px 16px", borderRadius: "6px" }}>
                Book forsamtale
              </Link>
              <a href="tel:+4542807474" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", fontWeight: 500, padding: "8px 0" }}>
                Ring +45 42 80 74 74
              </a>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "24px" }}>Ofte stillede spørgsmål</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ borderBottom: "1px solid #E3DFD5", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#2C2A28" }}>Er det ikke bare stress?</h3>
              <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7 }}>Ofte hænger de sammen, men irritabilitet kan også stå alene. Man kan have kort lunte uden at føle sig presset af opgaver, og man kan være presset uden at blive irritabel. Det der kendetegner irritabilitet er ikke mængden af krav, men at tolerancen er blevet mindre end den plejer.</p>
            </div>
            <div style={{ borderBottom: "1px solid #E3DFD5", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#2C2A28" }}>Hvorfor kan jeg ikke bare tage mig sammen?</h3>
              <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7 }}>Fordi det ikke er et spørgsmål om vilje. Tolerance er ikke noget man beslutter sig for - det er noget der er der, når nervesystemet har overskud, og som forsvinder når det ikke har. Derfor virker gode forsætter i to dage og holder sjældent længere.</p>
            </div>
            <div style={{ borderBottom: "1px solid #E3DFD5", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#2C2A28" }}>Betyder det, at jeg er en dårlig forælder eller partner?</h3>
              <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7 }}>Nej. Mange beskriver netop, at de kan se sig selv overreagere mens det sker, og bliver kede af det bagefter. Den erkendelse er ikke et tegn på at man ikke bryder sig om sine nærmeste - den er et tegn på, at reaktionen kommer et andet sted fra end fra ens holdning til dem.</p>
            </div>
            <div style={{ borderBottom: "1px solid #E3DFD5", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#2C2A28" }}>Skal jeg finde ud af årsagen først?</h3>
              <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7 }}>Ikke nødvendigvis alene. Irritabilitet er som regel nedstrøms for noget andet - dårlig søvn, vedvarende pres, for mange indtryk, hormonelle forandringer eller vanskeligheder med at holde fokus. Forsamtalen bruges blandt andet til at få øje på hvad der ligger under hos netop dig.</p>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 500, color: "#6B675F", marginBottom: "12px" }}>Relaterede emner</h2>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href="/digital-udbraendthed" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", padding: "6px 14px", border: "1px solid #5A7049", borderRadius: "20px" }}>Digital udbrændthed →</Link>
            <Link href="/stress" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", padding: "6px 14px", border: "1px solid #5A7049", borderRadius: "20px" }}>Stress →</Link>
            <Link href="/sovn" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", padding: "6px 14px", border: "1px solid #5A7049", borderRadius: "20px" }}>Søvnproblemer →</Link>
            <Link href="/overgangsalder" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", padding: "6px 14px", border: "1px solid #5A7049", borderRadius: "20px" }}>Overgangsalder →</Link>
            <Link href="/kontakt" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", padding: "6px 14px", border: "1px solid #5A7049", borderRadius: "20px" }}>Kontakt →</Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
