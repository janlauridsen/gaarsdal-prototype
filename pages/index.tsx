import Link from "next/link";
import Chatbot from "../components/Chatbot";

export default function Home() {
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

      {/* … ALT DIT EKSISTERENDE INDHOLD ER UÆNDRET … */}

      {/* CHATBOT */}
      <section className="py-24 px-6 bg-bg border-t border-gray-200">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-h2 font-light text-center mb-6">
            Afklarende chatbot
          </h2>

          <p className="text-sm text-muted text-center mb-10">
            Brug chatbotten til en indledende, uforpligtende afklaring.
          </p>

          <Chatbot />
        </div>
      </section>

    </main>
  );
}
