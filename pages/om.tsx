import Header from '../components/Header'
import Footer from '../components/Footer'

export default function Om() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-24">
        <h1 className="text-h1 font-light mb-6">Om</h1>
        <p className="text-base-lg text-muted mb-6">Mit navn er Jan Lauridsen, og jeg arbejder professionelt med hypnoterapi i Birkerød. Min tilgang er rolig, jordnær og fagligt forankret. For mig handler hypnoterapi om at skabe et trygt rum, hvor du kan arbejde med det, der fylder — i et tempo og en dybde, der passer til dig.</p>

        <h2 className="text-2xl font-semibold mt-8 mb-3">Min tilgang</h2>
        <p className="text-muted">Jeg ser hypnoterapi som et samarbejde. Det er ikke noget, der gøres ved dig, men en proces vi er fælles om. Min opgave er at guide dig ind i en tilstand af ro og fokus og hjælpe dig med at bruge dine egne ressourcer på en mere klar og målrettet måde.</p>

        <h2 className="text-2xl font-semibold mt-8 mb-3">Kontakt</h2>
        <p className="text-muted">Telefon: +45 42 80 74 74 • E-mail: jan@gaarsdal.net</p>
        <p className="text-muted mt-2">Adresse: Bakkevej 36, 3460 Birkerød</p>
      </main>
      <Footer />
    </div>
  )
}
