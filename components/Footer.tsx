export default function Footer({ contact = { phone: '+45 42 80 74 74', email: 'jan@gaarsdal.net' } }) {
  return (
    <footer className="bg-white border-t py-12 mt-20">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <div className="mx-auto mb-6" aria-hidden>
          <svg width="160" height="36" viewBox="0 0 320 72" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 36 C 40 20, 80 56, 120 36 S 200 20, 240 36 S 320 56, 320 36" stroke="#2F5C5B" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="text-text mb-2">Gaarsdal Hypnoterapi</div>
        <div className="text-muted mb-4">{contact.phone} • {contact.email}</div>
        <div className="text-xs text-muted">Bakkevej 36, 3460 Birkerød</div>
        <div className="mt-6 text-xs text-muted">© {new Date().getFullYear()} Gaarsdal Hypnoterapi. Alle rettigheder forbeholdes.</div>
      </div>
    </footer>
  )
}
