import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Header({ siteTitle = 'Gaarsdal Hypnoterapi', menu = [{label:'Forside',href:'/'},{label:'Hypnoterapi',href:'/hypnoterapi'},{label:'Om',href:'/om'},{label:'Kontakt',href:'/kontakt'}] }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 60)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`fixed w-full z-50 transition-all duration-400 ${scrolled ? 'backdrop-blur-sm bg-white/60 shadow-sm' : 'bg-transparent'}`}>
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="text-text font-sans text-lg font-medium">
          <Link href="/"><a className="hover:opacity-90">{siteTitle}</a></Link>
        </div>

        <nav className="hidden md:flex gap-8 items-center" aria-label="Hovednavigation">
  {menu
    .filter(item => item.href !== "/kontakt")
    .map((item) => (
      <Link key={item.href} href={item.href}>
        <a className="text-muted hover:text-text">{item.label}</a>
      </Link>
    ))}

  {/* CTA KNAP */}
  <Link href="/kontakt">
    <a className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90 transition">
      Kontakt mig
    </a>
  </Link>
</nav>


        <button
          className="md:hidden ml-3 p-2 rounded focus:outline-none focus:ring-2 focus:ring-accent"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h16" stroke="#2E2C29" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div className={`md:hidden transition-max-h duration-300 ease-in-out overflow-hidden ${open ? 'max-h-screen' : 'max-h-0'}`}>
        <div className="px-6 pb-6 flex flex-col gap-4">
{menu
  .filter(item => item.href !== "/kontakt")
  .map((item) => (
    <Link key={item.href} href={item.href}>
      <a className="block py-2 text-lg">{item.label}</a>
    </Link>
  ))}

{/* CTA i mobil */}
<Link href="/kontakt">
  <a className="mt-4 inline-block text-center bg-accent text-white px-4 py-3 rounded-lg hover:bg-accent/90 transition">
    Kontakt mig
  </a>
</Link>

        </div>
      </div>
    </header>
  )
}
