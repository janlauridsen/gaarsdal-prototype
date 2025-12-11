import Header from '../components/Header'
import { Hero } from '../components/Hero'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <Header />
      <main>
        <Hero
          title={'Hypnoterapi til ro, fokus og varig forandring'}
          lead={'En behandling, hvor faglighed og menneskelig nærvær går hånd i hånd. Jeg hjælper dig med at skabe klarhed, reducere indre uro og arbejde målrettet med de udfordringer, der fylder for dig.'}
          primary={{ href: '/kontakt', label: 'Book tid' }}
          secondary={{ href: '/kontakt', label: 'Kontakt mig' }}
        />

        <section className="max-w-5xl mx-auto px-6 py-14">
          <h2 className="text-2xl font-semibold mb-4">Hvad kan hypnoterapi hjælpe med?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="font-medium mb-2">Angst og uro</h3>
              <p className="text-muted">Arbejde med tankemønstre og indre ro.</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="font-medium mb-2">Søvn & stress</h3>
              <p className="text-muted">Støtte til bedre søvn og stressreduktion.</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="font-medium mb-2">Vaner & mønstre</h3>
              <p className="text-muted">Arbejde med overspisning, lavt selvværd m.m.</p>
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 py-10">
          <h2 className="text-2xl font-semibold mb-4">Hvordan foregår en session?</h2>
          <p className="text-muted">En session starter med en kort samtale, hvorefter jeg guider dig ind i en fokuseret og afslappet tilstand. Vi arbejder med det, du ønsker at ændre, i et tempo, der passer til dig.</p>
        </section>

      </main>
      <Footer />
    </div>
  )
}
