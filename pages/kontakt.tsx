// pages/kontakt.tsx
import Head from "next/head";
import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Kontakt() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    website: "", // honeypot, må ikke udfyldes
  });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    if (!form.name || !form.email || !form.message) {
      setErrorMsg("Udfyld venligst navn, email og besked.");
      setStatus("error");
      return;
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setStatus("success");
        setForm({ name: "", email: "", phone: "", message: "", website: "" });
      } else {
        const txt = await res.text();
        setErrorMsg(txt || "Der opstod en fejl. Prøv igen senere.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Netværksfejl, prøv igen.");
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      <Head>
        <title>Book gratis forsamtale (30 min) | Gaarsdal</title>
        <meta
          name="description"
          content="Book en gratis forsamtale på 30 minutter med Jan Gaarsdal - telefon eller fysisk i Birkerød. Find ud af om hypnoterapi passer til dig."
        />
        <link rel="canonical" href="https://gaarsdal.net/kontakt" />
        <meta property="og:title" content="Kontakt Gaarsdal Hypnoterapi" />
        <meta
          property="og:description"
          content="Kontakt Jan Gaarsdal for en uforpligtende afklaring. Hypnoterapi i Birkerød."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://gaarsdal.net/kontakt" />
        <meta
          property="og:image"
          content="https://gaarsdal.net/Gaarsdal.net_logo_brand.png"
        />
        <meta name="robots" content="index, follow" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ContactPage",
              name: "Kontakt og gratis forsamtale",
              description: "Book en gratis forsamtale på 30 minutter med Jan Gaarsdal - telefon eller fysisk i Birkerød. Find ud af om hypnoterapi passer til dig.",
              url: "https://gaarsdal.net/kontakt",
              provider: {
                "@type": "Person",
                name: "Jan Gaarsdal",
                url: "https://gaarsdal.net/om",
                telephone: "+4542807474",
              },
            }),
          }}
        />
      </Head>

      <Header />
      <main className="max-w-3xl mx-auto px-6 py-24">
        <h1 className="text-h1 font-light mb-4">Kontakt</h1>

        <p className="text-base-lg text-muted mb-10">
          Kontakt mig, hvis du vil afklare om hypnoterapi, og min tilgang, er
          relevant for dig.
        </p>

        {/* AFKLARING - øverst nu */}
        <section className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h2 className="font-medium mb-2">Hvad er en "afklaring"?</h2>
          <p className="text-muted mb-3">
            Formålet er at få et klart billede af, hvad der sker for dig, og
            om det giver mening at arbejde med det via hypnoterapi. Der er ingen
            forpligtelse.
          </p>
          <p className="text-muted mb-2">
            Hvis du skriver, kan du gerne kort nævne:
          </p>
          <ul className="list-disc ml-6 text-muted space-y-1 text-sm">
            <li>Hvad der gentager sig (situationer, reaktioner, mønstre)</li>
            <li>Hvad du ønsker mere af / mindre af</li>
            <li>Om der er noget, der "stjæler energi" lige nu</li>
          </ul>
        </section>

        {/* KONTAKTOPLYSNINGER */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h2 className="font-medium mb-4">Kontaktoplysninger</h2>
          <p className="text-muted mb-2">
            <strong>Telefon:</strong>{" "}
            <a href="tel:+4542807474" className="text-accent hover:underline">
              42 80 74 74
            </a>
          </p>
          <p className="text-muted mb-2">
            <strong>Email:</strong>{" "}
            <a
              href="mailto:jan@gaarsdal.net"
              className="text-accent hover:underline"
            >
              jan@gaarsdal.net
            </a>
          </p>
          <p className="text-muted">
            <strong>Adresse:</strong> Bakkevej 36, 3460 Birkerød
          </p>
        </div>

        {/* FORMULAR */}
        <section className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="font-medium mb-6">Send en besked</h2>

          {status === "success" ? (
            <div className="py-8 text-center">
              <p className="text-lg font-medium mb-2">Tak, din besked er modtaget.</p>
              <p className="text-muted">Jeg vender tilbage hurtigst muligt.</p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
              aria-label="Kontaktformular"
            >
              <div>
                <label className="block text-sm mb-1" htmlFor="name">
                  Navn *
                </label>
                <input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                  autoComplete="name"
                />
              </div>

              <div>
                <label className="block text-sm mb-1" htmlFor="email">
                  Email *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-sm mb-1" htmlFor="phone">
                  Telefon (valgfri)
                </label>
                <input
                  id="phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent"
                  autoComplete="tel"
                />
              </div>

              <div>
                <label className="block text-sm mb-1" htmlFor="message">
                  Besked *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows={6}
                  className="w-full border border-gray-200 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                />
              </div>

              {/* Honeypot - skjult for brugere, bots udfylder det */}
              <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }} aria-hidden="true">
                <label htmlFor="website">Udfyld ikke dette felt</label>
                <input
                  id="website"
                  name="website"
                  type="text"
                  value={form.website}
                  onChange={handleChange}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              {status === "error" && errorMsg && (
                <div role="alert" className="text-red-600 text-sm">
                  {errorMsg}
                </div>
              )}

              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  className="inline-block bg-accent text-white rounded-lg px-6 py-3 font-medium disabled:opacity-60 hover:bg-accent/90 transition"
                  disabled={status === "sending"}
                >
                  {status === "sending" ? "Sender…" : "Send besked"}
                </button>
              </div>

              <p className="text-xs text-muted mt-4">
                Ved at kontakte mig accepterer du, at dine oplysninger behandles i
                forbindelse med din henvendelse.
              </p>
            </form>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
