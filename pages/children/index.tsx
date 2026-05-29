import React, { useState, useEffect, useRef } from "react"
import Head from "next/head"
import Image from "next/image"

type ProblemType = "skolevægring" | "social" | "præstationsangst" | "søvn" | "selvbillede" | "mobning" | null

const problems = {
  skolevægring: {
    title: "Vil ikke i skole",
    morensOplevelse: "Hver morgen er en kamp. Dit barn vil ikke op. Først ondt i maven, så hovedpine, så det kan slet ikke. Du ved ikke om du skal være hård eller blød. Er det angst eller manipulation? Du er begyndt at tvivle på dig selv. Dit eget arbejde lider.",
    hvadSker: "Skolevægring er sjældent dovenskab. Det er angst der har sat sig som en fysisk reaktion - kroppen reagerer rigtigt. Dit barn lyver ikke. Det har lært at skolen betyder fare - socialt, fagligt eller begge dele. Den overbevisning sidder dybt og når ikke gennem samtale alene.",
    hvadVirker: "Arbejder direkte med den overbevisning der driver reaktionen - uden at dit barn behøver forstå hvorfor. Det får nye indre billeder af sig selv i skolen. Trygt i stedet for fare. Resultater kommer typisk hurtigt fordi børn ikke bruger energi på at tvivle undervejs.",
  },
  social: {
    title: "Føler sig udenfor",
    morensOplevelse: "Dit barn sidder alene i weekenden mens andre børn er sammen. Du hører ikke om fødselsdage. Måske bliver det ikke inviteret. Du arrangerer legeaftaler der ikke fører til venskaber. Du ved ikke om det er valgt ensomhed eller smerteful udelukkelse. Du sover dårligt over det.",
    hvadSker: "Dit barn har en fast overbevisning om sig selv: 'jeg er kedelig', 'de kan ikke lide mig', 'jeg ved ikke hvad jeg skal sige', 'jeg passer ikke ind.' Den styrer adfærden fuldstændigt. Trækker sig, andre tolker det som uinteresse, afstanden vokser. Cirklen er selvforstærkende.",
    hvadVirker: "Arbejder med den grundlæggende selvopfattelse - ikke de sociale færdigheder. Dit barn behøver ikke lære teknikker. Det behøver et nyt udgangspunkt. Et barn der inderst inde tror det er værd at kende opfører sig anderledes uden at blive undervist i det.",
  },
  præstationsangst: {
    title: "Crasher til eksamen",
    morensOplevelse: "Dit barn er intelligent og velfungerende i hverdagen - men crasher til prøver og eksamener. Karaktererne afspejler ikke hvad det kan. Det er i panik uger før en test. Sover dårligt, spiser dårligt, bliver irritabelt. Du prøver at motivere og berolige - intet virker.",
    hvadSker: "Præstationsangst er ikke mangel på viden eller forberedelse. Det er en overbevisning om at resultatet definerer værdi som menneske - og en forventning om at fejle. Kroppen aktiverer en reel stressrespons der blokerer adgang til det barnet faktisk ved.",
    hvadVirker: "To ting samtidigt. Arbejder med overbevisningen om at resultatet definerer værdi - og træner kroppen i en anden fysiologisk respons til prøvesituationen. Dit barn lærer at aktivere ro og fokus i stedet for panik. Det er en reel ændring i nervesystemet.",
  },
  søvn: {
    title: "Sover ikke - Bekymrer sig",
    morensOplevelse: "Dit barn vil ikke sove alene, eller ligger vågen i timevis. Måske vågner med mareridt eller uro du ikke kan forklare. Du ligger selv vågen og lytter. Du er udmattet. Jeres relation handler nu kun om søvn - hver aften er en forhandling.",
    hvadSker: "Søvnproblemer hos børn er sjældent søvnproblemet. Det er angst der manifesterer sig om natten når der ikke er distraktioner. Dit barn er alene med sine tanker og har ingen strategi til at håndtere dem. Tankerne kører i ring. Kroppen er aktiveret når den burde slappe af.",
    hvadVirker: "Søvn er et af hypnoterapiens stærkeste områder fordi hypnotisk tilstand og søvnindledning aktiverer de samme neurologiske mekanismer. Dit barn lærer at lede sig selv ned i ro - via nye indre billeder. Resultater kommer typisk hurtigt.",
  },
  selvbillede: {
    title: "Dårligt selvbillede",
    morensOplevelse: "Dit barn siger 'jeg er dum', 'jeg er grim', 'ingen kan lide mig', 'jeg er dårlig til alt.' Du afviser det - 'det er ikke sandt, du er fantastisk' - og barnet lukker i. Din beroligelse virker ikke. Du ser et barn der ikke kan tage imod kærlighed.",
    hvadSker: "Selvbilledet er summen af alle overbevisninger dit barn har om sig selv - og de fleste er ikke bevidst valgte. Positive feedback afvises fordi den ikke passer ind i det eksisterende selvbillede. Kritik bekræfter det. Systemet er selvlåsende.",
    hvadVirker: "Selvbillede er det dybeste arbejdsområde fordi overbevisningerne sidder under bevidst tænkning. Hypnoterapi går derind og erstatter de gamle overbevisninger med nye - ikke som positiv tænkning men som en reel oplevelse. Dit barn tager imod det på en måde få voksne kan.",
  },
  mobning: {
    title: "Bliver mobbet",
    morensOplevelse: "Du finder ud af det for sent. Dit barn har skjult det - af skam, af frygt for at det bliver værre. Når du endelig ved det er du vred, ked af det og magtesløs. Du kontakter skolen. Det lover bedring. Men dit barn er ikke det samme. Det er blevet mindre, mere indadvendt.",
    hvadSker: "Mobning efterlader ikke bare dårlige minder - det efterlader overbevisninger. 'Jeg fortjener det', 'der er noget galt med mig', 'jeg kan ikke stole på andre'. Dit barn tolker uretfærdighed som sin egen fejl. Skammen er størst.",
    hvadVirker: "Arbejder direkte med de overbevisninger mobningen har efterladt. Dit barn behøver ikke genfortælle det der skete. Det arbejder med hvad barnet tror om sig selv nu - og erstatter det med en oplevelse af integritet der ikke er afhængig af hvad andre har gjort.",
  },
}

interface Message {
  role: "user" | "assistant"
  content: string
}

export default function ChildrenPage() {
  const [selected, setSelected] = useState<ProblemType>(null)
  const [showChat, setShowChat] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string>("")
  const [state, setState] = useState<any>(null)
  const [hasConsent, setHasConsent] = useState(false)
  const [retentionDays, setRetentionDays] = useState<number>(365)
  const [showSettings, setShowSettings] = useState(false)
  const [showCrisisBanner, setShowCrisisBanner] = useState(false)
  const [showCrisisResources, setShowCrisisResources] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const initChat = async (consentRecord?: { retentionDays: number }) => {
    try {
      const body: any = {
        state: null,
        input: consentRecord
          ? { type: "CONSENT_RESPONSE", retentionDays: consentRecord.retentionDays }
          : { type: "INIT", text: "" },
        chatbotType: "children",
      }
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (response.ok) {
        const data = await response.json()
        setState(data.state)
        if (data.consent_required) {
          // Consent not yet given - show banner
          return
        }
        setHasConsent(true)
        const initMsg = data.state?.active_node_message ?? data.transition?.response_message
        if (initMsg) {
          setMessages([{ role: "assistant", content: initMsg }])
        }
      }
    } catch (error) {
      console.error("Chat init error:", error)
    }
  }

  const startChat = async (days: number) => {
    setRetentionDays(days)
    setHasConsent(true)
    await initChat({ retentionDays: days })
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input
    setInput("")
    setMessages(prev => [...prev, { role: "user", content: userMessage }])
    setLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state,
          input: { type: "FREE_TEXT", text: userMessage },
          chatbotType: "children",
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setState(data.state)
        const isCrisis = data.transition?.to === "CRISIS_INFO" || data.transition?.reason?.includes("crisis")
        if (isCrisis) {
          setShowCrisisBanner(true)
        } else {
          const replyMsg = data.state?.active_node_message ?? data.transition?.response_message
          if (replyMsg) {
            setMessages(prev => [...prev, { role: "assistant", content: replyMsg }])
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateConsent = async (days: number) => {
    setRetentionDays(days)
    setShowSettings(false)
    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state,
          input: { type: "CONSENT_RESPONSE", retentionDays: days },
          chatbotType: "children",
        }),
      })
    } catch (e) {
      console.error("Consent update error:", e)
    }
  }

  const resetChat = async () => {
    // 1. Clear screen immediately
    setMessages([])
    setState(null)
    setLoading(false)
    // 2. Delete Redis state
    try {
      await fetch("/api/children-reset", { method: "POST" })
    } catch (e) {
      // Ignorer fejl
    }
    // 3. Start fresh INIT - state is now null in Redis so no restore happens
    setLoading(true)
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: null,
          input: { type: "INIT", text: "" },
          chatbotType: "children",
        }),
      })
      if (response.ok) {
        const data = await response.json()
        setState(data.state)
        const msg = data.state?.active_node_message ?? data.transition?.response_message
        if (msg) {
          setMessages([{ role: "assistant", content: msg }])
        }
      }
    } catch (e) {
      console.error("Reset init error:", e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Hypnoterapi til børn og unge i Birkerød | Gaarsdal</title>
        <meta name="description" content="Hypnoterapi til børn og unge (8-18 år) i Birkerød. Jan Gaarsdal hjælper med angst, skolevægring, søvnproblemer, selvbillede og sociale udfordringer." />
        <link rel="canonical" href="https://gaarsdal.net/children" />
        <meta property="og:title" content="Hypnoterapi til børn og unge | Gaarsdal Birkerød" />
        <meta property="og:description" content="Hjælp til børn og unge med angst, selvbillede og sociale udfordringer. Jan Gaarsdal arbejder med børn fra 8 år i Birkerød." />
        <meta property="og:image" content="https://gaarsdal.net/Jan-AI.png" />
        <meta property="og:url" content="https://gaarsdal.net/children" />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              name: "Hypnoterapi til børn og unge",
              description: "Hypnoterapi til børn og unge (8-18 år) med angst, skolevægring, søvnproblemer og sociale udfordringer. Jan Gaarsdal, Birkerød.",
              url: "https://gaarsdal.net/children",
              about: {
                "@type": "MedicalTherapy",
                name: "Hypnoterapi for børn",
                relevantSpecialty: "Psykologi",
              },
              provider: {
                "@type": "Person",
                name: "Jan Gaarsdal",
                url: "https://gaarsdal.net/om",
                telephone: "+4542807474",
              },
            }),
          }}
        />
      </Head>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px", fontFamily: "system-ui, -apple-system, sans-serif", lineHeight: 1.6, color: "#333" }}>
        
        {/* SEKTION 1: GENKENDELSE */}
        <section style={{ marginBottom: "60px" }}>
          <div style={{ display: "flex", gap: "30px", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: "32px", fontWeight: 600, marginBottom: "16px" }}>Dit barn har det svært - og du ved ikke hvad du skal gøre</h1>
              <p style={{ fontSize: "16px", color: "#666", marginBottom: "16px" }}>Du har prøvet meget. Måske systemet. Måske venner. Du elsker dit barn og kan ikke nå ind til det. Det er ikke din fejl.</p>
              <p style={{ fontSize: "15px", color: "#555" }}>Jeg arbejder med børn og unge der kæmper med angst, sociale problemer, selvbillede, søvnproblemer og præstationsangst. Jeg hjælper dem med at blive mere sig selv igen - og hjælper dig med at forstå hvad der sker.</p>
            </div>
            <div style={{ flexShrink: 0 }}>
              <Image src="/Jan-AI.png" alt="Jan Lauridsen" width={120} height={120} style={{ borderRadius: "50%", objectFit: "cover" }} />
            </div>
          </div>
        </section>

        {/* SEKTION 2: VALG AF PROBLEMSTILLING */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "24px", textAlign: "center" }}>Genkend dit barn:</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "40px" }}>
            {Object.entries(problems).map(([key, prob]) => (
              <button
                key={key}
                onClick={() => setSelected(key as ProblemType)}
                style={{
                  padding: "20px",
                  border: selected === key ? "2px solid #5a7a8f" : "1px solid #ddd",
                  background: selected === key ? "#f0f4f8" : "#fff",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: 500,
                  textAlign: "left",
                  transition: "all 0.2s",
                }}
              >
                {prob.title}
              </button>
            ))}
          </div>
        </section>

        {/* SEKTION 3: FORDYBELSE */}
        {selected && problems[selected] && (
          <section style={{ marginBottom: "60px", padding: "30px", background: "#f9fafb", borderRadius: "8px" }}>
            <h3 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "20px" }}>{problems[selected].title}</h3>

            <div style={{ marginBottom: "30px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: 600, textTransform: "uppercase", color: "#888", marginBottom: "12px" }}>Dit perspektiv</h4>
              <p style={{ fontSize: "15px", lineHeight: 1.7 }}>{problems[selected].morensOplevelse}</p>
            </div>

            <div style={{ marginBottom: "30px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: 600, textTransform: "uppercase", color: "#888", marginBottom: "12px" }}>Hvad der sker i dit barn</h4>
              <p style={{ fontSize: "15px", lineHeight: 1.7 }}>{problems[selected].hvadSker}</p>
            </div>

            <div style={{ marginBottom: "30px" }}>
              <h4 style={{ fontSize: "14px", fontWeight: 600, textTransform: "uppercase", color: "#888", marginBottom: "12px" }}>Hvordan hypnoterapi hjælper</h4>
              <p style={{ fontSize: "15px", lineHeight: 1.7 }}>{problems[selected].hvadVirker}</p>
            </div>

            <button
              onClick={() => setSelected(null)}
              style={{
                padding: "8px 16px",
                fontSize: "13px",
                background: "transparent",
                border: "1px solid #ccc",
                borderRadius: "4px",
                cursor: "pointer",
                color: "#666",
              }}
            >
              Luk
            </button>
          </section>
        )}

        {/* SEKTION 4: CHATBOT */}
        {!showChat ? (
          <section style={{ marginBottom: "60px", padding: "40px", background: "#f5f7fa", borderRadius: "8px", textAlign: "center" }}>
            <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "16px" }}>Du kan snakke med en AI-assistent her</h2>
            <p style={{ fontSize: "15px", marginBottom: "24px", maxWidth: "600px", margin: "0 auto 24px", color: "#555" }}>
              Jeg har en AI-assistent der kan besvare almindelige spørgsmål og lytte uden at dømme. Det er ikke direkte kontakt med Jan, men den kan hjælpe dig med at klare tankerne.
            </p>

            <button
              onClick={() => { setShowChat(true); initChat() }}
              style={{
                padding: "12px 24px",
                background: "#5a7a8f",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                fontWeight: 500,
                fontSize: "15px",
                cursor: "pointer",
              }}
            >
              Åbn AI-chat
            </button>

            <p style={{ fontSize: "13px", color: "#888", marginTop: "16px" }}>Eller kontakt mig direkte på +45 42 80 74 74 eller jan@gaarsdal.net</p>
          </section>
        ) : !hasConsent ? (
          <section style={{ marginBottom: "60px", padding: "40px", background: "#fff", borderRadius: "8px", border: "1px solid #ddd" }}>
            <div style={{ maxWidth: "500px", margin: "0 auto", textAlign: "center" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "16px" }}>Samtykke til at gemme din samtale</h2>
              <p style={{ fontSize: "14px", color: "#555", marginBottom: "24px", lineHeight: 1.6 }}>
                Denne AI-assistent kan gemme dine beskeder for at huske konteksten i samtalen. 
                Vælg nedenfor hvad du er komfortabel med.
              </p>
              
              <div style={{ display: "grid", gap: "12px" }}>
                <button
                  onClick={() => startChat(365)}
                  style={{
                    padding: "12px 20px",
                    background: "#5a7a8f",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    fontWeight: 500,
                    fontSize: "14px",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  Gem samtale (1 år)
                </button>
                <button
                  onClick={() => startChat(0)}
                  style={{
                    padding: "12px 20px",
                    background: "transparent",
                    color: "#5a7a8f",
                    border: "1px solid #5a7a8f",
                    borderRadius: "4px",
                    fontWeight: 500,
                    fontSize: "14px",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  Kun denne session (ingen gemte data)
                </button>
              </div>

              <p style={{ fontSize: "12px", color: "#888", marginTop: "16px" }}>
                Dine samtaler bruges ikke til træning og deles ikke med tredjeparter. Jan ser ikke dine refleksioner.
              </p>

              <button
                onClick={() => setShowChat(false)}
                style={{
                  marginTop: "12px",
                  padding: "8px 16px",
                  background: "transparent",
                  color: "#666",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                Annuller
              </button>
            </div>
          </section>
        ) : (
          <section style={{ marginBottom: "60px", padding: "30px", background: "#fff", borderRadius: "8px", border: "1px solid #ddd" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600 }}>AI-assistent</h2>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  onClick={() => setShowSettings(s => !s)}
                  title="Dataindstillinger"
                  style={{
                    background: "transparent",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    padding: "5px 8px",
                    fontSize: "14px",
                    cursor: "pointer",
                    color: "#888",
                  }}
                >
                  ⚙
                </button>
                <button
                  onClick={resetChat}
                  style={{
                    background: "transparent",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    padding: "5px 10px",
                    fontSize: "12px",
                    cursor: "pointer",
                    color: "#666",
                  }}
                >
                  Ny samtale
                </button>
                <button
                  onClick={() => setShowChat(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    fontSize: "20px",
                    cursor: "pointer",
                    color: "#999",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {showSettings && (
              <div style={{
                marginBottom: "12px",
                padding: "14px 16px",
                background: "#f5f7fa",
                borderRadius: "6px",
                border: "1px solid #e5e7eb",
                fontSize: "13px",
              }}>
                <div style={{ fontWeight: 600, marginBottom: "10px", color: "#444" }}>Dataindstillinger</div>
                <p style={{ color: "#666", marginBottom: "10px", lineHeight: 1.5 }}>
                  Vælg hvor længe vi må huske dine samtaler. Du kan ændre det til enhver tid.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {([
                    { days: 365, label: "Gem i 1 år" },
                    { days: 90,  label: "Gem i 3 måneder" },
                    { days: 30,  label: "Gem i 30 dage" },
                    { days: 0,   label: "Kun denne session (ingen gemte data)" },
                  ] as { days: number; label: string }[]).map(({ days, label }) => (
                    <button
                      key={days}
                      onClick={() => updateConsent(days)}
                      style={{
                        padding: "8px 12px",
                        background: retentionDays === days ? "#5a7a8f" : "#fff",
                        color: retentionDays === days ? "#fff" : "#444",
                        border: "1px solid",
                        borderColor: retentionDays === days ? "#5a7a8f" : "#ddd",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "13px",
                        textAlign: "left",
                      }}
                    >
                      {label}{retentionDays === days ? " ✓" : ""}
                    </button>
                  ))}
                </div>
                <p style={{ color: "#999", fontSize: "12px", marginTop: "10px" }}>
                  Dine samtaler bruges ikke til træning og deles ikke med tredjeparter. Jan ser ikke dine refleksioner.
                </p>
              </div>
            )}

            {showCrisisBanner && (
              <div style={{
                marginBottom: "12px",
                padding: "14px 16px",
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              }}>
                <span style={{ fontSize: "22px", flexShrink: 0 }}>🕊</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "13px", color: "#444", margin: 0, lineHeight: 1.5 }}>
                    Hvis du eller nogen du kender har det svært, er der gratis hjælp at få.
                  </p>
                  {showCrisisResources && (
                    <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <a href="tel:70201201" style={{ fontSize: "13px", color: "#5a7a8f", textDecoration: "none", fontWeight: 500 }}>
                        📞 Livslinjen — 70 201 201 (gratis, døgnet rundt)
                      </a>
                      <a href="tel:1813" style={{ fontSize: "13px", color: "#5a7a8f", textDecoration: "none", fontWeight: 500 }}>
                        📞 Lægevagten — 1813
                      </a>
                      <a href="tel:112" style={{ fontSize: "13px", color: "#5a7a8f", textDecoration: "none", fontWeight: 500 }}>
                        📞 Akut hjælp — 112
                      </a>
                      <a href="https://www.livslinjen.dk" target="_blank" rel="noopener noreferrer" style={{ fontSize: "13px", color: "#888", textDecoration: "underline" }}>
                        livslinjen.dk
                      </a>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: "6px", flexShrink: 0, alignItems: "center" }}>
                  <button
                    onClick={() => setShowCrisisResources(r => !r)}
                    style={{
                      padding: "5px 10px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      background: "#fff",
                      fontSize: "12px",
                      cursor: "pointer",
                      color: "#444",
                    }}
                  >
                    {showCrisisResources ? "Skjul ▲" : "Find hjælp ▼"}
                  </button>
                  <button
                    onClick={() => { setShowCrisisBanner(false); setShowCrisisResources(false) }}
                    style={{ background: "transparent", border: "none", fontSize: "16px", cursor: "pointer", color: "#bbb" }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            <div style={{
              height: "400px",
              overflowY: "auto",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              padding: "16px",
              marginBottom: "16px",
              background: "#fafbfc",
            }}>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  style={{
                    marginBottom: "12px",
                    display: "flex",
                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "70%",
                      padding: "10px 14px",
                      borderRadius: "6px",
                      background: msg.role === "user" ? "#5a7a8f" : "#e5e7eb",
                      color: msg.role === "user" ? "#fff" : "#333",
                      fontSize: "14px",
                      lineHeight: 1.5,
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {messages.length === 1 && !loading && (
                <div style={{ marginTop: "16px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {[
                    "Mit barn har angst",
                    "Problemer i skolen",
                    "Sover dårligt",
                    "Føler sig udenfor",
                    "Vil gerne booke en tid",
                  ].map((chip) => (
                    <button
                      key={chip}
                      onClick={async () => {
                        if (loading) return
                        const chipText = chip
                        setMessages(prev => [...prev, { role: "user", content: chipText }])
                        setLoading(true)
                        try {
                          const response = await fetch("/api/chat", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              state,
                              input: { type: "FREE_TEXT", text: chipText },
                              chatbotType: "children",
                            }),
                          })
                          if (response.ok) {
                            const data = await response.json()
                            setState(data.state)
                            const isCrisis = data.transition?.to === "CRISIS_INFO" || data.transition?.reason?.includes("crisis")
                            if (isCrisis) {
                              setShowCrisisBanner(true)
                            } else {
                              const replyMsg = data.state?.active_node_message ?? data.transition?.response_message
                              if (replyMsg) setMessages(prev => [...prev, { role: "assistant", content: replyMsg }])
                            }
                          }
                        } catch (e) {
                          console.error("Chip error:", e)
                        } finally {
                          setLoading(false)
                        }
                      }}
                      style={{
                        padding: "7px 14px",
                        background: "#f0f4f8",
                        border: "1px solid #d0dce8",
                        borderRadius: "20px",
                        fontSize: "13px",
                        cursor: "pointer",
                        color: "#3d5a72",
                        transition: "background 0.15s",
                      }}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}

              {loading && (
                <div style={{ color: "#999", fontSize: "13px" }}>
                  Assistenten skriver...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Skriv hvad som helst..."
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                }}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                style={{
                  padding: "10px 20px",
                  background: "#5a7a8f",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: loading ? "default" : "pointer",
                  fontSize: "14px",
                  opacity: loading || !input.trim() ? 0.6 : 1,
                }}
              >
                Send
              </button>
            </div>
          </section>
        )}

      </div>
    </>
  )
}
