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
          En effektiv, rolig og tryg metode til at arbejde med forandring og indre balance.
        </p>

        {/* HVAD ER HYPNOTERAPI */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-10">
          <h2 className="text-h2 font-light mb-4">Hvad er hypnoterapi?</h2>
          <p className="text-muted leading-relaxed mb-4">
            Hypnoterapi er en terapiform, hvor du gennem dyb afslapning og fokuseret opmærksomhed
            får lettere adgang til dine egne tanke- og følelsesmønstre. Du er vågen, til stede
            og kan til enhver tid afbryde processen.
          </p>
          <p className="text-muted leading-relaxed">
            Det føles ofte som en guidet meditation, hvor du får mulighed for at arbejde med det,
            der fylder — på en mere direkte og effektiv måde.
          </p>
        </section>

        {/* HVAD KAN DET HJÆLPE MED */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-10">
          <h2 className="text-h2 font-light mb-4">Hvad kan hypnoterapi hjælpe med?</h2>
          <ul className="list-disc ml-6 text-muted space-y-2">
            <li>Stress og indre uro</li>
            <li>Søvnproblemer</li>
            <li>Lavt selvværd</li>
            <li>Præstationspres</li>
            <li>Angst og bekymringer</li>
            <li>Vaner og uhensigtsmæssige mønstre</li>
            <li>Tankemylder</li>
            <li>Følelsesmæssige blokeringer</li>
          </ul>
        </section>

        {/* HVORDAN FOREGÅR DET */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-10">
          <h2 className="text-h2 font-light mb-4">Hvordan foregår en session?</h2>

          <p className="text-muted mb-4">
            En session foregår i rolige omgivelser i min praksis på Bakkevej 36 i Birkerød.
          </p>

          <ol className="list-decimal ml-6 text-muted space-y-2">
            <li>Kort samtale: hvad fylder hos dig lige nu?</li>
            <li>En rolig guidning i hypnose</li>
            <li>Terapeutisk arbejde med dit tema</li>
            <li>Afrunding og hjælp til næste skridt</li>
          </ol>

          <p className="text-muted mt-4">
            Du er ikke “væk” — du er blot i en mere fokuseret og afslappet tilstand.
          </p>
        </section>

        {/* SIKKERHED */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-10">
          <h2 className="text-h2 font-light mb-4">Er hypnoterapi sikkert?</h2>
          <p className="text-muted leading-relaxed">
            Ja. Hypnoterapi er en veldokumenteret metode, og du bevarer altid din egen kontrol.
            Du kan tale, åbne øjnene, afbryde eller stille spørgsmål undervejs. Min opgave er
            at skabe et trygt rum og støtte dig gennem processen.
          </p>
        </section>

        {/* HVEM ER DET FOR */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-10">
          <h2 className="text-h2 font-light mb-4">Hvem er hypnoterapi for?</h2>
          <p className="text-muted leading-relaxed mb-3">
            Hypnoterapi er for dig, der ønsker forandring, men måske oplever at sidde fast —
            eller for dig, der gerne vil arbejde med dig selv på en rolig og effektiv måde.
          </p>
          <p className="text-muted leading-relaxed">
            Der kræves ingen tidligere erfaring.
          </p>
        </section>

        {/* AFSLUTNING / CTA */}
        <section className="bg-white p-6 rounded-lg shadow-sm text-center">
          <h2 className="text-h2 font-light mb-4">Er du nysgerrig på, om hypnoterapi kan hjælpe dig?</h2>
          <p className="text-muted mb-6">
            Du er velkommen til at kontakte mig for en uforpligtende samtale.
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
