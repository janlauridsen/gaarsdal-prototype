import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import Header from "../components/Header";
import Footer from "../components/Footer";

const Chatbot = dynamic(() => import("../components/Chatbot"), { ssr: false });

export default function Home() {
  return (
    <div className="bg-bg text-text min-h-screen">
      <Head>
        <title>
          Hypnoterapi i Birkerød – ro, klarhed og ændringer der holder | Gaarsdal
        </title>
        <meta
          name="description"
          content="Hypnoterapi i Birkerød (Rudersdal). En rolig, struktureret tilgang til mønstre, uro, søvn og vaner. Uforpligtende afklaring før du starter."
        />
        <link rel="canonical" href="https://gaarsdal.net/" />
        <meta property="og:title" content="Hypnoterapi i Birkerød | Gaarsdal" />
        <meta
          property="og:description"
          content="Rolig og struktureret hypnoterapi i Birkerød – med fokus på reaktioner og mønstre, der gentager sig. Uforpligtende afklaring."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://gaarsdal.net/" />
        <meta
          property="og:image"
          content="https://gaarsdal.net/Gaarsdal.net_logo_brand.png"
        />
        <meta name="robots" content="index, follow" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalBusiness",
              name: "Gaarsdal Hypnoterapi",
              url: "https://gaarsdal.net",
              telephone: "+4542807474",
              address: {
                "@type": "PostalAddress",
                streetAddress: "Bakkevej 36",
                postalCode: "3460",
                addressLocality: "Birkerød",
                addressRegion: "Rudersdal",
                addressCountry: "DK",
              },
              areaServed: {
                "@type": "AdministrativeArea",
                name: "Rudersdal Kommune",
              },
            }),
          }}
        />
      </Head>

      <Header />

      <main>
        {/* HERO */}
        <section className="py-32 text-center px-6">
          <h1 className="text-h1 font-light mb-4 max-w-3xl mx-auto">
            Hypnoterapi i Birkerød
          </h1>

          <p className="text-base-lg text-muted max-w-xl mx-auto mb-10">
            Ro, klarhed og ændringer der holder.
          </p>

          <div className="max-w-2xl mx-auto text-left space-y-4 mb-12">
            <p className="text-base-lg text-muted leading-relaxed">
              Der er situationer, hvor man forstår sit problem rationelt, men
              alligevel oplever, at de samme reaktioner bliver ved. Hypnoterapi
              kan være et praktisk værktøj til at arbejde med mønstre, der ellers
              kører automatisk.
            </p>
            <p className="text-base-lg text-muted leading-relaxed">
              Jeg tilbyder forløb i Birkerød. Vi starter altid med en afklaring,
              så du kan vurdere, om metoden og min måde at arbejde på passer til
              dig og din situation.
            </p>
          </div>

          <div className="flex justify-center gap-4 flex-wrap">
            <Link
              href="/kontakt"
              className="bg-accent text-white px-6 py-3 rounded-lg shadow hover:bg-accent/90 transition"
            >
              Kontakt for afklaring
            </Link>
            <Link
              href="/hypnoterapi"
              className="border border-accent text-accent px-6 py-3 rounded-lg hover:bg-accent/10 transition"
            >
              Læs mere om metoden
            </Link>
            <button
              onClick={() => window.dispatchEvent(new Event("open-chatbot"))}
              className="border border-gray-300 text-muted px-6 py-3 rounded-lg hover:bg-gray-50 transition"
            >
              Er det noget for mig? →
            </button>
          </div>
        </section>

        {/* HVAD DET ER */}
        <section className="py-24 px-6 bg-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-h2 font-light text-center mb-8">
              Hvad hypnoterapi er (og ikke er)
            </h2>
            <p className="text-muted leading-relaxed mb-4">
              Hypnose er ikke søvn og ikke kontroltab. Du er vågen, bevidst og
              kan stoppe når som helst. I praksis handler det om fokuseret
              opmærksomhed, hvor automatiske reaktioner og vaner ofte kan
              justeres mere direkte end ved viljestyrke alene.
            </p>
            <p className="text-muted leading-relaxed">
              Hypnose er for mig en metode – ikke en oplevelse. Vi arbejder
              konkret med det, du ønsker skal være anderledes i din hverdag.
            </p>
          </div>
        </section>

        {/* HVAD JEG TYPISK ARBEJDER MED */}
        <section className="py-24 px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-h2 font-light text-center mb-8">
              Hvad jeg typisk arbejder med
            </h2>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {[
                "Stress, indre uro og tankemylder",
                "Søvnproblemer og uro før sengetid",
                "Vaner og reaktionsmønstre, der er svære at ændre alene",
                "Bekymringer og tilbagevendende mentale loops",
                "Præstationspres og mentale blokeringer",
                "Følelsesmæssige reaktioner, der fylder mere end ønsket",
                "Afklaring i livssituationer eller overgange",
              ].map((item) => (
                <div
                  key={item}
                  className="bg-white rounded-xl px-5 py-4 border border-gray-100 shadow-sm text-muted text-sm leading-relaxed"
                >
                  {item}
                </div>
              ))}
            </div>

            <p className="text-muted leading-relaxed text-center">
              Formålet er ikke at blive "fikset", men at skabe bevægelse og
              flere handlemuligheder – i et tempo der er realistisk og
              meningsfuldt.
            </p>
          </div>
        </section>

        {/* HVEM DET PASSER TIL */}
        <section className="py-24 px-6 bg-white">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-h2 font-light text-center mb-8">
              Hvem det passer bedst til
            </h2>
            <p className="text-muted mb-6 text-center">
              Min tilgang giver især mening for dig, hvis du:
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {[
                "Er vant til at tænke selv og tage ansvar",
                "Har prøvet at forstå problemet uden at det ændrede noget",
                "Foretrækker en nøgtern, respektfuld stil frem for store løfter",
                "Ønsker ro og klarhed mere end motiverende peptalks",
              ].map((item) => (
                <div
                  key={item}
                  className="bg-bg rounded-xl px-5 py-4 border border-gray-100 shadow-sm text-muted text-sm leading-relaxed"
                >
                  {item}
                </div>
              ))}
            </div>
            <p className="text-muted leading-relaxed text-center text-sm">
              Hvis du søger en akut indsats eller behandling i sundhedssystemet,
              er det ofte bedre at starte et andet sted.
            </p>
          </div>
        </section>

        {/* KLINIK + KONTAKT */}
        <section className="py-24 px-6">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-medium mb-3">Klinik</h3>
              <p className="text-muted leading-relaxed mb-2">
                Adresse: Bakkevej 36, 3460 Birkerød.
              </p>
              <p className="text-muted leading-relaxed">
                Jeg har ofte klienter fra Rudersdal og nærområder, dvs. primært
                borgere fra Birkerød, Holte, Farum og Allerød.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-medium mb-3">Kontakt</h3>
              <p className="text-muted leading-relaxed mb-4">
                Kontakt mig, hvis du vil afklare om hypnoterapi – og min tilgang
                – er relevant for dig.
              </p>
              <div className="space-y-2 text-muted">
                <p>
                  <strong>Telefon:</strong>{" "}
                  <a href="tel:+4542807474" className="text-accent hover:underline">
                    42 80 74 74
                  </a>
                </p>
                <p>
                  <strong>E-mail:</strong>{" "}
                  <a
                    href="mailto:jan@gaarsdal.net"
                    className="text-accent hover:underline"
                  >
                    jan@gaarsdal.net
                  </a>
                </p>
                <p>
                  <strong>Adresse:</strong> Bakkevej 36, 3460 Birkerød
                </p>
              </div>

              <div className="mt-6 flex gap-3 flex-wrap">
                <Link
                  href="/kontakt"
                  className="bg-accent text-white px-5 py-2.5 rounded-lg shadow hover:bg-accent/90 transition"
                >
                  Kontakt for afklaring
                </Link>
                <a
                  className="border border-accent text-accent px-5 py-2.5 rounded-lg hover:bg-accent/10 transition"
                  href="https://www.facebook.com/groups/1056907644480600"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Facebook-gruppen
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* CHATBOT */}
        <Chatbot />
      </main>

      <Footer />
    </div>
  );
}
