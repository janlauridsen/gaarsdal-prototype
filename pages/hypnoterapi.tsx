// pages/hypnoterapi.tsx
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Hypnoterapi() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <Header />

      <main className="max-w-3xl mx-auto px-6 py-24">
        {/* HERO */}
        <h1 className="text-h1 font-light mb-6">Hypnoterapi</h1>
        <p className="text-base-lg text-muted mb-12 max-w-2xl">
          Hypnoterapi anvendes her som en mulighed for fordybelse og indre fokus.
          Arbejdet foregår i rolige rammer og med respekt for den enkeltes tempo
          og grænser.
        </p>

        {/* HVAD ER HYPNOTERAPI */}
        <section className="bg-bg border border-gray-200 rounded-2xl p-8 mb-12">
          <h2 className="text-h2 font-light mb-4">Hvad er hypnoterapi?</h2>
          <p className="text-muted leading-relaxed mb-4">
            Hypnoterapi er en metode, hvor opmærksomheden samles og fordybes.
            Mange beskriver tilstanden som vågen, fokuseret og afslappet på
            samme tid. Du er hele tiden bevidst om, hvad der foregår, og kan
            når som helst afbryde processen.
          </p>
          <p className="text-muted leading-relaxed">
            For nogle kan det minde om guidet meditation eller dagdrømmeri,
            hvor der bliver bedre adgang til egne tanker, følelser og indre
            oplevelser.
          </p>
        </section>

        {/* ANVENDELSE */}
        <section className="bg-bg border border-gray-200 rounded-2xl p-8 mb-12">
          <h2 className="text-h2 font-light mb-4">
            Hvilke temaer arbejder man ofte med?
          </h2>
          <p className="text-muted leading-relaxed mb-4">
            Hypnoterapi anvendes i mange sammenhænge. Nogle vælger metoden for
            at arbejde med indre spændinger, vaner eller gentagne mønstre.
            Andre er nysgerrige på at opnå større klarhed eller ro.
          </p>
          <ul className="list-disc ml-6 text-muted space-y-2">
            <li>Stress og indre uro</li>
            <li>Søvnproblemer og tankemylder</li>
            <li>Præstationspres og ansvar</li>
            <li>Vaner og gentagne mønstre</li>
            <li>Bekymringer og indre spænding</li>
            <li>Ønske om mere fokus og overblik</li>
          </ul>
        </section>

        {/* FORLØB */}
        <section className="bg-bg border border-gray-200 rounded-2xl p-8 mb-12">
          <h2 className="text-h2 font-light mb-4">
            Hvordan foregår en session?
          </h2>

          <p className="text-muted mb-4">
            Sessioner foregår i rolige omgivelser i min praksis i Birkerød.
            Forløbet tilpasses altid den enkelte og formes i dialog.
          </p>

          <ol className="list-decimal ml-6 text-muted space-y-2">
            <li>Indledende samtale om det, der fylder</li>
            <li>Guidet fordybelse og fokus</li>
            <li>Arbejde med det aftalte tema</li>
            <li>Rolig afrunding og refleksion</li>
          </ol>

          <p className="text-muted mt-4">
            Du mister ikke kontrollen og er ikke “væk”. Hypnose er ikke søvn,
            men en ændret opmærksomhedstilstand, hvor samarbejde er centralt.
          </p>
        </section>

        {/* SIKKERHED & RAMMER */}
        <section className="bg-bg border border-gray-200 rounded-2xl p-8 mb-12">
          <h2 className="text-h2 font-light mb-4">
            Rammer, sikkerhed og ansvar
          </h2>
          <p className="text-muted leading-relaxed">
            Hypnoterapi forudsætter frivillighed, samtykke og samarbejde.
            Der gives ingen garantier for resultater, og metoden kan ikke
            erstatte lægefaglig eller psykologisk behandling. Spørgsmål om
            medicin eller alvorlig psykisk mistrivsel henvises altid til
            sundhedsfagligt personale.
          </p>
        </section>

        {/* HVEM ER DET FOR */}
        <section className="bg-bg border border-gray-200 rounded-2xl p-8 mb-16">
          <h2 className="text-h2 font-light mb-4">
            Hvem henvender hypnoterapi sig typisk til?
          </h2>
          <p className="text-muted leading-relaxed">
            Hypnoterapi kan være relevant for mennesker, der er nysgerrige på
            deres indre processer og ønsker at arbejde med sig selv på en
            afdæmpet og struktureret måde. Der kræves ingen forudgående
            erfaring.
          </p>
        </section>

        {/* CTA */}
        <section className="bg-bg border border-gray-200 rounded-3xl p-10 text-center">
          <h2 className="text-h2 font-light mb-4">
            Nysgerrig på at høre mere?
          </h2>
          <p className="text-muted mb-6 max-w-xl mx-auto">
            Du er velkommen til at tage kontakt, hvis du har spørgsmål eller
            ønsker at afklare, om et forløb kunne være relevant for dig.
          </p>
          <a
            href="/kontakt"
            className="
              inline-block bg-accent text-white
              px-6 py-3 rounded-xl
              hover:bg-accent/90 transition
            "
          >
            Kontakt
          </a>
        </section>
      </main>

      <Footer />
    </div>
  );
}
