// pages/om.tsx
import { useState } from "react";
import Head from "next/head";
import Link from "next/link";

export default function Om() {
  const [showAIInfo, setShowAIInfo] = useState(false);

  return (
    <>
      <Head>
        <title>Om — Gaarsdal Hypnoterapi</title>
        <meta
          name="description"
          content="Om Jan Erik Gaarsdal Lauridsen — rolig og jordnær tilgang til hypnoterapi, etik og ansvar"
        />
      </Head>

      <main className="min-h-screen bg-bg text-text">
        <section className="max-w-4xl mx-auto py-20 px-6">

          {/* HERO */}
          <div className="mb-12 text-center">
            <h1 className="text-h1 font-medium mb-4">
              En rolig og tryg tilgang til indre arbejde
            </h1>
            <p className="text-base-lg text-muted max-w-2xl mx-auto">
              Jeg arbejder med hypnoterapi som en måde at skabe ro, fokus og klarhed
              i menneskers indre tilstande. For mig handler det ikke om teknikker i
              sig selv, men om at møde mennesker på en måde, der giver plads,
              struktur og tryghed.
            </p>
          </div>

          {/* TEXT BLOCK */}
          <div className="prose prose-lg max-w-none text-text mb-10">
            <p>
              Mit navn er <strong>Jan Erik Gaarsdal Lauridsen</strong>. Jeg har
              gennem hele mit liv haft en dyb interesse for, hvordan mennesker
              fungerer — mentalt, følelsesmæssigt og adfærdsmæssigt. Allerede som
              ung begyndte jeg at studere hypnose og senere psykologi, kognition og
              neurofaglig litteratur. Sidenhen har mange år i ledelsesroller og
              arbejde med mennesker i forskellige kulturer præget min måde at møde
              andre på.
            </p>

            <p>
              Gennem et langt arbejdsliv har jeg mødt pres, ansvar og forandring —
              og lært at bevare roen, skabe overblik og finde retning i komplekse
              situationer. Den erfaring er kernen i min tilgang som hypnoterapeut:
              roligt, jordnært og uden løfter.
            </p>
          </div>

          {/* APPROACH CARDS */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-semibold mb-2">Ro & klarhed</h3>
              <p className="text-sm text-muted">
                Et trygt rum hvor tempo og struktur passer til dig.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-semibold mb-2">Respekt & nysgerrighed</h3>
              <p className="text-sm text-muted">
                Vi undersøger uden at dømme — med respekt for din rytme.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-semibold mb-2">Intuition & struktur</h3>
              <p className="text-sm text-muted">
                Kombination af menneskeforståelse og analytisk overblik.
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
                  Rolig afdækning af tema, mål og rammer — i dit tempo.
                </p>
              </div>
              <div className="flex-1 bg-white p-5 rounded-lg border border-gray-100">
                <strong>2) Hypnose</strong>
                <p className="text-sm text-muted mt-2">
                  En guidet, fokuseret og behagelig fordybelse — ikke søvn.
                </p>
              </div>
              <div className="flex-1 bg-white p-5 rounded-lg border border-gray-100">
                <strong>3) Integration</strong>
                <p className="text-sm text-muted mt-2">
                  Rolig afrunding og landing — uden hast.
                </p>
              </div>
            </div>
          </div>

          {/* WHO IT SUITS */}
          <div className="mb-12">
            <h2 className="text-h2 font-medium mb-4">
              Hvem henvender det sig til
            </h2>
            <ul className="list-disc pl-5 text-muted space-y-2">
              <li>Stress, uro og indre spændinger</li>
              <li>Søvnproblemer</li>
              <li>Vaner og gentagne mønstre</li>
              <li>Præstationspres og ledelsesansvar</li>
              <li>Søgen efter indre ro og klarhed</li>
            </ul>
          </div>

          {/* CLOSING NOTE */}
          <div className="mb-16 max-w-2xl">
            <p className="text-base-lg text-text">
              Hos mig møder du et menneske, der lytter, afklarer og hjælper dig med
              at finde ro i det, du står i. Vi arbejder i et tempo, som passer til
              dig — uden løfter og uden hast.
            </p>
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
                    På dette website anvendes en AI-baseret assistent, som kan svare
                    på generelle spørgsmål om hypnoterapi og relaterede emner.
                  </p>

                  <p>
                    AI-assistenten giver udelukkende{" "}
                    <strong>generel information</strong>. Den giver ikke personlig
                    rådgivning, stiller ikke diagnoser og kan ikke erstatte kontakt
                    med en professionel behandler eller sundhedsfaglig person.
                  </p>

                  <p>
                    Svarene kan være forenklede og kan indeholde fejl. Det er altid
                    dit eget ansvar at vurdere, hvad der er relevant for dig.
                  </p>

                  <p>
                    Hvis du oplever alvorlig mistrivsel eller står i en akut
                    situation, anbefales det altid at søge menneskelig hjælp.
                  </p>

                  <p className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                    AI-assistenten er udviklet med fokus på transparens, etik og
                    klare grænser for ansvar.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* CONTACT */}
          <div className="bg-white p-6 rounded-lg border border-gray-100">
            <h3 className="font-semibold mb-2">Kontakt</h3>
            <p className="text-sm text-muted mb-1">
              Bakkevej 36, 3460 Birkerød
            </p>
            <p className="text-sm text-muted mb-1">
              Mail:{" "}
              <a
                href="mailto:jan@gaarsdal.net"
                className="text-accent hover:underline"
              >
                jan@gaarsdal.net
              </a>
            </p>
            <p className="text-sm text-muted">Tlf: 42 80 74 74</p>
          </div>

        </section>
      </main>
    </>
  );
}
