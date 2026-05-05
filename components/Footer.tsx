export default function Footer({ contact = { phone: '+45 42 80 74 74', email: 'jan@gaarsdal.net' } }) {
  return (
    <footer className="bg-white border-t py-12 mt-20">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <div className="mx-auto mb-6">
          <img
            src="/gaarsdal-logo-branding-notext.png"
            alt="Gaarsdal Hypnoterapi logo"
            style={{ height: "48px", width: "auto", opacity: 0.85 }}
          />
        </div>

        <div className="text-text mb-2">Gaarsdal Hypnoterapi</div>
        <div className="text-muted mb-4">{contact.phone} • {contact.email}</div>
        <div className="text-xs text-muted">Bakkevej 36, 3460 Birkerød</div>
        <div className="mt-6 text-xs text-muted">© {new Date().getFullYear()} Gaarsdal Hypnoterapi. Alle rettigheder forbeholdes.</div>
      </div>
    </footer>
  )
}
