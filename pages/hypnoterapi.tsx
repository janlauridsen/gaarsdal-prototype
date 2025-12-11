import Header from '../components/Header'
import Footer from '../components/Footer'

export default function Hypnoterapi() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <Header />
      <main className="max-w-4xl mx-auto px-6 py-24">
        <h1 className="text-h1 font-light mb-6">Hvad er hypnoterapi?</h1>
        <p className="text-base-lg text-muted mb-6">Hypnoterapi er en terapeutisk metode, hvor du guides ind i en rolig og fokuseret tilstand. Det gør det lettere at arbejde med tanker, følelser og vaner, som normalt kan være svære at få fat i i hverdagen. Du er hele tiden til stede og i kontrol.</p>

        <h2 className="text-2xl font-semibold mt-8 mb-3">Hvad kan det hjælpe med?</h2>
        <ul className="list-disc pl-6 text-muted">
          <li>Anxiety og indre uro</li>
          <li>Stress og overbelastning</li>
          <li>Søvnproblemer</li>
          <li>Tankemylder</li>
          <li>Lavt selvværd</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-3">Hvordan foregår en session?</h2>
        <p className="text-muted">En session starter med en samtale, hvor vi aftaler mål for forløbet. Du guides ind i en fokuseret tilstand, og vi arbejder med dine ønsker. Vi tilpasser altid forløbet individuelt.</p>

        <div className="mt-8">
          <a href="/kontakt" className="inline-block bg-accent text-white rounded-lg px-6 py-3 font-medium">Book tid</a>
        </div>
      </main>
      <Footer />
    </div>
  )
}
