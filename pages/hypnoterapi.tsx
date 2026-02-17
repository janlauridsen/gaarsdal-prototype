// pages/hypnoterapi.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Hypnoterapi() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <Head>
        <title>Hypnoterapi — Gaarsdal Hypnoterapi</title>
        <meta
          name="description"
          content="En nøgtern og struktureret tilgang til hypnoterapi i Birkerød. Afklaring før du starter. Fokus på mønstre, uro, søvn og vaner."
        />
      </Head>

      <Header />

      <main className="max-w-3xl mx-auto px-6 py-24">
        {/* HERO */}
        <h1 className="text-h1 font-light mb-6">Hypnoterapi</h1>
        <p className="text-base-lg text-muted mb-10">
          Hypnoterapi kan være relevant, når du forstår problemet rationelt, men
          alligevel oplever, at de samme reaktioner bliver ved. Vi arbejder
          roligt og konkret – med afklaring, fokus og tydelige rammer.
        </p>

        {/* HVAD ER HYPNOTERAPI */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-10">
          <h2 className="text-h2 font-light mb-4">
            Hvad hypnoterapi er (og ikke er)
          </h2>
          <p className="text-muted leading-relaxed mb-4">
            Hypnose er ikke søvn og ikke kontroltab. Du er vågen, bevidst og kan
            stoppe når som helst. I praksis handler det om fokuseret
            opmærksomhed, hvor automatiske reaktioner og vaner ofte kan justeres
            mere direkte end ved viljestyrke alene.
          </p>
          <p className="text-muted leading-relaxed">
            Hypnose er for mig en metode – ikke en oplevelse. Vi arbejder konkret
            med det, du ønsker skal være anderledes i din hverdag.
          </p>
        </section>

        {/* HVORDAN JEG ARBEJDER */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-10">
          <h2 className="text-h2 font-light mb-4">Hvordan jeg arbejder</h2>
          <p className="text-muted leading-relaxed mb-4">
            Forløbet er roligt og struktureret. Vi tager udgangspunkt i, hvad der
            konkret sker for dig i de situationer, du gerne vil ændre. Tempoet er
            dit, og der er ikke standardløsninger.
          </p>
          <p className="text-muted leading-relaxed">
            Typisk starter vi med en kort afklaring og målretning: hvad vil du
            have mere af, mindre af – og hvad skal stoppe med at tage energi.
            Derefter arbejder vi med fokus og indre processer under hypnose, og
            afslutter med en kort evaluering af næste skridt.
          </p>
        </section>

        {/* HVAD JEG TYPISK ARBEJDER MED */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-10">
          <h2 className="text-h2 font-light mb-4">
            Hvad jeg typisk arbejder med
          </h2>
          <ul className="list-disc ml-6 text-muted space-y-2 mb-4">
            <li>Stress, indre uro og tankemylder</li>
            <li>Søvnproblemer og uro før sengetid</li>
            <li>Vaner og reaktionsmønstre, der er svære at ændre alene</li>
            <li>Bekymringer og tilbagevendende mentale loops</li>
            <li>Præstationspres og mentale blokeringer</li>
            <li>Følelsesmæssige reaktioner, der fylder mere end ønsket</li>
            <li>Afklaring i livssituationer eller overgange</li>
          </ul>
          <p className="text-muted leading-relaxed">
            Formålet er ikke at blive “fikset”, men at skabe bevægelse og flere
            handlemuligheder – i et tempo der er realistisk og meningsfuldt.
          </p>
        </section>

        {/* HVEM DET PASSER TIL */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-10">
          <h2 className="text-h2 font-light mb-4">Hvem det passer bedst til</h2>
          <p className="text-muted mb-4">
            Min tilgang giver især mening for dig, hvis du:
          </p>
          <ul className="list-disc ml-6 text-muted space-y-2 mb-4">
            <li>er vant til at tænke selv og tage ansvar</li>
            <li>har prøvet at forstå problemet uden at det ændrede noget</li>
            <li>foretrækker en nøgtern, respektfuld stil frem for store løfter</li>
            <li>ønsker ro og klarhed mere end motiverende peptalks</li>
          </ul>
          <p className="text-muted leading-relaxed">
            Hvis du søger en akut indsats eller behandling i sundhedssystemet, er
            det ofte bedre at starte et andet sted.
          </p>
        </section>

        {/* FAQ */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-10">
          <h2 className="text-h2 font-light mb-4">Spørgsmål jeg ofte får</h2>

          <div className="space-y-5">
            <div>
              <h3 className="font-medium mb-1">
                “Kan jeg være i kontrol under hypnose?”
              </h3>
              <p className="text-muted leading-relaxed">
                Ja. Du er vågen og bevidst, og du kan stoppe eller holde pause når
                som helst. Vi arbejder inden for en aftalt ramme.
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-1">
                “Hvad hvis jeg tænker for meget eller har svært ved at slappe af?”
              </h3>
              <p className="text-muted leading-relaxed">
                Det er almindeligt. Vi tilpasser tempoet og arbejder med det, der
                faktisk sker for dig – ikke med en idé om, hvordan det “burde”
                føles.
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-1">“Skal jeg have prøvet hypnose før?”</h3>
              <p className="text-muted leading-relaxed">
                Nej. Det vigtigste er, at du ønsker at arbejde konkret med det,
                der gentager sig, og at vi starter med en afklaring af relevans og
                forventninger.
              </p>
            </div>
          </div>
        </section>

        {/* PRAKTISK */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-10">
          <h2 className="text-h2 font-light mb-4">Klinik</h2>
          <p className="text-muted mb-2">Adresse: Bakkevej 36, 3460 Birkerød.</p>
          <p className="text-muted">
            Jeg har ofte klienter fra Rudersdal og nærområder som Holte, Farum og
            Allerød.
          </p>
        </section>

        {/* CTA */}
        <section className="bg-white p-6 rounded-lg shadow-sm text-center">
          <h2 className="text-h2 font-light mb-4">
            Vil du afklare, om hypnoterapi og min tilgang passer til dig?
          </h2>
          <p className="text-muted mb-6">
            Du er velkommen til at tage kontakt for en uforpligtende afklaring.
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Link
              href="/kontakt"
              className="inline-block bg-accent text-white px-6 py-3 rounded-lg hover:bg-accent/90 transition"
            >
              Kontakt for afklaring
            </Link>
            <a
              className="inline-block border border-accent text-accent px-6 py-3 rounded-lg hover:bg-accent/10 transition"
              href="https://www.facebook.com/groups/1056907644480600"
              target="_blank"
              rel="noopener noreferrer"
            >
              Facebook-gruppen
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
