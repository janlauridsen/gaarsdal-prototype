// pages/agteskab.tsx
//
// Selvrefleksionsskema: Hvad savner jeg i mit ægteskab?
// Bruger den genbrugelige RefleksionsSkema-komponent.
//
// SEO: long-tail søgninger som "hvad savner jeg i mit ægteskab",
// "føler mig ikke set af min mand", "vi vil ikke det samme".

import Head from "next/head"
import Link from "next/link"
import Header from "../components/Header"
import Footer from "../components/Footer"
import RefleksionsSkema, { type SkemaCategory } from "../components/RefleksionsSkema"

const categories: SkemaCategory[] = [
  {
    id: "f",
    title: "Følelsesmæssig kontakt",
    questions: [
      "At blive set som mig selv, ikke bare som partner eller forælder",
      "At blive mødt følelsesmæssigt — ikke bare praktisk",
      "At blive lyttet til uden at blive afvist eller overhørt",
      "At mærke varme og nærhed i hverdagen",
    ],
  },
  {
    id: "i",
    title: "Intimitet og tiltrækning",
    questions: [
      "At føle mig ønsket af min partner",
      "At mærke gnist og kemi mellem os",
      "At have et levende sexliv",
      "At føle mig attraktiv i min partners øjne",
    ],
  },
  {
    id: "m",
    title: "Mental og personlig forbindelse",
    questions: [
      "At kunne tale om dybe eller svære ting",
      "At blive udfordret og inspireret",
      "At føle mig interessant — ikke usynlig",
      "At blive spejlet som menneske, ikke bare partner",
    ],
  },
  {
    id: "l",
    title: "Livsenergi og spontanitet",
    questions: [
      "At mærke liv, leg og lethed i vores samvær",
      "At blive overrasket — at der sker noget uventet",
      "At føle mig i live, ikke bare i funktion",
      "At have noget der vækker mig i vores relation",
    ],
  },
  {
    id: "r",
    title: "Respekt og gensidighed",
    questions: [
      "At blive værdsat for hvem jeg er",
      "At blive valgt aktivt — at min partner vælger mig",
      "At mærke at min partner også investerer i os",
      "At føle at vi er to om det — at det ikke kun er mig",
    ],
  },
  {
    id: "p",
    title: "Personlig sandhed",
    questions: [
      "At kunne være ærlig om hvad jeg føler, uden at det skaber konflikt",
      "At kunne sige hvad jeg har brug for",
      "At kunne være mig selv — uden at passe ind i en rolle",
      "At leve et liv der passer til den jeg er blevet",
    ],
  },
]

export default function AgteskabPage() {
  return (
    <>
      <Header />
      <Head>
        <title>Hvad savner jeg i mit ægteskab? Selvrefleksion | Gaarsdal</title>
        <meta
          name="description"
          content="Et selvrefleksionsskema om hvad du savner i dit ægteskab eller parforhold — følelsesmæssig kontakt, intimitet, respekt og personlig sandhed. Gratis og anonymt."
        />
        <link rel="canonical" href="https://gaarsdal.net/agteskab" />
        <meta property="og:title" content="Hvad savner jeg i mit ægteskab? | Gaarsdal" />
        <meta
          property="og:description"
          content="Sæt kryds ved det der rammer dig. Et redskab til selvrefleksion om hvad der mangler — og hvad det kan betyde."
        />
        <meta property="og:image" content="https://gaarsdal.net/Jan-AI.png" />
        <meta property="og:url" content="https://gaarsdal.net/agteskab" />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              name: "Hvad savner jeg i mit ægteskab? Selvrefleksionsskema",
              description:
                "Et interaktivt selvrefleksionsskema til at afklare hvad du savner i dit ægteskab eller parforhold.",
              url: "https://gaarsdal.net/agteskab",
              provider: {
                "@type": "Person",
                name: "Jan Gaarsdal",
                url: "https://gaarsdal.net/om",
                telephone: "+4542807474",
              },
            }),
          }}
        />
      </Head>

      <main
        style={{
          maxWidth: "860px",
          margin: "0 auto",
          padding: "120px 20px 80px",
          fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
          lineHeight: 1.7,
          color: "#333",
        }}
      >
        {/* OVERSKRIFT */}
        <section style={{ marginBottom: "48px" }}>
          <p style={{ fontSize: "13px", color: "#5a7a8f", fontWeight: 500, marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Selvrefleksion
          </p>
          <h1
            style={{
              fontSize: "34px",
              fontWeight: 600,
              lineHeight: 1.25,
              marginBottom: "20px",
              color: "#1a2a35",
            }}
          >
            Hvad savner jeg i mit ægteskab?
          </h1>
          <p style={{ fontSize: "18px", color: "#555", maxWidth: "660px", lineHeight: 1.7 }}>
            Mange mærker at noget mangler, men har svært ved at sætte ord på det. Dette skema hjælper dig med at afklare hvad der fylder — ikke for at bebrejde nogen, men for at forstå dig selv bedre.
          </p>
        </section>

        {/* SKEMA */}
        <RefleksionsSkema
          slug="parforhold"
          title="Hvad savner jeg i mit ægteskab?"
          intro="Sæt kryds ved de udsagn der rammer dig. Det du markerer giver dig et billede af hvad der faktisk savnes — og hvad der måske kan arbejdes med."
          categories={categories}
          ctaLabel="Tal med chatbotten om dine svar →"
        />

        {/* KONTEKST OM JAN */}
        <section
          style={{
            marginTop: "60px",
            marginBottom: "48px",
            padding: "32px",
            background: "#f9fafb",
            borderRadius: "10px",
            borderLeft: "3px solid #5a7a8f",
          }}
        >
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>
            Jan Gaarsdal, hypnoterapeut i Birkerød
          </h2>
          <p style={{ fontSize: "15px", color: "#555", marginBottom: "16px", lineHeight: 1.7 }}>
            Jan arbejder med de mønstre der holder folk fast — i parforholdet, i følelserne og i de ting man ikke har sagt. Han tilbyder individuelle sessioner og en fælles indledende session for par.
          </p>
          <div
            style={{
              padding: "12px 16px",
              background: "#f0f4f8",
              borderRadius: "6px",
              display: "inline-block",
            }}
          >
            <p style={{ fontSize: "14px", fontWeight: 500, color: "#333", margin: "0 0 8px" }}>
              🎯 Gratis forsamtale, 30 minutter, telefon eller fysisk
            </p>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <Link
                href="/kontakt"
                style={{
                  fontSize: "14px",
                  color: "#fff",
                  background: "#5a7a8f",
                  textDecoration: "none",
                  fontWeight: 500,
                  padding: "8px 16px",
                  borderRadius: "4px",
                }}
              >
                Book forsamtale →
              </Link>
              <a
                href="tel:+4542807474"
                style={{
                  fontSize: "14px",
                  color: "#5a7a8f",
                  textDecoration: "none",
                  fontWeight: 500,
                  padding: "8px 0",
                }}
              >
                Ring +45 42 80 74 74
              </a>
            </div>
          </div>
        </section>

        {/* RELATEREDE EMNER */}
        <section style={{ marginBottom: "40px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 500, color: "#888", marginBottom: "12px" }}>
            Relaterede emner
          </h2>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {[
              { href: "/parforhold", label: "Parforhold →" },
              { href: "/kaerlighed", label: "Kærlighed og relationer →" },
              { href: "/selvvaerd", label: "Selvværd →" },
              { href: "/angst", label: "Angst →" },
              { href: "/sorg", label: "Sorg og tab →" },
              { href: "/kontakt", label: "Kontakt Jan →" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  fontSize: "14px",
                  color: "#5a7a8f",
                  textDecoration: "none",
                  padding: "6px 14px",
                  border: "1px solid #5a7a8f",
                  borderRadius: "20px",
                }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
