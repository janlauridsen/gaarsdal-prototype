// pages/om.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Om() {
  return (
    <>
      <Head>
        <title>Om Jan Gaarsdal – hypnoterapeut i Birkerød | Gaarsdal</title>
        <meta
          name="description"
          content="Om Jan Erik Gaarsdal Lauridsen – baggrund i ledelse og komplekse miljøer. En rolig, struktureret og nøgtern tilgang til hypnoterapi i Birkerød."
        />
        <link rel="canonical" href="https://gaarsdal.net/om" />
        <meta property="og:title" content="Om Jan Gaarsdal – hypnoterapeut i Birkerød" />
        <meta
          property="og:description"
          content="Baggrund i ledelse og komplekse miljøer. En praktisk, nøgtern tilgang til hypnoterapi – uden store løfter og uden hastværk."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://gaarsdal.net/om" />
        <meta
          property="og:image"
          content="https://gaarsdal.net/Gaarsdal.net_logo_brand.png"
        />
        <meta name="robots" content="index, follow" />
      </Head>

      <div className="min-h-screen bg-bg text-text">
        <Header />
        <main className="max-w-3xl mx-auto py-24 px-6">
          {/* HERO */}
          <div className="mb-12">
            <h1 className="text-h1 font-medium mb-4">Om mig</h1>
            <p className="text-base-lg text-muted">
              En rolig og struktureret tilgang – uden store løfter og uden
              hastværk.
            </p>
          </div>

          {/* BAGGRUND */}
          <section className="bg-white p-6 rounded-lg shadow-sm mb-10">
            <h2 className="text-h2 font-light mb-4">Baggrund</h2>
            <p className="text-muted leading-relaxed mb-4">
              Jeg har baggrund i ledelse og arbejde i komplekse miljøer, hvor
              pres, beslutninger og menneskelige reaktioner er en del af
              hverdagen. Det har formet en praktisk tilgang: mindre fokus på
              forklaringer, mere fokus på hvad der virker i praksis.
            </p>
            <p className="text-muted leading-relaxed mb-4">
              Hypnoterapi bruger jeg som et præcist redskab til at arbejde med
              automatiske mønstre. Målet er forandringer, der holder i
              hverdagen – i et tempo der er realistisk og meningsfuldt.
            </p>
            <p className="text-muted leading-relaxed">
              Jeg er ikke psykolog eller læge. Hypnoterapi er ikke behandling i
              sundhedsfaglig forstand, og jeg arbejder ikke med psykiatriske
              lidelser. Hvis du er i tvivl om, hvad der er den rette tilgang,
              er en afklaring altid det bedste udgangspunkt.
            </p>
          </section>

          {/* PRINCIPPER */}
          <section className="mb-10">
            <h2 className="text-h2 font-light mb-6">Sådan arbejder jeg</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-semibold mb-2">Ro og struktur</h3>
                <p className="text-sm text-muted leading-relaxed">
                  Tydelige rammer og en proces, der er til at være i. Vi arbejder
                  konkret med det, der gentager sig – ikke det, vi tror det
                  handler om.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-semibold mb-2">Nøgternhed</h3>
                <p className="text-sm text-muted leading-relaxed">
                  Ingen peptalks og ingen forhåndsløfter. Afklaring først – så du
                  kan vurdere relevansen, inden du forpligter dig til noget.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-semibold mb-2">Respekt for tempo</h3>
                <p className="text-sm text-muted leading-relaxed">
                  Tempoet er dit. Der er ikke standardløsninger, og vi justerer
                  undervejs ud fra, hvad der faktisk virker for dig.
                </p>
              </div>
            </div>
          </section>

          {/* SESSION STEPS */}
          <section className="bg-white p-6 rounded-lg shadow-sm mb-10">
            <h2 className="text-h2 font-light mb-6">
              Sådan foregår en typisk session
            </h2>
            <div className="space-y-5">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center font-medium text-sm">
                  1
                </div>
                <div>
                  <strong className="block mb-1">Afklaring og målretning</strong>
                  <p className="text-sm text-muted leading-relaxed">
                    Hvad sker der konkret for dig – og hvad ønsker du ændret? Vi
                    starter altid med det, der faktisk er i spil, ikke med
                    antagelser.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center font-medium text-sm">
                  2
                </div>
                <div>
                  <strong className="block mb-1">Hypnosearbejde</strong>
                  <p className="text-sm text-muted leading-relaxed">
                    Fokus og indre processer inden for en aftalt ramme. Du er
                    vågen, bevidst og kan stoppe når som helst.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center font-medium text-sm">
                  3
                </div>
                <div>
                  <strong className="block mb-1">Evaluering</strong>
                  <p className="text-sm text-muted leading-relaxed">
                    Kort afrunding: hvad gav mening, og hvad er næste realistiske
                    skridt.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* CONTACT */}
          <section className="bg-white p-6 rounded-lg border border-gray-100">
            <h3 className="font-semibold mb-2">Kontakt</h3>
            <p className="text-sm text-muted mb-1">
              Bakkevej 36, 3460 Birkerød
            </p>
            <p className="text-sm text-muted mb-1">
              Mail:{" "}
              <a href="mailto:jan@gaarsdal.net" className="text-accent hover:underline">
                jan@gaarsdal.net
              </a>
            </p>
            <p className="text-sm text-muted mb-5">Tlf: 42 80 74 74</p>
            <div className="flex gap-3 flex-wrap">
              <Link
                href="/kontakt"
                className="inline-block bg-accent text-white px-5 py-2.5 rounded-lg hover:bg-accent/90 transition"
              >
                Kontakt for afklaring
              </Link>
              <Link
                href="/hypnoterapi"
                className="inline-block border border-accent text-accent px-5 py-2.5 rounded-lg hover:bg-accent/10 transition"
              >
                Læs om hypnoterapi
              </Link>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
