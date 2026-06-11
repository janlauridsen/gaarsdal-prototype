import Head from "next/head"
import Link from "next/link"
import Header from "../components/Header"
import Footer from "../components/Footer"

export default function Page() {
  return (
    <>
      <Header />
      <Head>
        <title>Drikker du mere end du vil? Hypnoterapi mod alkohol | Gaarsdal Birkerød</title>
        <meta name="description" content="Drikker du mere end du egentlig ønsker? Hypnoterapi arbejder med behovet bag alkoholen, ikke kun trangen. Diskret og fordomsfrit. Jan Gaarsdal, Birkerød." />
        <link rel="canonical" href="https://gaarsdal.net/alkohol" />
        <meta property="og:title" content="Drikker du mere end du vil? Hypnoterapi mod alkohol | Gaarsdal" />
        <meta property="og:description" content="For mange fylder alkohol mere end de ønsker. Hypnoterapi arbejder med behovet bag, ikke kun trangen. Diskret og fordomsfrit i Birkerød." />
        <meta property="og:image" content="https://gaarsdal.net/Jan-AI.png" />
        <meta property="og:url" content="https://gaarsdal.net/alkohol" />
        <meta name="robots" content="index, follow" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: "{\"@context\": \"https://schema.org\", \"@type\": \"FAQPage\", \"mainEntity\": [{\"@type\": \"Question\", \"name\": \"Er jeg alkoholiker hvis jeg overvejer hjælp?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Nej. De fleste der søger hjælp befinder sig i gråzonen, hvor alkohol fylder mere end de ønsker, men hvor der ikke er tale om egentlig afhængighed. Du behøver ikke sætte en etikette på dig selv for at have ret til at ændre dit forhold til alkohol.\"}}, {\"@type\": \"Question\", \"name\": \"Skal jeg stoppe helt med at drikke?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Ikke nødvendigvis. Målet sættes ud fra hvad du ønsker, om det er at drikke mindre, drikke sjældnere eller holde helt op. Hypnoterapi arbejder med at gøre det valg lettere at holde fast i, uanset hvad du sigter efter.\"}}, {\"@type\": \"Question\", \"name\": \"Jeg ved godt jeg drikker for meget. Hvorfor kan jeg ikke bare stoppe?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Fordi alkoholvanen sjældent sidder i beslutningen, men i det underliggende behov den dækker, ofte stress, uro eller en måde at slappe af på. At vide at man drikker for meget ændrer ikke det behov. Hypnoterapi arbejder netop der hvor vanen og behovet sidder.\"}}, {\"@type\": \"Question\", \"name\": \"Hvad hvis jeg har prøvet at stoppe før uden held?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Det er normalt. Tidligere forsøg slår ofte fejl, fordi de bygger på viljestyrke alene, mens det underliggende behov forbliver uberørt. Hypnoterapi adresserer behovet, så det bliver lettere at fastholde forandringen.\"}}, {\"@type\": \"Question\", \"name\": \"Er hypnose nok, eller skal jeg også have anden hjælp?\", \"acceptedAnswer\": {\"@type\": \"Answer\", \"text\": \"Det afhænger af dit forbrug. Ved egentlig fysisk afhængighed med abstinenser skal du altid starte med din læge eller et misbrugscenter, da afrusning kan kræve lægelig støtte. Hypnoterapi egner sig bedst til gråzonen og som supplement, ikke som erstatning for medicinsk behandling af svær afhængighed.\"}}]}" }}
        />
      </Head>
      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "120px 20px 80px", fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif", lineHeight: 1.7, color: "#333" }}>

        <section style={{ marginBottom: "60px" }}>
          <h1 style={{ fontSize: "34px", fontWeight: 600, lineHeight: 1.25, marginBottom: "20px" }}>Du drikker mere end du egentlig vil</h1>
          <p style={{ fontSize: "18px", color: "#555", marginBottom: "16px", maxWidth: "660px" }}>Et glas bliver til flere. Hverdagsdrik der snigende er blevet en vane. Du har måske besluttet at skære ned, og det holder et stykke tid, men så er du tilbage. Du er ikke nødvendigvis afhængig, men alkohol fylder mere end du ønsker.</p>
          <p style={{ fontSize: "16px", color: "#666", maxWidth: "660px" }}>Det er en af de mest tabubelagte ting at tale om. De fleste søger aldrig hjælp, fordi de hverken føler sig som alkoholikere eller vil i et offentligt system. Men det er præcis i den gråzone, at en tidlig indsats virker bedst.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "20px" }}>Hvad der faktisk sker</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
            <div style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Alkohol dækker ofte et behov</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>For de fleste handler et for stort forbrug ikke om alkoholen i sig selv, men om hvad den gør: dæmper stress, skaber pause, letter uro eller hjælper med at slappe af. Hjernen har lært at alkohol løser noget hurtigt. Den kobling kører automatisk og er stærkere end beslutningen om at lade være.</p>
            </div>
            <div style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Triggere styrer mere end viljen</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>Fyraften, weekend, bestemte sociale situationer, en bestemt følelse. Hjernen har koblet disse triggere direkte til alkohol. Det er ikke et bevidst valg i øjeblikket, men en automatisk reaktion. Det forklarer hvorfor det går godt i en periode og så glider tilbage.</p>
            </div>
            <div style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Skam og tabu holder folk fast</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>Alkohol er stadig så tabubelagt at mange aldrig søger hjælp. De føler sig hverken som alkoholikere eller vil i offentligt system. Skammen gør problemet usynligt og ensomt, og det forhindrer netop den hjælp der kunne bryde mønsteret tidligt.</p>
            </div>
          </div>
        </section>

        {/* INDSIGT ER IKKE NOK */}
        <section style={{ marginBottom: "60px", padding: "28px 32px", background: "#f0f4f8", borderRadius: "10px", borderLeft: "3px solid #5a7a8f" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>Indsigt er ikke det samme som forandring</h2>
          <p style={{ fontSize: "15px", color: "#555", maxWidth: "700px", margin: 0 }}>Du ved godt at du drikker for meget. Du har måske endda regnet på genstandene og lovet dig selv at skære ned. Men det ændrer sjældent noget, for vanen sidder ikke i det du ved, men i det behov alkoholen dækker, og i de automatiske reaktioner der udløses af bestemte triggere. Det er der hypnoterapi arbejder.</p>
        </section>

        <section style={{ marginBottom: "60px", padding: "32px", background: "#f5f7fa", borderRadius: "10px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "16px" }}>Hvad forskning viser</h2>
          <p style={{ fontSize: "15px", marginBottom: "12px" }}>Sundhedsstyrelsen vurderer at omkring hver tiende dansker drikker mere end de anbefalede grænser. Anbefalingen er højst 10 genstande om ugen og højst 4 på en dag. Studier i blandt andet American Journal of Clinical Hypnosis peger på at hypnoterapi kan være et effektivt redskab til at ændre alkoholvaner, særligt når det underliggende behov adresseres.</p>
          <p style={{ fontSize: "15px", color: "#666", fontStyle: "italic" }}>Kilde: <a href="https://www.sst.dk" target="_blank" rel="noopener" style={{ color: "#5a7a8f", textDecoration: "underline" }}>Sundhedsstyrelsen.dk</a>, American Journal of Clinical Hypnosis.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Hvad hypnoterapi gør</h2>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>Hypnoterapi arbejder med det behov alkoholen dækker, og med de automatiske koblinger mellem triggere og trang. Ikke med viljestyrke. Når behovet mødes på en anden måde, og koblingerne afkobles, bliver det lettere at træffe og fastholde det valg du egentlig ønsker.</p>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>Forløbet er diskret og fordomsfrit. Målet sætter du selv, om det er at drikke mindre, drikke sjældnere eller holde helt op.</p>
        </section>

        {/* VIGTIG AFGRÆNSNING */}
        <section style={{ marginBottom: "60px", padding: "28px 32px", background: "#fdf6f0", borderRadius: "10px", border: "1px solid #ecd9c6" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>Vigtigt at vide om svær afhængighed</h2>
          <p style={{ fontSize: "15px", color: "#555", maxWidth: "700px", margin: 0 }}>Hypnoterapi egner sig til gråzonen og til at ændre et forbrug der er ved at tage overhånd. Ved egentlig fysisk afhængighed, hvor du oplever abstinenser som rysten, sved, hjertebanken eller uro når du ikke drikker, skal du altid starte hos din læge eller et misbrugscenter. Afrusning kan kræve lægelig støtte og kan være farlig at gennemføre alene. I de tilfælde er hypnoterapi et supplement, ikke en erstatning.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "24px" }}>Ofte stillede spørgsmål</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ borderBottom: "1px solid #eee", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#333" }}>Er jeg alkoholiker hvis jeg overvejer hjælp?</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7 }}>Nej. De fleste der søger hjælp befinder sig i gråzonen, hvor alkohol fylder mere end de ønsker, men hvor der ikke er tale om egentlig afhængighed. Du behøver ikke sætte en etikette på dig selv for at have ret til at ændre dit forhold til alkohol.</p>
            </div>
            <div style={{ borderBottom: "1px solid #eee", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#333" }}>Skal jeg stoppe helt med at drikke?</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7 }}>Ikke nødvendigvis. Målet sættes ud fra hvad du ønsker, om det er at drikke mindre, drikke sjældnere eller holde helt op. Hypnoterapi arbejder med at gøre det valg lettere at holde fast i, uanset hvad du sigter efter.</p>
            </div>
            <div style={{ borderBottom: "1px solid #eee", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#333" }}>Jeg ved godt jeg drikker for meget. Hvorfor kan jeg ikke bare stoppe?</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7 }}>Fordi alkoholvanen sjældent sidder i beslutningen, men i det underliggende behov den dækker, ofte stress, uro eller en måde at slappe af på. At vide at man drikker for meget ændrer ikke det behov. Hypnoterapi arbejder netop der hvor vanen og behovet sidder.</p>
            </div>
            <div style={{ borderBottom: "1px solid #eee", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#333" }}>Hvad hvis jeg har prøvet at stoppe før uden held?</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7 }}>Det er normalt. Tidligere forsøg slår ofte fejl, fordi de bygger på viljestyrke alene, mens det underliggende behov forbliver uberørt. Hypnoterapi adresserer behovet, så det bliver lettere at fastholde forandringen.</p>
            </div>
            <div style={{ borderBottom: "1px solid #eee", paddingBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "#333" }}>Er hypnose nok, eller skal jeg også have anden hjælp?</h3>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7 }}>Det afhænger af dit forbrug. Ved egentlig fysisk afhængighed med abstinenser skal du altid starte med din læge eller et misbrugscenter, da afrusning kan kræve lægelig støtte. Hypnoterapi egner sig bedst til gråzonen og som supplement, ikke som erstatning for medicinsk behandling af svær afhængighed.</p>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: "48px", padding: "32px", background: "#f9fafb", borderRadius: "10px", borderLeft: "3px solid #5a7a8f" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>Jan Gaarsdal, hypnoterapeut i Birkerød</h2>
          <p style={{ fontSize: "15px", color: "#555", marginBottom: "16px", lineHeight: 1.7 }}>
            Jan arbejder diskret og fordomsfrit med mennesker der ønsker at ændre deres forhold til alkohol. Den gratis forsamtale på 30 minutter, telefon eller fysisk, afklarer om hypnoterapi er den rette tilgang for dig.
          </p>
          <div style={{ padding: "12px 16px", background: "#f0f4f8", borderRadius: "6px", display: "inline-block" }}>
            <p style={{ fontSize: "14px", fontWeight: 500, color: "#333", margin: "0 0 8px" }}>🎯 Gratis forsamtale, 30 minutter, telefon eller fysisk</p>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <Link href="/kontakt" style={{ fontSize: "14px", color: "#fff", background: "#5a7a8f", textDecoration: "none", fontWeight: 500, padding: "8px 16px", borderRadius: "4px" }}>Book forsamtale</Link>
              <a href="tel:+4542807474" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", fontWeight: 500, padding: "8px 0" }}>Ring +45 42 80 74 74</a>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 500, color: "#888", marginBottom: "12px" }}>Relaterede emner</h2>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href="/vaner" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Vaner</Link>
            <Link href="/stress" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Stress</Link>
            <Link href="/rygestop" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Rygestop</Link>
            <Link href="/kontakt" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Kontakt Jan</Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
