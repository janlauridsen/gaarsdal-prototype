// pages/hypnoterapi.tsx
import Head from "next/head";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Hypnoterapi() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <Head>
        <title>Hypnoterapi – metode, forløb og FAQ | Gaarsdal</title>
        <meta
          name="description"
          content="En nøgtern og struktureret tilgang til hypnoterapi i Birkerød. Læs om metoden, hvad der sker i en session, og svar på de spørgsmål jeg oftest får."
        />
        <link rel="canonical" href="https://gaarsdal.net/hypnoterapi" />
        <meta property="og:title" content="Hypnoterapi – metode og forløb | Gaarsdal" />
        <meta
          property="og:description"
          content="En nøgtern og struktureret tilgang til hypnoterapi i Birkerød. Afklaring før du starter."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://gaarsdal.net/hypnoterapi" />
        <meta
          property="og:image"
          content="https://gaarsdal.net/Gaarsdal.net_logo_brand.png"
        />
        <meta name="robots" content="index, follow" />
      </Head>

      <Header />

      <main className="max-w-3xl mx-auto px-6 py-24">
        {/* HERO */}
        <h1 className="text-h1 font-light mb-6">Hypnoterapi</h1>
        <p className="text-base-lg text-muted mb-12">
          Hypnoterapi kan være relevant, når du forstår problemet rationelt, men
          alligevel oplever, at de samme reaktioner bliver ved. Her kan du læse
          mere om metoden, hvad der faktisk sker i en session, og hvad du kan
          forvente af et forløb.
        </p>

        {/* HVAD ER HYPNOTERAPI */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-10">
          <h2 className="text-h2 font-light mb-4">
            Hvad hypnoterapi er (og ikke er)
          </h2>
          <p className="text-muted leading-relaxed mb-4">
            Hypnose er ikke søvn og ikke kontroltab. Du er vågen, bevidst og kan
            stoppe når som helst. I praksis handler det om fokuseret
            opmærksomhed – en tilstand, hvor opmærksomheden er indadvendt og
            koncentreret. I den tilstand er det ofte lettere at justere
            automatiske reaktioner og vaner end ved viljestyrke alene.
          </p>
          <p className="text-muted leading-relaxed mb-4">
            Hypnose er for mig en metode – ikke en oplevelse. Vi arbejder konkret
            med det, du ønsker skal være anderledes i din hverdag. Der er ingen
            dramatik, ingen "djupt i søvn"-kommandoer og ingen løfter om hurtige
            resultater.
          </p>
          <p className="text-muted leading-relaxed">
            Det kræver ikke, at du er let påvirkelig, spirituelt indstillet eller
            særlig afslappet. Det kræver, at du er motiveret for at arbejde konkret
            med det, der gentager sig.
          </p>
        </section>

        {/* HVAD SKER DER I EN SESSION */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-10">
          <h2 className="text-h2 font-light mb-4">Hvad sker der i en session?</h2>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center font-medium text-sm">
                1
              </div>
              <div>
                <h3 className="font-medium mb-1">Afklaring og målretning</h3>
                <p className="text-muted text-sm leading-relaxed">
                  Vi taler konkret om, hvad der sker for dig – ikke hvad det
                  sandsynligvis handler om, men hvad du faktisk oplever i de
                  situationer, du vil ændre. Hvad vil du have mere af? Hvad skal
                  stoppe med at tage energi?
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center font-medium text-sm">
                2
              </div>
              <div>
                <h3 className="font-medium mb-1">Hypnosearbejde</h3>
                <p className="text-muted text-sm leading-relaxed">
                  Du sidder eller ligger komfortabelt. Jeg guider dig ind i en
                  tilstand af fokuseret ro. Vi arbejder med de mønstre eller
                  reaktioner, vi har identificeret – inden for den ramme, vi har
                  aftalt. Du er bevidst og kan stoppe eller holde pause når som
                  helst.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center font-medium text-sm">
                3
              </div>
              <div>
                <h3 className="font-medium mb-1">Evaluering</h3>
                <p className="text-muted text-sm leading-relaxed">
                  Kort afrunding: hvad gav mening, hvad mærkede du, og hvad er
                  næste realistiske skridt. Ingen store analyser – bare det, der
                  faktisk er nyttigt at tage med.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ET FORLOEB */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-10">
          <h2 className="text-h2 font-light mb-4">Hvad er et forløb?</h2>
          <p className="text-muted leading-relaxed mb-4">
            Vi starter med en afklaring – en kortere samtale, hvor vi vurderer om
            hypnoterapi er den rigtige tilgang for dig og din situation. Der er
            ingen forpligtelse ved at tage kontakt.
          </p>
          <p className="text-muted leading-relaxed mb-4">
            Et typisk forløb er 3–6 sessioner, men det afhænger af, hvad vi
            arbejder med. Tempoet er dit. Der er ingen standardpakker, og vi
            justerer undervejs ud fra, hvad der faktisk virker.
          </p>
          <p className="text-muted leading-relaxed">
            Jeg tilbyder sessioner i min klinik på Bakkevej 36, 3460 Birkerød.
          </p>
        </section>

        {/* FAQ */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-10">
          <h2 className="text-h2 font-light mb-6">Spørgsmål jeg ofte får</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">
                "Kan jeg være i kontrol under hypnose?"
              </h3>
              <p className="text-muted leading-relaxed text-sm">
                Ja. Du er vågen og bevidst, og du kan stoppe eller holde pause
                når som helst. Vi arbejder inden for en aftalt ramme, og intet
                sker uden din aktive deltagelse.
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2">
                "Hvad hvis jeg tænker for meget eller har svært ved at slappe af?"
              </h3>
              <p className="text-muted leading-relaxed text-sm">
                Det er meget almindeligt. Hypnoterapi kræver ikke, at du kan
                "slukke hjernen". Vi tilpasser tilgangen til det, der faktisk
                sker for dig – ikke til en idé om, hvordan det burde føles.
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2">"Skal jeg have prøvet hypnose før?"</h3>
              <p className="text-muted leading-relaxed text-sm">
                Nej. Det vigtigste er, at du ønsker at arbejde konkret med noget
                bestemt, og at vi starter med en ordentlig afklaring af relevans og
                forventninger.
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2">
                "Er hypnoterapi det samme som psykoterapi?"
              </h3>
              <p className="text-muted leading-relaxed text-sm">
                Nej. Hypnoterapi arbejder primært med automatiske mønstre og
                reaktioner via fokuseret opmærksomhed. Det er ikke samtaleterapi
                og ikke behandling af psykiatriske lidelser. Hvis du er i tvivl om,
                hvad der er den rette tilgang for dig, er en indledende afklaring
                det bedste udgangspunkt.
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2">
                "Hvornår er hypnoterapi ikke det rigtige valg?"
              </h3>
              <p className="text-muted leading-relaxed text-sm">
                Hvis du søger akut krisestøtte, behandling i det psykiatriske
                system eller et forløb med en autoriseret psykolog, er det bedre
                at starte der. Jeg er ikke psykolog, og hypnoterapi er ikke
                behandling i sundhedsfaglig forstand.
              </p>
            </div>
          </div>
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
          <p className="text-muted text-sm mt-6 mb-3">
            Ikke sikker på om det er relevant for dig?
          </p>
          <Link
            href="/#afklaring"
            className="inline-block border border-gray-300 text-muted px-6 py-3 rounded-lg hover:bg-gray-50 transition"
          >
            Svar på et par spørgsmål først →
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
