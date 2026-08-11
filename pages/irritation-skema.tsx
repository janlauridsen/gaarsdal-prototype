// pages/irritation-skema.tsx
//
// Refleksionsskema om irritabilitet. Bruger den genbrugelige RefleksionsSkema-komponent.

import Head from "next/head"
import Link from "next/link"
import Header from "../components/Header"
import Footer from "../components/Footer"
import RefleksionsSkema, { type SkemaCategory } from "../components/RefleksionsSkema"

const categories: SkemaCategory[] = [
  {
    id: "s",
    title: "Søvn og hvile",
    questions: [
      "Efter en dårlig nat kan jeg mærke det med det samme - så kan jeg næsten ikke holde noget ud",
      "Jeg føler mig drænet, selvom jeg ikke har lavet noget fysisk",
      "Jeg vågner uden at føle mig udhvilet",
      "Jeg kan godt have fri, men jeg føler ikke rigtig, at jeg har fri",
    ],
  },
  {
    id: "p",
    title: "Pres over længere tid",
    questions: [
      "Jeg har egentlig ikke mere at lave end tidligere, men føler mig alligevel konstant presset",
      "Jeg føler mig på en eller anden måde altid på",
      "Jeg plejer at kunne klare rigtig meget - derfor forstår jeg ikke, hvad der er sket",
      "Jeg kan mærke, at jeg ikke er den samme som tidligere",
    ],
  },
  {
    id: "i",
    title: "Indtryk og afbrydelser",
    questions: [
      "Jeg bliver helt vildt irriteret, hvis nogen afbryder mig",
      "Når telefonen ringer, kan jeg mærke irritationen med det samme",
      "Jeg tjekker hele tiden telefonen - jeg bliver træt af det, men kan ikke lade være",
      "Jeg føler, at mit hoved hele tiden skal forholde sig til noget nyt",
      "Støj, mennesker og mange indtryk påvirker mig meget mere end tidligere",
    ],
  },
  {
    id: "r",
    title: "Relationer og overskud",
    questions: [
      "Jeg snerrer ad min partner over de mindste ting",
      "Jeg bliver hurtigt irriteret på børnene - ikke fordi de gør noget særligt",
      "Når dagen er slut, har jeg ikke lyst til at tale med nogen",
      "Jeg elsker min familie, men nogle gange har jeg bare ikke mere at give af",
      "Jeg føler, at alle vil have noget fra mig",
    ],
  },
  {
    id: "e",
    title: "Efter reaktionen",
    questions: [
      "Jeg kan godt se, at jeg overreagerer, mens jeg gør det",
      "Jeg bliver ked af det bagefter, fordi jeg ikke ønsker at være sådan",
      "Jeg siger undskyld, lover mig selv at gøre det anderledes - og så sker det igen",
      "Jeg tænker, at jeg burde kunne styre det bedre",
    ],
  },
  {
    id: "k",
    title: "Krop og forandring",
    questions: [
      "Det er kommet snigende inden for det seneste år",
      "Det svinger i perioder, uden at jeg kan pege på hvorfor",
      "Jeg har brug for at være alene, men får dårlig samvittighed over det",
      "Jeg savner egentlig bare at kunne være i ro",
    ],
  },
]

export default function Page() {
  return (
    <>
      <Header />
      <Head>
        <title>Hvorfor har jeg så kort lunte? Refleksionsskema | Gaarsdal</title>
        <meta name="description" content="Irritabilitet er sjældent problemet i sig selv. Sæt kryds ved det du genkender, og få et billede af hvad der ligger under. Gaarsdal, Birkerød." />
        <link rel="canonical" href="https://gaarsdal.net/irritation-skema" />
        <meta property="og:title" content="Hvorfor har jeg så kort lunte? Refleksionsskema | Gaarsdal" />
        <meta property="og:description" content="Sæt kryds ved det du genkender, og få et billede af hvad der ligger under irritabiliteten." />
        <meta property="og:image" content="https://gaarsdal.net/og-jan-gaarsdal.jpg" />
        <meta property="og:url" content="https://gaarsdal.net/irritation-skema" />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({"@context": "https://schema.org", "@type": "WebPage", "name": "Refleksionsskema: Hvorfor har jeg så kort lunte?", "description": "Et skema der hjælper dig med at få øje på, hvad der ligger under irritabiliteten. Gaarsdal Hypnoterapi, Birkerød.", "url": "https://gaarsdal.net/irritation-skema", "provider": {"@type": "Person", "name": "Jan Gaarsdal", "url": "https://gaarsdal.net/om", "telephone": "+4542807474"}}) }} />
      </Head>

      <main style={{ maxWidth: "860px", margin: "0 auto", padding: "120px 20px 80px", fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif", lineHeight: 1.7, color: "#2C2A28" }}>

        <section style={{ marginBottom: "48px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 600, lineHeight: 1.3, letterSpacing: "-0.01em", marginBottom: "20px" }}>Hvorfor har jeg så kort lunte?</h1>
          <p style={{ fontSize: "19px", lineHeight: 1.65, color: "#4A463F", marginBottom: "18px", maxWidth: "700px" }}>Irritabilitet er sjældent problemet i sig selv. Den er som regel det første synlige tegn på noget andet - og det er svært at få øje på indefra, netop fordi man er midt i det.</p>
          <p style={{ fontSize: "17px", lineHeight: 1.7, color: "#4A463F", maxWidth: "700px" }}>Skemaet her er ikke en test, og det stiller ingen diagnose. Det er en måde at få det, du allerede fornemmer, gjort konkret nok til at kunne handle på.</p>
        </section>

        <RefleksionsSkema
          slug="irritation"
          title="Hvorfor har jeg så kort lunte?"
          intro="Sæt kryds ved de udsagn du genkender. Det du markerer giver et billede af, hvad der trækker på dit overskud - og hvor det er værd at begynde."
          categories={categories}
          ctaLabel="Tal med chatbotten om dine svar →"
        />

        <section style={{ marginTop: "60px", marginBottom: "48px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Hvad markeringerne kan pege på</h2>
          <p style={{ fontSize: "16px", color: "#6B675F", marginBottom: "20px", maxWidth: "700px", lineHeight: 1.7 }}>Fylder ét område mere end de andre, er det ofte dér, det er værd at starte. Fylder flere lige meget, er det som regel et tegn på, at det er overskuddet i sig selv der er brugt.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
            <div style={{ padding: "20px 24px", background: "#F5F3EE", borderRadius: "10px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Mest under søvn og hvile</h3>
              <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7, margin: "0 0 8px" }}>Søvn er den hyppigste enkeltårsag til kort lunte, og den mest oversete.</p>
              <Link href="/sovn" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", fontWeight: 500 }}>Læs om søvnproblemer →</Link>
            </div>
            <div style={{ padding: "20px 24px", background: "#F5F3EE", borderRadius: "10px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Mest under pres over længere tid</h3>
              <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7, margin: "0 0 8px" }}>Har nervesystemet stået i beredskab længe, er irritabilitet ofte det første tegn.</p>
              <Link href="/stress" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", fontWeight: 500 }}>Læs om stress →</Link>
            </div>
            <div style={{ padding: "20px 24px", background: "#F5F3EE", borderRadius: "10px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Mest under indtryk og afbrydelser</h3>
              <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7, margin: "0 0 8px" }}>Når hovedet hele tiden skal forholde sig til noget nyt, er der ikke overskud tilbage til tålmodighed.</p>
              <Link href="/digital-udbraendthed" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", fontWeight: 500 }}>Læs om digital udbrændthed →</Link>
            </div>
            <div style={{ padding: "20px 24px", background: "#F5F3EE", borderRadius: "10px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Kommet snigende, svinger i perioder</h3>
              <p style={{ fontSize: "16px", color: "#4A463F", lineHeight: 1.7, margin: "0 0 8px" }}>Hormonelle forandringer overses ofte, fordi de opleves som en personlighedsændring.</p>
              <Link href="/overgangsalder" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", fontWeight: 500 }}>Læs om overgangsalder →</Link>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: "60px", padding: "28px 32px", background: "#F7F1E8", borderRadius: "10px", border: "1px solid #E6D9C2" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>Vigtigt at vide</h2>
          <p style={{ fontSize: "16px", color: "#4A463F", maxWidth: "700px", margin: 0, lineHeight: 1.7 }}>Skemaet er ikke en test og stiller ingen diagnose. Vedvarende irritabilitet kan også være tegn på depression, stofskiftesygdom, blodmangel eller søvnapnø - og hos mænd viser depression sig oftere som irritabilitet end som tristhed. Har det stået på i måneder, eller følges det af manglende glæde ved det du plejer, så tal med din egen læge. Er der vold eller frygt i hjemmet, hører det til hos læge eller relevant rådgivning med det samme.</p>
        </section>

        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 500, color: "#6B675F", marginBottom: "12px" }}>Relaterede emner</h2>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link href="/irritation" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", padding: "6px 14px", border: "1px solid #5A7049", borderRadius: "20px" }}>Irritabilitet og kort lunte →</Link>
            <Link href="/digital-udbraendthed" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", padding: "6px 14px", border: "1px solid #5A7049", borderRadius: "20px" }}>Digital udbrændthed →</Link>
            <Link href="/stress" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", padding: "6px 14px", border: "1px solid #5A7049", borderRadius: "20px" }}>Stress →</Link>
            <Link href="/sovn" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", padding: "6px 14px", border: "1px solid #5A7049", borderRadius: "20px" }}>Søvnproblemer →</Link>
            <Link href="/kontakt" style={{ fontSize: "14px", color: "#5A7049", textDecoration: "none", padding: "6px 14px", border: "1px solid #5A7049", borderRadius: "20px" }}>Kontakt →</Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
