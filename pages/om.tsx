// pages/om.tsx
import Head from "next/head";
import Link from "next/link";

export default function Om() {
  return (
    <>
      <Head>
        <title>Om — Gaarsdal Hypnoterapi</title>
        <meta
          name="description"
          content="Om Jan Erik Gaarsdal Lauridsen — rolig og jordnær tilgang til hypnoterapi"
        />
      </Head>

      <main className="min-h-screen bg-bg text-text">
        <section className="max-w-4xl mx-auto py-20 px-6">
          {/* HERO */}
          <div className="mb-12 text-center">
            <h1 className="text-h1 font-medium mb-4">
              En rolig og struktureret tilgang
            </h1>
            <p className="text-base-lg text-muted max-w-2xl mx-auto">
              Jeg arbejder med hypnoterapi som en rammesat og fokuseret metode,
              hvor tempo, struktur og respekt for den enkelte er centrale.
              Tilgangen er nøgtern og uden løfter.
            </p>
          </div>

          {/* TEXT BLOCK */}
          <div className="prose prose-lg max-w-none text-text mb-10">
            <p>
              Mit navn er <strong>Jan Erik Gaarsdal Lauridsen</strong>. Jeg har
              gennem mange år haft en vedvarende interesse for, hvordan mennesker
              fungerer mentalt, følelsesmæssigt og adfærdsmæssigt. Tidligt begyndte
              jeg at beskæftige mig med hypnose og senere med psykologisk,
              kognitiv og neurovidenskabelig litteratur.
            </p>

            <p>
              Et langt arbejdsliv med ledelsesansvar og arbejde i forskellige
              kulturelle sammenhænge har givet mig erfaring med pres,
              kompleksitet og forandring. Den erfaring præger min tilgang:
              rolig, jordnær og struktureret — uden løfter og uden hast.
            </p>
          </div>

          {/* APPROACH CARDS */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-semibold mb-2">Ro og struktur</h3>
              <p className="text-sm text-muted">
                Et afgrænset rum med tydelige rammer og et tempo, der kan justeres.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-semibold mb-2">Respekt og opmærksomhed</h3>
              <p className="text-sm text-muted">
                En undersøgelse uden vurdering, med respekt for individuelle forskelle.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-semibold mb-2">Erfaring og overblik</h3>
              <p className="text-sm text-muted">
                Kombination af menneskelig erfaring og analytisk forståelse.
              </p>
            </div>
          </div>

          {/* SESSION STEPS */}
          <div className="mb-12">
            <h2 className="h2 font-medium mb-4">
              Sådan foregår en typisk session
            </h2>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 bg-white p-5 rounded-lg border border-gray-100">
                <strong>1) Samtale</strong>
                <p className="text-sm text-muted mt-2">
                  Indledende afklaring af tema og ramme.
                </p>
              </div>
              <div className="flex-1 bg-white p-5 rounded-lg border border-gray-100">
                <strong>2) Hypnose</strong>
                <p className="text-sm text-muted mt-2">
                  Guidning i en fokuseret opmærksomhedstilstand.
                </p>
              </div>
              <div className="flex-1 bg-white p-5 rounded-lg border border-gray-100">
                <strong>3) Afrunding</strong>
                <p className="text-sm text-muted mt-2">
                  Rolig afslutning og tydelig afgrænsning.
                </p>
              </div>
            </div>
          </div>

          {/* WHO IT SUITS */}
          <div className="mb-12">
            <h2 className="h2 font-medium mb-4">
              Typiske anvendelseskontekster
            </h2>
            <ul className="list-disc pl-5 text-muted space-y-2">
              <li>Oplevelser af stress og indre spænding</li>
              <li>Søvnrelaterede vanskeligheder</li>
              <li>Gentagelsesmønstre og vaner</li>
              <li>Præstationsrelateret pres og ansvar</li>
              <li>Ønske om større klarhed i bestemte situationer</li>
            </ul>
          </div>

          {/* CLOSING NOTE */}
          <div className="mb-8 max-w-2xl">
            <p className="text-base-lg text-text">
              Hos mig møder du en rolig og struktureret tilgang, hvor der
              arbejdes inden for klare rammer og uden forhåndsløfter.
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
            <p className="text-sm text-muted">Tlf: 42 80 74 74</p>
          </div>
        </section>
      </main>
    </>
  );
}
