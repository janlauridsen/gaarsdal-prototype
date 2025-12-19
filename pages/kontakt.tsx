// pages/kontakt.tsx
import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Kontakt() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
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
        setForm({ name: "", email: "", phone: "", message: "" });
      } else {
        const txt = await res.text();
        setErrorMsg(txt || "Der opstod en fejl. Prøv igen senere.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Netværksfejl — prøv igen.");
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      <Header />

      <main className="max-w-3xl mx-auto px-6 py-24">
        <h1 className="text-h1 font-light mb-6">Kontakt</h1>

        <p className="text-base-lg text-muted mb-10 max-w-2xl">
          Du er velkommen til at tage kontakt, hvis du har spørgsmål eller er
          nysgerrig på et forløb. Der er ingen forpligtelse — blot en mulighed for
          at tage en indledende dialog.
        </p>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="font-medium mb-3">Kontaktoplysninger</h2>
            <p className="text-muted mb-2">
              <strong>Telefon:</strong>{" "}
              <a
                href="tel:+4542807474"
                className="text-accent hover:underline"
              >
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

          <aside className="bg-bg p-6 rounded-2xl border border-gray-200">
            <h3 className="font-medium mb-2">Om kontakt og booking</h3>
            <p className="text-muted text-sm leading-relaxed">
              Du kan ringe, skrive en mail eller bruge formularen herunder.
              Henvendelsen bruges udelukkende til at afklare rammer og eventuelle
              næste skridt — i dit tempo.
            </p>
          </aside>
        </div>

        {/* FORM */}
        <section className="bg-bg border border-gray-200 rounded-3xl p-8">
          <h2 className="font-medium mb-2">Skriv en besked</h2>

          <p className="text-sm text-muted mb-6 max-w-xl">
            Du behøver ikke formulere noget bestemt. Et par linjer er helt
            tilstrækkeligt.
          </p>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
            aria-label="Kontaktformular"
          >
            <div>
              <label className="block text-sm mb-1">Navn *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="
                  w-full rounded-xl px-4 py-3
                  bg-white border border-gray-200
                  focus:outline-none focus:ring-2 focus:ring-accent/40
                "
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Email *</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="
                  w-full rounded-xl px-4 py-3
                  bg-white border border-gray-200
                  focus:outline-none focus:ring-2 focus:ring-accent/40
                "
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Telefon (valgfri)</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="
                  w-full rounded-xl px-4 py-3
                  bg-white border border-gray-200
                  focus:outline-none focus:ring-2 focus:ring-accent/40
                "
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Besked *</label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                rows={6}
                className="
                  w-full rounded-xl px-4 py-3
                  bg-white border border-gray-200
                  focus:outline-none focus:ring-2 focus:ring-accent/40
                "
                required
              />
            </div>

            {errorMsg && (
              <div className="text-sm text-red-600">{errorMsg}</div>
            )}

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={status === "sending"}
                className="
                  bg-accent text-white
                  rounded-xl px-6 py-3 font-medium
                  disabled:opacity-60 hover:bg-accent/90 transition
                "
              >
                {status === "sending" ? "Sender…" : "Send besked"}
              </button>

              {status === "success" && (
                <div className="text-sm text-green-600">
                  Tak — din besked er modtaget. Jeg vender tilbage snart.
                </div>
              )}
            </div>

            <p className="text-xs text-muted mt-4 max-w-lg">
              Dine oplysninger bruges udelukkende i forbindelse med denne
              henvendelse og deles ikke med tredjeparter.
            </p>
          </form>
        </section>
      </main>

      <Footer />
    </div>
  );
}
