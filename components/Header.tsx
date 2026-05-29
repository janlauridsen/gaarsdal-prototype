import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function Header({
  siteTitle = 'Gaarsdal Hypnoterapi',
  menu = [
    { label: 'Forside', href: '/' },
    { label: 'Hypnoterapi', href: '/hypnoterapi' },
    { label: 'Børn & Unge', href: '/children' },
    { label: 'Kender du det?', href: '/kender-du-det' },
    { label: 'Om', href: '/om' },
    { label: 'Kontakt', href: '/kontakt' },
  ],
}) {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  function isActive(href: string) {
    return router.pathname === href
  }

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 60)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed w-full z-50 transition-all duration-400 ${
        scrolled
          ? 'backdrop-blur-sm bg-white/60 shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="hover:opacity-85 transition-opacity">
            <img
              src="/gaarsdal-logo-2026-02.png"
              alt={siteTitle}
              height={64}
              style={{ height: '128px', width: 'auto' }}
            />
          </Link>
        </div>

        {/* Desktop navigation */}
        <nav
          className="hidden md:flex gap-8 items-center"
          aria-label="Hovednavigation"
        >
          {menu
            .filter((item) => item.href !== '/kontakt')
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-colors ${
                  isActive(item.href)
                    ? 'text-text font-medium border-b border-accent'
                    : 'text-muted hover:text-text'
                }`}
              >
                {item.label}
              </Link>
            ))}

          {/* CTA */}
          <Link
            href="/kontakt"
            className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90 transition"
          >
            Kontakt mig
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden ml-3 p-2 rounded focus:outline-none focus:ring-2 focus:ring-accent"
          aria-label={open ? 'Luk menu' : 'Åbn menu'}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            {open ? (
              <path
                d="M6 6l12 12M6 18L18 6"
                stroke="#2E2C29"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="#2E2C29"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile navigation */}
      <div
        className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${
          open ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-white/95 backdrop-blur-sm px-6 pb-6 flex flex-col gap-4">
          {menu
            .filter((item) => item.href !== '/kontakt')
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block py-2 text-lg transition-colors ${
                  isActive(item.href)
                    ? 'text-accent font-medium'
                    : 'text-text hover:text-accent'
                }`}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}

          {/* CTA mobil */}
          <Link
            href="/kontakt"
            className="mt-2 inline-block text-center bg-accent text-white px-4 py-3 rounded-lg hover:bg-accent/90 transition"
            onClick={() => setOpen(false)}
          >
            Kontakt mig
          </Link>
        </div>
      </div>
    </header>
  )
}
