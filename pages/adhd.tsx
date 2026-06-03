import Head from "next/head"
import Link from "next/link"
import Header from "../components/Header"
import Footer from "../components/Footer"

export default function Page() {
  return (
    <>
      <Header />
      <Head>
        <title>ADHD og hypnoterapi Birkerød | Gaarsdal</title>
        <meta name="description" content="Hypnoterapi kurerer ikke ADHD, men kan hjælpe med uro, stress, søvn og selvværd der ofte følger med. Jan Gaarsdal, Birkerød." />
        <link rel="canonical" href="https://gaarsdal.net/adhd" />
        <meta property="og:title" content="ADHD og hypnoterapi Birkerød | Gaarsdal" />
        <meta property="og:description" content="Hypnoterapi kurerer ikke ADHD, men kan hjælpe med uro, stress, søvn og selvværd der ofte følger med. Jan Gaarsdal, Birkerød." />
        <meta property="og:image" content="https://gaarsdal.net/Jan-AI.png" />
        <meta property="og:url" content="https://gaarsdal.net/adhd" />
        <meta name="robots" content="index, follow" />
      </Head>
      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "120px 20px 80px", fontFamily: "system-ui, -apple-system, sans-serif", lineHeight: 1.7, color: "#333" }}>

        <section style={{ marginBottom: "60px" }}>
          <h1 style={{ fontSize: "34px", fontWeight: 600, lineHeight: 1.25, marginBottom: "20px" }}>ADHD fylder ikke kun i koncentrationen</h1>
          <p style={{ fontSize: "18px", color: "#555", marginBottom: "16px", maxWidth: "660px" }}>Den indre uro der aldrig helt slipper. Tankerne der kører i alle retninger. Søvnen der er svær, og en livslang følelse af at være bagud eller forkert. ADHD handler om mere end koncentration. Det påvirker selvværd, stress, søvn og følelsesregulering.</p>
          <p style={{ fontSize: "16px", color: "#666", maxWidth: "660px" }}>Hypnoterapi kurerer ikke ADHD. Men den kan hjælpe med mange af de ting der følger med, og som ofte fylder lige så meget som kernesymptomerne.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "20px" }}>Hvad der faktisk sker</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
            <div style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Den indre uro</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>Mange med ADHD beskriver en konstant indre uro, en motor der ikke kan slukkes. Det påvirker søvn, stress og evnen til at falde til ro. Hypnoterapi kan arbejde med nervesystemets evne til at finde ro, selvom det ikke ændrer selve ADHD'en.</p>
            </div>
            <div style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Selvværdet efter mange nederlag</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>Et liv med ADHD indebærer ofte gentagne oplevelser af at komme til kort, blive misforstået eller få skæld ud. Det sætter sig som et lavt selvværd og en grundfølelse af at være forkert. Disse overbevisninger kan bearbejdes med hypnoterapi.</p>
            </div>
            <div style={{ padding: "24px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "10px" }}>Stress og overvældelse</h3>
              <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.7 }}>ADHD-hjernen overvældes lettere af indtryk, krav og kaos. Det fører til stress, udmattelse og nogle gange nedlukning. Hypnoterapi kan styrke evnen til at regulere stress og finde ro midt i det.</p>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: "60px", padding: "32px", background: "#f5f7fa", borderRadius: "10px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "16px" }}>Hvad forskning viser</h2>
          <p style={{ fontSize: "15px", marginBottom: "12px" }}>ADHD er en neuroudviklingsmæssig tilstand der kræver udredning og ofte behandling i sundhedssystemet. Forskning peger på at psykologiske og afspændingsbaserede metoder kan hjælpe med de følgevirkninger ADHD ofte medfører, som stress, søvnproblemer og lavt selvværd.</p>
          <p style={{ fontSize: "15px", color: "#666", fontStyle: "italic" }}>Kilde: Sundhedsstyrelsen.dk, ADHD-foreningen.</p>
        </section>

        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Hvad hypnoterapi gør</h2>
          <p style={{ fontSize: "15px", marginBottom: "16px", maxWidth: "700px" }}>Hypnoterapi arbejder ikke med ADHD'en i sig selv, men med det der følger med: den indre uro, stressen, søvnen og selvværdet efter mange nederlag. For mange er det netop disse følgevirkninger der fylder mest i hverdagen.</p>
          <p style={{ fontSize: "15px", color: "#666", maxWidth: "700px" }}>Jan har gode erfaringer med at hjælpe både unge og voksne med ADHD med de udfordringer der ledsager tilstanden. Arbejdet er altid et supplement til, ikke en erstatning for, den behandling man modtager i sundhedssystemet.</p>
        </section>

        <section style={{ marginBottom: "60px", padding: "28px 32px", background: "#fdf6f0", borderRadius: "10px", border: "1px solid #ecd9c6" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>Vigtigt at vide om ADHD</h2>
          <p style={{ fontSize: "15px", color: "#555", maxWidth: "700px", margin: 0 }}>ADHD skal udredes og behandles i sundhedssystemet, typisk via egen læge og psykiatrien. Hypnoterapi er ikke en behandling af ADHD og kan ikke erstatte medicin eller anden behandling. Den kan derimod være et supplement der hjælper med uro, stress, søvn og selvværd. Drøft altid din samlede behandling med din læge.</p>
        </section>

        <section style={{ marginBottom: "48px", padding: "32px", background: "#f9fafb", borderRadius: "10px", borderLeft: "3px solid #5a7a8f" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>Jan Gaarsdal Lauridsen, hypnoterapeut i Birkerød</h2>
          <p style={{ fontSize: "15px", color: "#555", marginBottom: "16px", lineHeight: 1.7 }}>
            Den gratis forsamtale på 30 minutter, telefon eller fysisk, afklarer om hypnoterapi er den rette tilgang for dig.
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
            <Link href="/stress" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Stress</Link>
            <Link href="/sovn" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Søvnproblemer</Link>
            <Link href="/selvvaerd" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Selvværd</Link>
            <Link href="/kontakt" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", padding: "6px 14px", border: "1px solid #5a7a8f", borderRadius: "20px" }}>Kontakt Jan</Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
