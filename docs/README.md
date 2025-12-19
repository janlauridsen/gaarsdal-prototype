# Gaarsdal Prototype

Dette projekt er en prototype for **Gaarsdal Hypnoterapi**, bygget med Next.js og Tailwind CSS.
Formålet er at demonstrere en moderne, hurtig og SEO-venlig hjemmeside med AI-chat som supplement.

## Tech Stack
- Next.js
- React
- TypeScript
- Tailwind CSS
- Vercel (deployment)

## Features
- One-page landing
- Responsiv navigation
- AI-baseret chat-assistent
- Klar struktur til videreudvikling

## Struktur
Se detaljeret dokumentation i `/docs`.

## Kom i gang
```bash
npm install
npm run dev
Applikationen kører på: http://localhost:3000

yaml
Kopier kode

---

# 📄 2️⃣ `docs/architecture.md`
*(System- og arkitektur-overblik)*

```md
# Arkitektur-overblik

## Overordnet arkitektur
Applikationen er bygget som en klassisk Next.js SPA med API routes.

Browser
│
▼
Next.js Pages
│
├── Components (UI)
│
└── API Routes (/api/chat)
│
▼
AI Service

markdown
Kopier kode

## Principper
- UI og logik adskilt
- Komponentbaseret arkitektur
- Minimal global state
- Klar separation mellem frontend og backend

## Dataflow
1. Bruger interagerer med UI
2. UI-komponent kalder API-route
3. API håndterer forretningslogik
4. Svar returneres til frontend
