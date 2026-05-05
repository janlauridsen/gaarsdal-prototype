export default function Footer({ contact = { phone: '+45 42 80 74 74', email: 'jan@gaarsdal.net' } }) {
  return (
    <footer className="bg-white border-t py-16 mt-20" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Vandmærke — stort logo centreret bag teksten */}
      <img
        src="/gaarsdal-logo-branding-notext.png"
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '75%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          height: '360px',
          width: 'auto',
          opacity: 0.33,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />
      <div className="max-w-5xl mx-auto px-6 text-center" style={{ position: 'relative', zIndex: 1 }}>
        <div className="text-text mb-2">Gaarsdal Hypnoterapi</div>
        <div className="text-muted mb-4">{contact.phone} • {contact.email}</div>
        <div className="text-xs text-muted">Bakkevej 36, 3460 Birkerød</div>
        <div className="mt-6 text-xs text-muted">© {new Date().getFullYear()} Gaarsdal Hypnoterapi. Alle rettigheder forbeholdes.</div>
      </div>
    </footer>
  )
}
