// pages/om.tsx
import { useState } from "react";
import Head from "next/head";

export default function Om() {
  const [showAIInfo, setShowAIInfo] = useState(false);

  return (
    <>
      <Head>
        <title>Om — Gaarsdal Hypnoterapi</title>
        <meta
          name="description"
          content="Hypnoterapi med fokus på trygge rammer, etik og en afdæmpet, jordnær tilgang"
        />
      </Head>

      <main className="min-h-screen bg-bg text-text">
        <section className="max-w-4xl mx-auto py-20 px-6">

          {/* HERO */}
          <div className="mb-12 text-center">
            <h1 className="text-h1 font-medium mb-4">
              En tryg ramme for indre arbejde
            </h1>
            <p className="text-base-lg text-muted max-w-2xl mx-auto">
              Hypnoterapi bruges her som en mulighed for at skabe fordybelse,
              overblik og indre ro — i et tempo, der respekterer den enkelte.
              Fokus er ikke på hurtige løsninger, men på klarhed og tryghed
              i processen.
            </p>
          </div>

          {/* RAMME / TILGANG */}
          <div className="prose prose-lg max-w-none text-text mb-12">
            <p>
              Hos Gaarsdal Hypnoterapi er rammen enkel og tydelig. Der arbejdes
              uden faste programmer, uden løfter om resultater og uden pres
              for forandring. I stedet skabes der plads til at undersøge det,
              der fylder, med respekt for dine grænser og dit tempo.
            </p>

            <p>
              Hypnoterapi anvendes som et redskab til fokuseret opmærksomhed og
              indre fordybelse. Arbejdet tager udgangspunkt i samtale,
              afklaring og samarbejde. Processen formes løbende i dialog
              og justeres efter behov.
            </p>

            <p>
              Du møder et menneske, der lytter, hjælper med at skabe struktur
              og overblik og som understøtter refleksion — uden at tage
              beslutninger på dine vegne.
            </p>
          </div>

          {/* APPROACH CARDS */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-semibold mb-2">Tryghed & tempo</h3>
              <p className="text-sm text-muted">
                Et rum med plads til pauser, afklaring og ro — uden hast.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-semibold mb-2">Respekt & samarbejde</h3>
              <p className="text-sm text-muted">
                Arbejdet foregår i dialog og med respekt for dine grænser.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-semibold mb-2">Klarhed & struktur</h3>
              <p className="text-sm text-muted">
                Fokus på overblik og forståelse frem for forklaringer og pres.
              </p>
            </div>
          </div>

          {/* SESSION STEPS */}
          <div className="mb-12">
            <h2 className="text-h2 font-medium mb-4">
              Sådan foregår en typisk session
            </h2>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 bg-white p-5 rounded-lg border border-gray-100">
                <strong>1) Samtale</strong>
                <p className="text-sm text-muted mt-2">
                  Afdækning af tema, forventninger og rammer — i et roligt tempo.
                </p>
              </div>
              <div className="flex-1 bg-white p-5 rounded-lg border border-gray-100">
                <strong>2) Hypnose</strong>
                <p className="text-sm text-muted mt-2">
                  En guidet, fokuseret fordybelse, hvor opmærksomheden samles.
                </p>
              </div>
              <div className="flex-1 bg-white p-5 rounded-lg border border-gray-100">
                <strong>3) Afrunding</strong>
                <p className="text-sm text-muted mt-2">
                  Rolig afslutning og refleksion — uden krav om konklusion.
                </p>
              </div>
            </div>
          </div>

          {/* WHO IT SUITS */}
          <div className="mb-16">
            <h2 className="text-h2 font-medium mb-4">
              Hvem henvender forløb sig typisk til
            </h2>
            <ul className="list-disc pl-5 text-muted space-y-2">
              <li>Oplevelse af stress, uro eller indre spænding</li>
              <li>Søvnproblemer og tankemylder</li>
              <li>Vaner og gentagne mønstre</li>
              <li>Præstationspres og ansvar</li>
              <li>Ønske om mere indre klarhed</li>
            </ul>
          </div>

          {/* AI ASSISTENT INFO (COLLAPSIBLE) */}
          <div className="mb-16 max-w-3xl mx-auto">
            <button
              onClick={() => setShowAIInfo((v) => !v)}
              aria-expanded={showAIInfo}
              className="
                w-full flex items-center justify-between
                bg-bg border border-gray-200 rounded-2xl
                px-6 py-4 text-left
                hover:bg-gray-50 transition
              "
            >
              <span className="font-medium text-text">
                Om AI-assistenten på websitet
              </span>
              <span className="text-sm text-muted">
                {showAIInfo ? "Skjul" : "Læs mere"}
              </span>
            </button>

            {showAIInfo && (
              <div className="mt-4 bg-bg border border-gray-200 rounded-2xl p-8">
                <div className="text-sm text-muted leading-relaxed space-y-4">
                  <p>
                    På dette website anvendes en AI-baseret assistent, som kan
                    svare på generelle spørgsmål om hypnoterapi og relaterede
                    emner.
                  </p>

                  <p>
                    AI-assistenten giver udelukkende{" "}
                    <strong>generel information</strong>. Den giver ikke
                    personlig rådgivning, stiller ikke diagnoser og kan ikke
                    erstatte kontakt med en professionel behandler eller
                    sundhedsfaglig person.
                  </p>

                  <p>
                    Svarene kan være forenklede og kan indeholde fejl. Det er
                    altid dit eget ansvar at vurdere, hvad der er relevant for
                    dig.
                  </p>

                  <p>
                    Ved alvorlig mistrivsel eller i akutte situationer
                    anbefales det altid at søge menneskelig hjælp.
                  </p>

                  <p className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                    AI-assistenten er udviklet med fokus på transparens, etik
                    og klare grænser for ansvar.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* FOOTER PERSON NOTE */}
          <div className="text-sm text-muted">
            Gaarsdal Hypnoterapi drives af Jan Erik Gaarsdal Lauridsen.
          </div>

        </section>
      </main>
    </>
  );
}
