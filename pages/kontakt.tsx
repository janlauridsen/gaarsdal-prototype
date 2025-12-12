// pages/kontakt.tsx
import { useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function Kontakt() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    setErrorMsg('')

    // Basic client-side validation
    if (!form.name || !form.email || !form.message) {
      setErrorMsg('Udfyld venligst navn, email og besked.')
      setStatus('error')
      return
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setStatus('success')
        setForm({ name: '', email: '', phone: '', message: '' })
      } else {
        const txt = await res.text()
        setErrorMsg(txt || 'Der opstod en fejl. Prøv igen senere.')
        setStatus('error')
      }
    } catch (err) {
      setErrorMsg('Netværksfejl — prøv igen.')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      <Header />
      <main className="max-w-3xl mx-auto px-6 py-24">
        <h1 className="text-h1 font-light mb-6">Kontakt</h1>

        <p className="text-base-lg text-muted mb-6">
          Hvis du har spørgsmål eller ønsker at booke en tid, er du velkommen til at kontakte mig.
          Jeg svarer som regel samme dag.
        </p>

        <div className="grid md:grid-cols-2 gap-8 mb-10">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="font-medium mb-2">Kontaktoplysninger</h2>
            <p className="text-muted mb-2"><strong>Telefon:</strong> <a href="tel:+4542807474" className="text-accent hover:underline">42 80 74 74</a></p>
            <p className="text-muted mb-2"><strong>Email:</strong> <a href="mailto:jan@gaarsdal.net" className="text-accent hover:underline">jan@gaarsdal.net</a></p>
            <p className="text-muted mb-2"><strong>Adresse:</strong> Bakkevej 36, 3460 Birkerød</p>
          </div>

          <aside className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="font-medium mb-2">Hvordan foregår booking?</h3>
            <p className="text-muted">Du kan ringe, skrive en mail eller bruge formularen. Jeg kontakter dig for at aftale tid og formål med sessionen.</p>
          </aside>
        </div>

        <section className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="font-medium mb-4">Send en besked</h2>

          <form onSubmit={handleSubmit} className="space-y-4" aria-label="Kontaktformular">
            <div>
              <label className="block text-sm mb-1">Navn *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent"
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
                className="w-full border border-gray-200 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Telefon (valgfri)</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Besked *</label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                rows={6}
                className="w-full border border-gray-200 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>

            {errorMsg && <div className="text-red-600">{errorMsg}</div>}

            <div className="flex items-center gap-4">
              <button
                type="submit"
                className="inline-block bg-accent text-white rounded-lg px-6 py-3 font-medium disabled:opacity-60"
                disabled={status === 'sending'}
              >
                {status === 'sending' ? 'Sender…' : 'Send besked'}
              </button>

              {status === 'success' && <div className="text-green-600">Tak — din besked er modtaget, jeg vender tilbage snart.</div>}
            </div>

            <p className="text-xs text-muted mt-4">
              Ved kontakt accepterer du, at oplysninger behandles i forbindelse med din henvendelse.
            </p>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  )
}
