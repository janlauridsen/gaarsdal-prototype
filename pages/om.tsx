// pages/om.tsx
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Om() {
  return (
    <>
      <Head>
        <title>Om Jan – hypnoterapeut i Birkerød | Gaarsdal</title>
        <meta
          name="description"
          content="Jeg arbejder med mennesker, der har brug for ro, klarhed og en mere direkte vej til forandring. En rolig, jordnær tilgang til hypnoterapi i Birkerød."
        />
        <link rel="canonical" href="https://gaarsdal.net/om" />
        <meta property="og:title" content="Om Jan – hypnoterapeut i Birkerød" />
        <meta
          property="og:description"
          content="Jeg arbejder med mennesker, der har brug for ro, klarhed og en mere direkte vej til forandring."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://gaarsdal.net/om" />
        <meta property="og:image" content="https://gaarsdal.net/Jan-AI.png" />
        <meta name="robots" content="index, follow" />
      </Head>

      <div className="min-h-screen bg-bg text-text">
        <Header />
        <main className="max-w-3xl mx-auto py-24 px-6">

          {/* HERO MED BILLEDE */}
          <div className="flex flex-col sm:flex-row gap-8 items-start mb-14">
            <div className="flex-shrink-0">
              <Image
                src="/Jan-AI.png"
                alt="Jan Lauridsen, hypnoterapeut"
                width={160}
                height={160}
                className="rounded-2xl object-cover shadow-sm"
                priority
              />
            </div>
            <div>
              <h1 className="text-h1 font-medium mb-3">Jeg hedder Jan</h1>
              <p className="text-base-lg text-muted leading-relaxed">
                Jeg arbejder med mennesker, der har brug for ro, klarhed og en
                mere direkte vej til forandring.
              </p>
            </div>
          </div>

          {/* JANS STEMME */}
          <section className="bg-white p-6 rounded-lg shadow-sm mb-10 space-y-4">
            <p className="text-muted leading-relaxed">
              Mange af dem, der kommer til mig, har prøvet meget: tænkt,
              analyseret, kæmpet, forsøgt at tage sig sammen. Alligevel sidder
              de fast i noget, der ikke slipper.
            </p>
            <p className="text-muted leading-relaxed">
              Jeg har altid været optaget af, hvordan mennesker fungerer — ikke
              kun på overfladen, men i de dybere lag, hvor vores automatiske
              reaktioner bliver skabt. Det er også derfor, jeg arbejder med
              hypnose. Det er en metode, der giver adgang til de steder, hvor
              forandring faktisk kan ske, uden at man skal presse sig selv eller
              forklare alting perfekt.
            </p>
            <p className="text-muted leading-relaxed">
              Min tilgang er rolig, jordnær og uden drama. Jeg tror ikke på
              hurtige slogans eller "nu fikser vi dig"-mentalitet. Jeg tror på
              at skabe et trygt rum, hvor du kan være dig selv uden at blive
              dømt. Her arbejder vi med det, der viser sig — i dit tempo, med
              respekt for dine grænser og din historie.
            </p>
          </section>

          {/* BAGGRUND */}
          <section className="bg-white p-6 rounded-lg shadow-sm mb-10 space-y-4">
            <h2 className="text-h2 font-light mb-2">Baggrund</h2>
            <p className="text-muted leading-relaxed">
              Jeg har en baggrund, hvor jeg i mange år har arbejdet med
              komplekse systemer, mønstre og problemløsning. Det har lært mig
              én ting: Når noget bliver ved med at drille, er det sjældent fordi
              man ikke prøver hårdt nok. Det er fordi man ikke har fået adgang
              til det sted, hvor mønstret styres fra. Det er præcis dér, hypnose
              kan noget særligt.
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

          {/* AFSLUTTENDE CITAT */}
          <section className="bg-accent/5 border border-accent/20 rounded-xl p-6 mb-10">
            <p className="text-muted leading-relaxed italic">
              "Hvis du søger en behandler, der møder dig med ro, nysgerrighed
              og respekt — uden at gøre dig forkert — så er du velkommen her."
            </p>
          </section>

          {/* CONTACT */}
          <section className="bg-white p-6 rounded-lg border border-gray-100">
            <h3 className="font-semibold mb-2">Kontakt</h3>
            <p className="text-sm text-muted mb-1">Bakkevej 36, 3460 Birkerød</p>
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
