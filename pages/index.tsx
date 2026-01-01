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
      const res = await fetch("/api/chat", { // ✅ KORREKT ENDPOINT
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
          Hypnoterapi – en struktureret tilgang
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
            Dette er ikke rådgivning eller behandling, men en samtalestøtte.
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

      {/* resten uændret */}
    </main>
  );
}
