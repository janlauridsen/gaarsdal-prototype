import Header from '../components/Header'
import Footer from '../components/Footer'

export default function Kontakt() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <Header />
      <main className="max-w-3xl mx-auto px-6 py-24">
        <h1 className="text-h1 font-light mb-6">Kontakt</h1>
        <p className="text-base-lg text-muted mb-6">Hvis du har spørgsmål eller ønsker at booke en tid, er du velkommen til at kontakte mig.</p>

        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <p className="mb-2"><strong>Telefon:</strong> +45 42 80 74 74</p>
          <p className="mb-2"><strong>E-mail:</strong> jan@gaarsdal.net</p>
          <p className="mb-2"><strong>Adresse:</strong> Bakkevej 36, 3460 Birkerød</p>
        </div>

        <div className="mb-6">
          <a href="#" className="inline-block bg-accent text-white rounded-lg px-6 py-3 font-medium">Book tid</a>
        </div>

        <div className="text-xs text-muted">Ved kontakt accepterer du, at oplysninger behandles i forbindelse med din henvendelse. Læs vores privatlivspolitik for mere information.</div>
      </main>
      <Footer />
    </div>
  )
}
