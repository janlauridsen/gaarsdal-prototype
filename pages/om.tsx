// pages/om.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Om() {
  return (
    <>
      <Head>
        <title>Om — Gaarsdal Hypnoterapi</title>
        <meta
          name="description"
          content="Om Jan Erik Gaarsdal Lauridsen — en rolig, struktureret og nøgtern tilgang til hypnoterapi i Birkerød."
        />
      </Head>

      <div className="min-h-screen bg-bg text-text">
        <Header />
        <main className="max-w-4xl mx-auto py-24 px-6">
          {/* HERO */}
          <div className="mb-12 text-center">
            <h1 className="text-h1 font-medium mb-4">Om mig</h1>
            <p className="text-base-lg text-muted max-w-2xl mx-auto">
              En rolig og struktureret tilgang – uden store løfter og uden
              hastværk.
            </p>
          </div>

          {/* TEXT BLOCK */}
          <div className="prose prose-lg max-w-none text-text mb-10">
            <p>
              Jeg har baggrund i ledelse og arbejde i komplekse miljøer, hvor
              pres, beslutninger og menneskelige reaktioner er en del af
              hverdagen. Det har formet en praktisk tilgang: mindre fokus på
              forklaringer, mere fokus på hvad der virker i praksis.
            </p>

            <p>
              Hypnoterapi bruger jeg som et præcist redskab til at arbejde med
              automatiske mønstre. Målet er forandringer, der holder i hverdagen
              – i et tempo der er realistisk og meningsfuldt.
            </p>
          </div>

          {/* PRINCIPPER */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-semibold mb-2">Ro og struktur</h3>
              <p className="text-sm text-muted">
                Tydelige rammer og en proces, der er til at være i. Vi arbejder
                konkret med det, der gentager sig.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-semibold mb-2">Nøgternhed</h3>
              <p className="text-sm text-muted">
                Ingen peptalks og ingen forhåndsløfter. Afklaring først – så du
                kan vurdere relevans.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-semibold mb-2">Respekt for tempo</h3>
              <p className="text-sm text-muted">
                Tempoet er dit. Der er ikke standardløsninger, og vi justerer
                undervejs ud fra, hvad der faktisk virker.
              </p>
            </div>
          </div>

          {/* SESSION STEPS */}
          <div className="mb-12">
            <h2 className="text-h2 font-light mb-4">
              Sådan foregår en typisk session
            </h2>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 bg-white p-5 rounded-lg border border-gray-100">
                <strong>1) Afklaring og målretning</strong>
                <p className="text-sm text-muted mt-2">
                  Hvad sker der konkret for dig – og hvad ønsker du ændret?
                </p>
              </div>
              <div className="flex-1 bg-white p-5 rounded-lg border border-gray-100">
                <strong>2) Hypnosearbejde</strong>
                <p className="text-sm text-muted mt-2">
                  Fokus og indre processer inden for en aftalt ramme. Du er
                  vågen, bevidst og kan stoppe når som helst.
                </p>
              </div>
              <div className="flex-1 bg-white p-5 rounded-lg border border-gray-100">
                <strong>3) Evaluering</strong>
                <p className="text-sm text-muted mt-2">
                  Kort afrunding: hvad gav mening, og hvad er næste realistiske
                  skridt.
                </p>
              </div>
            </div>
          </div>

          {/* HVEM DET PASSER TIL */}
          <div className="mb-12">
            <h2 className="text-h2 font-light mb-4">Hvem det ofte passer til</h2>
            <ul className="list-disc pl-5 text-muted space-y-2">
              <li>Du er vant til at tænke selv og tage ansvar</li>
              <li>Du har prøvet at forstå problemet uden at det ændrede noget</li>
              <li>Du foretrækker en respektfuld, nøgtern stil</li>
              <li>Du ønsker ro og klarhed mere end store løfter</li>
            </ul>
          </div>

          {/* CLOSING NOTE */}
          <div className="mb-8 max-w-2xl">
            <p className="text-base-lg text-text">
              Hvis du søger en akut indsats eller behandling i
              sundhedssystemet, er det ofte bedre at starte et andet sted. Hvis
              du vil afklare relevans, kan du kontakte mig.
            </p>
          </div>

          {/* CONTACT */}
          <div className="bg-white p-6 rounded-lg border border-gray-100">
            <h3 className="font-semibold mb-2">Kontakt</h3>
            <p className="text-sm text-muted mb-1">
              Bakkevej 36, 3460 Birkerød
            </p>
            <p className="text-sm text-muted mb-1">
              Mail:{" "}
              <a href="mailto:jan@gaarsdal.net" className="text-accent">
                jan@gaarsdal.net
              </a>
            </p>
            <p className="text-sm text-muted mb-4">Tlf: 42 80 74 74</p>
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
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
