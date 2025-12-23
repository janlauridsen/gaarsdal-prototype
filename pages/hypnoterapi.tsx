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
        <p className="text-base-lg text-muted mb-10">
          Hypnoterapi er en struktureret og rolig metode, der anvendes i arbejdet
          med forskellige mentale og følelsesmæssige problemstillinger.
        </p>

        {/* HVAD ER HYPNOTERAPI */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-10">
          <h2 className="text-h2 font-light mb-4">Hvad er hypnoterapi?</h2>
          <p className="text-muted leading-relaxed mb-4">
            Hypnoterapi er en samtale- og oplevelsesbaseret metode, hvor der arbejdes
            med fokuseret opmærksomhed og indre forestilling. Du er vågen, til stede
            og har fuld kontrol gennem hele forløbet.
          </p>
          <p className="text-muted leading-relaxed">
            Tilstanden kan minde om dyb koncentration eller guidet opmærksomhed,
            hvor indre oplevelser træder tydeligere frem. Processen kan altid
            afbrydes.
          </p>
        </section>

        {/* ANVENDELSESOMRÅDER */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-10">
          <h2 className="text-h2 font-light mb-4">
            Typiske anvendelsesområder
          </h2>
          <p className="text-muted mb-4">
            Hypnoterapi anvendes i forskellige sammenhænge. Relevansen afhænger
            altid af den konkrete problemstilling.
          </p>
          <ul className="list-disc ml-6 text-muted space-y-2">
            <li>Stressrelateret belastning og indre uro</li>
            <li>Søvnrelaterede vanskeligheder</li>
            <li>Oplevelser af lav selvfølelse</li>
            <li>Præstationsrelateret pres</li>
            <li>Bekymringer og vedvarende tankemønstre</li>
            <li>Vaner og gentagelsesmønstre</li>
            <li>Mentalt overstimulerende tankeaktivitet</li>
            <li>Følelsesmæssige reaktioner</li>
          </ul>
        </section>

        {/* HVORDAN FOREGÅR DET */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-10">
          <h2 className="text-h2 font-light mb-4">
            Hvordan foregår en session?
          </h2>

          <p className="text-muted mb-4">
            En session foregår i rolige omgivelser i min praksis på Bakkevej 36 i Birkerød.
          </p>

          <ol className="list-decimal ml-6 text-muted space-y-2">
            <li>Indledende samtale med afklaring af tema og ramme</li>
            <li>Guidning i en fokuseret opmærksomhedstilstand</li>
            <li>Arbejde med det aktuelle tema inden for den aftalte ramme</li>
            <li>Rolig afrunding</li>
          </ol>

          <p className="text-muted mt-4">
            Du er ikke væk eller uden kontrol, men i en mere fokuseret og afgrænset tilstand.
          </p>
        </section>

        {/* SIKKERHED */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-10">
          <h2 className="text-h2 font-light mb-4">
            Er hypnoterapi sikkert?
          </h2>
          <p className="text-muted leading-relaxed">
            Hypnoterapi er en metode, der er undersøgt i psykologisk og klinisk forskning.
            Under sessionen bevarer du altid din egen kontrol og opmærksomhed.
            Du kan tale, åbne øjnene eller afbryde processen når som helst.
          </p>
        </section>

        {/* HVEM ER DET FOR */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-10">
          <h2 className="text-h2 font-light mb-4">
            Hvem er hypnoterapi for?
          </h2>
          <p className="text-muted leading-relaxed mb-3">
            Hypnoterapi anvendes af personer, der ønsker at arbejde med
            bestemte oplevelser, reaktioner eller mønstre på en struktureret
            og rolig måde.
          </p>
          <p className="text-muted leading-relaxed">
            Der kræves ingen tidligere erfaring med hypnose.
          </p>
        </section>

        {/* CTA */}
        <section className="bg-white p-6 rounded-lg shadow-sm text-center">
          <h2 className="text-h2 font-light mb-4">
            Ønsker du at afklare, om hypnoterapi kan være relevant?
          </h2>
          <p className="text-muted mb-6">
            Du er velkommen til at tage kontakt for en indledende afklaring.
          </p>
          <a
            href="/kontakt"
            className="inline-block bg-accent text-white px-6 py-3 rounded-lg hover:bg-accent/90 transition"
          >
            Kontakt mig
          </a>
        </section>
      </main>

      <Footer />
    </div>
  );
}
