import Link from "next/link";

export default function Home() {
  return (
    <main className="bg-bg text-text">

      {/* HERO */}
      <section className="py-32 text-center px-6">
        <h1 className="text-h1 font-light mb-6 max-w-3xl mx-auto">
          Hypnoterapi til ro, klarhed og varig forandring
        </h1>

        <p className="text-base-lg text-muted max-w-2xl mx-auto mb-10">
          En tryg og nærværende tilgang til at arbejde med stress, søvn,
          vaner, tanker og indre tilstande. I et roligt tempo og med stor
          respekt for dine behov.
        </p>

        <div className="flex justify-center gap-4">
          <Link href="/kontakt">
            <a className="bg-accent text-white px-6 py-3 rounded-lg shadow hover:bg-accent/90 transition">
              Kontakt mig
            </a>
          </Link>

          <Link href="/hypnoterapi">
            <a className="border border-accent text-accent px-6 py-3 rounded-lg hover:bg-accent/10 transition">
              Læs mere
            </a>
          </Link>
        </div>
      </section>

      {/* HVAD KAN HYPNOTERAPI HJÆLPE MED */}
      <section className="py-24 px-6 bg-white">
        <h2 className="text-h2 font-light text-center mb-12">
          Hvad kan hypnoterapi hjælpe med?
        </h2>

        <div className="grid md:grid-cols-3 gap-10 max-w-5xl mx-auto">

          {[
            {
              title: "Stress & indre uro",
              text: "En rolig og struktureret tilgang til at reducere spændinger og skabe indre balance."
            },
            {
              title: "Søvnproblemer",
              text: "Hypnose kan hjælpe dig med at skabe ro, mindske mental støj og forbedre søvnkvaliteten."
            },
            {
              title: "Vaner & mønstre",
              text: "Støtte til rygestop, spisemønstre og andre vaner du gerne vil ændre."
            },
            {
              title: "Selvfølelse & selvtillid",
              text: "En nænsom måde at arbejde med indre blokeringer og styrke din egen oplevelse af dig selv."
            },
            {
              title: "Bekymringer & præstationspres",
              text: "Skab ro, klarhed og kontrol i situationer hvor presset fylder meget."
            },
            {
              title: "Følelsesmæssig balance",
              text: "En tryg ramme til at arbejde med svære følelser i dit tempo."
            }
          ].map((item) => (
            <div
              key={item.title}
              className="bg-bg rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <h3 className="text-xl font-medium mb-3">{item.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{item.text}</p>
            </div>
          ))}

        </div>
      </section>

      {/* OM GAARSDAL HYPNOTERAPI */}
      <section className="py-24 px-6 max-w-4xl mx-auto">
        <h2 className="text-h2 font-light text-center mb-10">Om Gaarsdal Hypnoterapi</h2>

        <p className="text-base-lg text-muted leading-relaxed mb-6">
          Jeg hedder Jan Erik Gaarsdal Lauridsen. Med mange års erfaring som leder,
          coach, formidler og hypnoterapeut arbejder jeg med en rolig, jordnær og
          dybt respektfuld tilgang til menneskelig udvikling.
        </p>

        <p className="text-base-lg text-muted leading-relaxed mb-6">
          Jeg kombinerer intuition, livserfaring, psykologisk indsigt,
          kommunikative kompetencer og en stærk evne til at forstå komplekse
          følelsesmæssige temaer. Det giver en tryg, professionel og nærværende ramme.
        </p>

        <p className="text-base-lg text-muted leading-relaxed">
          Målet er ikke hurtige løsninger — men meningsfuld og bæredygtig forandring,
          i dit tempo.
        </p>
      </section>

      {/* SÅDAN FOREGÅR EN SESSION */}
      <section className="py-24 px-6 bg-white">
        <h2 className="text-h2 font-light text-center mb-12">
          Sådan foregår en session
        </h2>

        <div className="grid md:grid-cols-3 gap-10 max-w-5xl mx-auto">

          {[
            {
              step: "1. Samtale",
              text:
                "Vi starter med en rolig og tryg samtale, hvor du fortæller om dit tema og dine mål."
            },
            {
              step: "2. Hypnose",
              text:
                "Herefter guides du ind i en behagelig, fokuseret tilstand, hvor vi arbejder med det vigtige."
            },
            {
              step: "3. Integration",
              text:
                "Du vendes roligt tilbage til vågen tilstand, så oplevelsen lander klart og trygt."
            }
          ].map((item) => (
            <div key={item.step} className="p-6 bg-bg rounded-xl shadow-sm">
              <h3 className="text-xl font-medium mb-3">{item.step}</h3>
              <p className="text-muted text-sm leading-relaxed">{item.text}</p>
            </div>
          ))}

        </div>
      </section>

      {/* CTA-BLOK */}
      <section className="py-24 px-6 text-center">
        <div className="bg-white border border-gray-200 p-12 rounded-2xl shadow-sm max-w-3xl mx-auto">
          <h2 className="text-h2 font-light mb-6">
            Er du nysgerrig på, hvordan hypnoterapi kan hjælpe dig?
          </h2>

          <p className="text-base-lg text-muted max-w-2xl mx-auto mb-10">
            Du er altid velkommen til at stille spørgsmål eller booke en session.
          </p>

          <div className="flex justify-center gap-4">
            <Link href="/kontakt">
              <a className="bg-accent text-white px-6 py-3 rounded-lg shadow hover:bg-accent/90 transition">
                Kontakt mig
              </a>
            </Link>

            <Link href="/hypnoterapi">
              <a className="border border-accent text-accent px-6 py-3 rounded-lg hover:bg-accent/10 transition">
                Læs mere
              </a>
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
