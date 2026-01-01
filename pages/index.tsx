import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function runChat() {
    if (!input.trim()) return;

    setLoading(true);
    setOutput(null);

    try {
      const res = await fetch("/chatbot/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });

      const data = await res.json();
      setOutput(data.output);
    } catch {
      setOutput("Der opstod en fejl. Prøv igen senere.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="bg-bg text-text">

      {/* HERO */}
      <section className="py-32 text-center px-6">
        <h1 className="text-h1 font-light mb-6 max-w-3xl mx-auto">
          Hypnoterapi – en rolig og struktureret tilgang
        </h1>

        <p className="text-base-lg text-muted max-w-2xl mx-auto mb-10">
          Hypnoterapi kan anvendes i arbejdet med forskellige former for
          mentale og følelsesmæssige problemstillinger. Forløb foregår
          i et roligt tempo og med respekt for den enkelte situation.
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

      {/* CHATBOT */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto border border-gray-200 rounded-2xl p-8 shadow-sm">
          <h2 className="text-h2 font-light mb-4 text-center">
            Refleksiv samtale
          </h2>

          <p className="text-muted text-sm text-center mb-6">
            Her kan du formulere det, der fylder, og få en foreløbig refleksion.
            Dette er ikke rådgivning eller behandling, men en rolig samtalestøtte.
          </p>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Skriv frit her…"
            rows={5}
            className="w-full p-4 border border-gray-300 rounded-lg text-sm mb-4"
          />

          <div className="text-center">
            <button
              onClick={runChat}
              disabled={loading}
              className="bg-accent text-white px-6 py-2 rounded-lg shadow hover:bg-accent/90 transition disabled:opacity-50"
            >
              {loading ? "Tænker…" : "Send"}
            </button>
          </div>

          {output && (
            <div className="mt-8 bg-bg p-6 rounded-xl border border-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
              {output}
            </div>
          )}
        </div>
      </section>

      {/* ANVENDELSESOMRÅDER */}
      <section className="py-24 px-6 bg-white">
        <h2 className="text-h2 font-light text-center mb-4">
          Typiske anvendelsesområder for hypnoterapi
        </h2>

        <p className="text-sm text-muted text-center max-w-3xl mx-auto mb-12">
          Hypnoterapi anvendes i forskellige sammenhænge. Relevansen
          afhænger altid af den konkrete problemstilling og den samlede kontekst.
        </p>

        <div className="grid md:grid-cols-3 gap-10 max-w-5xl mx-auto">
          {[
            { title: "Stress og indre uro", text: "Anvendes ofte i arbejde med vedvarende spænding, indre uro og belastningsreaktioner." },
            { title: "Søvnrelaterede vanskeligheder", text: "Kan indgå i arbejde med søvnproblemer, herunder indsovning og natlig uro." },
            { title: "Vaner og gentagelsesmønstre", text: "Anvendes i forbindelse med vaner eller mønstre, som opleves svære at ændre." },
            { title: "Selvoplevelse", text: "Kan anvendes i arbejde med oplevelsen af sig selv og egne reaktioner." },
            { title: "Bekymringer og præstationspres", text: "Relevant i situationer med vedvarende mentalt pres eller præstationsrelaterede belastninger." },
            { title: "Følelsesmæssige reaktioner", text: "Anvendes i nogle tilfælde i arbejde med følelsesmæssige reaktioner." }
          ].map((item) => (
            <div key={item.title} className="bg-bg rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-medium mb-3">{item.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* OM */}
      <section className="py-24 px-6 max-w-4xl mx-auto">
        <h2 className="text-h2 font-light text-center mb-10">
          Om Gaarsdal Hypnoterapi
        </h2>

        <p className="text-base-lg text-muted leading-relaxed mb-6">
          Jeg hedder Jan Erik Gaarsdal Lauridsen. Med erfaring som leder,
          coach, formidler og hypnoterapeut arbejder jeg med en rolig,
          jordnær og respektfuld tilgang.
        </p>

        <p className="text-base-lg text-muted leading-relaxed mb-6">
          Mit arbejde er præget af psykologisk indsigt, kommunikative
          kompetencer og erfaring med komplekse menneskelige problemstillinger.
          Det danner rammen for et professionelt og struktureret forløb.
        </p>

        <p className="text-base-lg text-muted leading-relaxed">
          Fokus er på grundig afklaring og et tempo, der giver plads
          til refleksion og forståelse.
        </p>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <div className="bg-white border border-gray-200 p-12 rounded-2xl shadow-sm max-w-3xl mx-auto">
          <h2 className="text-h2 font-light mb-6">
            Ønsker du at afklare, om hypnoterapi kan være relevant?
          </h2>

          <p className="text-base-lg text-muted max-w-2xl mx-auto mb-10">
            Du er velkommen til at tage kontakt for spørgsmål eller
            en indledende afklaring.
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
