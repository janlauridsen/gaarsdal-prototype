import React, { useState, useEffect, useRef } from "react"
import Head from "next/head"
import Image from "next/image"
import Header from "../../components/Header"
import Footer from "../../components/Footer"

type ProblemType = "skolevægring" | "social" | "præstationsangst" | "søvn" | "selvbillede" | "mobning" | "angst" | "skærm" | "ensomhed" | "krop" | null

const problems = {
  skolevægring: {
    title: "🏫 Vil ikke i skole",
    link: "/skolevagring",
    morensOplevelse: "Hver morgen er en kamp. Dit barn vil ikke op. Først ondt i maven, så hovedpine, så det kan slet ikke. Du ved ikke om du skal være hård eller blød. Er det angst eller manipulation? Du er begyndt at tvivle på dig selv. Dit eget arbejde lider.",
    hvadSker: "Skolevægring er sjældent dovenskab. Det er angst der har sat sig som en fysisk reaktion - kroppen reagerer rigtigt. Dit barn lyver ikke. Det har lært at skolen betyder fare - socialt, fagligt eller begge dele. Den overbevisning sidder dybt og når ikke gennem samtale alene.",
    hvadVirker: "Arbejder direkte med den overbevisning der driver reaktionen - uden at dit barn behøver forstå hvorfor. Det får nye indre billeder af sig selv i skolen. Trygt i stedet for fare. Resultater kommer typisk hurtigt fordi børn ikke bruger energi på at tvivle undervejs.",
  },
  social: {
    title: "👥 Føler sig udenfor",
    link: "/social-angst-born",
    morensOplevelse: "Dit barn sidder alene i weekenden mens andre børn er sammen. Du hører ikke om fødselsdage. Måske bliver det ikke inviteret. Du arrangerer legeaftaler der ikke fører til venskaber. Du ved ikke om det er valgt ensomhed eller smerteful udelukkelse. Du sover dårligt over det.",
    hvadSker: "Dit barn har en fast overbevisning om sig selv: 'jeg er kedelig', 'de kan ikke lide mig', 'jeg ved ikke hvad jeg skal sige', 'jeg passer ikke ind.' Den styrer adfærden fuldstændigt. Trækker sig, andre tolker det som uinteresse, afstanden vokser. Cirklen er selvforstærkende.",
    hvadVirker: "Arbejder med den grundlæggende selvopfattelse - ikke de sociale færdigheder. Dit barn behøver ikke lære teknikker. Det behøver et nyt udgangspunkt. Et barn der inderst inde tror det er værd at kende opfører sig anderledes uden at blive undervist i det.",
  },
  præstationsangst: {
    title: "📝 Crasher til eksamen",
    link: "/praestationsangst-born",
    morensOplevelse: "Dit barn er intelligent og velfungerende i hverdagen - men crasher til prøver og eksamener. Karaktererne afspejler ikke hvad det kan. Det er i panik uger før en test. Sover dårligt, spiser dårligt, bliver irritabelt. Du prøver at motivere og berolige - intet virker.",
    hvadSker: "Præstationsangst er ikke mangel på viden eller forberedelse. Det er en overbevisning om at resultatet definerer værdi som menneske - og en forventning om at fejle. Kroppen aktiverer en reel stressrespons der blokerer adgang til det barnet faktisk ved.",
    hvadVirker: "To ting samtidigt. Arbejder med overbevisningen om at resultatet definerer værdi - og træner kroppen i en anden fysiologisk respons til prøvesituationen. Dit barn lærer at aktivere ro og fokus i stedet for panik. Det er en reel ændring i nervesystemet.",
  },
  søvn: {
    title: "🌙 Sover ikke - Bekymrer sig",
    link: "/sovn-born",
    morensOplevelse: "Dit barn vil ikke sove alene, eller ligger vågen i timevis. Måske vågner med mareridt eller uro du ikke kan forklare. Du ligger selv vågen og lytter. Du er udmattet. Jeres relation handler nu kun om søvn - hver aften er en forhandling.",
    hvadSker: "Søvnproblemer hos børn er sjældent søvnproblemet. Det er angst der manifesterer sig om natten når der ikke er distraktioner. Dit barn er alene med sine tanker og har ingen strategi til at håndtere dem. Tankerne kører i ring. Kroppen er aktiveret når den burde slappe af.",
    hvadVirker: "Søvn er et af hypnoterapiens stærkeste områder fordi hypnotisk tilstand og søvnindledning aktiverer de samme neurologiske mekanismer. Dit barn lærer at lede sig selv ned i ro - via nye indre billeder. Resultater kommer typisk hurtigt.",
  },
  selvbillede: {
    title: "🪞 Dårligt selvbillede",
    link: "/selvbillede-born",
    morensOplevelse: "Dit barn siger 'jeg er dum', 'jeg er grim', 'ingen kan lide mig', 'jeg er dårlig til alt.' Du afviser det - 'det er ikke sandt, du er fantastisk' - og barnet lukker i. Din beroligelse virker ikke. Du ser et barn der ikke kan tage imod kærlighed.",
    hvadSker: "Selvbilledet er summen af alle overbevisninger dit barn har om sig selv - og de fleste er ikke bevidst valgte. Positive feedback afvises fordi den ikke passer ind i det eksisterende selvbillede. Kritik bekræfter det. Systemet er selvlåsende.",
    hvadVirker: "Selvbillede er det dybeste arbejdsområde fordi overbevisningerne sidder under bevidst tænkning. Hypnoterapi går derind og erstatter de gamle overbevisninger med nye - ikke som positiv tænkning men som en reel oplevelse. Dit barn tager imod det på en måde få voksne kan.",
  },
  mobning: {
    title: "🛡️ Bliver mobbet",
    link: "/mobning",
    morensOplevelse: "Du finder ud af det for sent. Dit barn har skjult det - af skam, af frygt for at det bliver værre. Når du endelig ved det er du vred, ked af det og magtesløs. Du kontakter skolen. Det lover bedring. Men dit barn er ikke det samme. Det er blevet mindre, mere indadvendt.",
    hvadSker: "Mobning efterlader ikke bare dårlige minder - det efterlader overbevisninger. 'Jeg fortjener det', 'der er noget galt med mig', 'jeg kan ikke stole på andre'. Dit barn tolker uretfærdighed som sin egen fejl. Skammen er størst.",
    hvadVirker: "Arbejder direkte med de overbevisninger mobningen har efterladt. Dit barn behøver ikke genfortælle det der skete. Det arbejder med hvad barnet tror om sig selv nu - og erstatter det med en oplevelse af integritet der ikke er afhængig af hvad andre har gjort.",
  },
  angst: {
    title: "💙 Er angst og bekymret",
    link: "/angst-born",
    morensOplevelse: "Dit barn bekymrer sig om alt - skolen, venner, fremtiden, ting der endnu ikke er sket. Det virker som om det altid venter på at noget går galt. Du prøver at berolige det, men det hjælper kun i et øjeblik. Angsten er større end det du siger.",
    hvadSker: "Angst hos børn er ikke overdrivelse - det er et nervesystem der er låst i alarmberedskab. Hjernen har lært at verden er usikker og reagerer derefter. Tankerne kører i ring. Kroppen spænder op. Det er ikke noget barnet vælger og det forsvinder ikke ved at tale fornuft.",
    hvadVirker: "Hypnoterapi arbejder direkte med nervesystemet - ikke med tankerne. Dit barn lærer at skifte fra alarmberedskab til ro via nye indre billeder og reaktionsmønstre. Det behøver ikke forstå sin angst for at ændre den. Mange oplever mærkbar forskel allerede efter første session.",
  },
  skærm: {
    title: "📱 Skærm og sociale medier",
    link: "/skaerm-born",
    morensOplevelse: "Du kan ikke få telefonen fra det. Humøret afhænger af hvad der sker online. Det sover dårligt, er irritabelt og har svært ved at koncentrere sig i skolen. Du ved det hænger sammen med skærmen men ved ikke hvad du skal gøre. Konflikter om telefonen er blevet hverdag.",
    hvadSker: "Sociale medier aktiverer de samme belønningsmekanismer som afhængighed. Sammenligningen med andres tilsyneladende liv skaber lavt selvværd. Søvnen forstyrres af blåt lys og mentalt uro. Det er ikke svag viljestyrke - det er en hjerne der reagerer præcis som den er designet til.",
    hvadVirker: "Arbejder med den underliggende trang og det behov sociale medier dækker - typisk anerkendelse, tilhørsforhold eller flugt fra ubehag. Når det behov mødes på en anden måde, falder afhængigheden naturligt. Dit barn behøver ikke kæmpe mod sig selv.",
  },
  ensomhed: {
    title: "🫂 Er ensom",
    link: "/ensomhed-born",
    morensOplevelse: "Dit barn har måske klassekammerater men ingen rigtige venner. Det er ikke inviteret med. Det kommer hjem og lukker sig inde. Du spørger hvordan det går - det svarer 'fint'. Du kan se det ikke er fint. Ensomheden hos et barn er en af de tungeste ting at se på som forælder.",
    hvadSker: "Ensomhed hos børn handler sjældent om at de er asociale. Det handler om at de mangler redskaberne til at skabe de forbindelser de ønsker - eller at de bærer på en overbevisning om at andre ikke vil have dem. Den overbevisning styrer adfærden og bekræfter sig selv.",
    hvadVirker: "Arbejder med den grundlæggende overbevisning om hvad barnet er værd i andres øjne. Et barn der inderst inde tror det er værd at kende opfører sig anderledes - uden at blive undervist i sociale teknikker. Forandringen kommer indefra.",
  },
  krop: {
    title: "💪 Kropsutilfredshed og pres",
    link: "/krop-born",
    morensOplevelse: "Dit barn siger det er for tykt, for grimt, for lille, for stort. Det vil ikke med til stranden. Det sammenligner sig konstant med andre - på skolen og på sociale medier. Du siger det er smukt som det er. Det tror dig ikke. Du ved ikke hvordan du skal nå ind til det.",
    hvadSker: "Kropsutilfredshed er ikke forfængelighed - det er et forvredet selvbillede der sidder dybere end spejlet. Sociale medier og jævnaldrende skaber et konstant sammenligningspres. Det barnet ser på sig selv er ikke det du ser. Den overbevisning kan ikke tales væk.",
    hvadVirker: "Selvbillede arbejdes med under bevidst tænkning - der hvor overbevisningerne faktisk sidder. Dit barn lærer at opleve sig selv anderledes indefra, ikke at overbevise sig selv udefra. Det er en af de mest markante forandringer hypnoterapi kan skabe hos unge.",
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
  const detailRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (selected && detailRef.current) {
      setTimeout(() => {
        const el = detailRef.current
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - 120
          window.scrollTo({ top, behavior: "smooth" })
        }
      }, 50)
    }
  }, [selected])

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
      <Header />
      <Head>
        <title>Hypnoterapi til børn og unge i Birkerød | Angst, skolevægring, selvværd | Gaarsdal</title>
        <meta name="description" content="Hypnoterapi til børn og unge (8-18 år) i Birkerød. Jan Gaarsdal hjælper med angst, skolevægring, ensomhed, skærmbrug, kropsutilfredshed, søvnproblemer og selvbillede." />
        <link rel="canonical" href="https://gaarsdal.net/children" />
        <meta property="og:title" content="Hypnoterapi til børn og unge | Gaarsdal Birkerød" />
        <meta property="og:description" content="Hjælp til børn og unge med angst, skolevægring, ensomhed, skærmbrug og selvbillede. Jan Gaarsdal, Birkerød." />
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

      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "120px 20px 60px", fontFamily: "system-ui, -apple-system, sans-serif", lineHeight: 1.6, color: "#333" }}>
        
        {/* SEKTION 1: GENKENDELSE */}
        <section style={{ marginBottom: "60px" }}>
          <div style={{ display: "flex", gap: "30px", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: "32px", fontWeight: 600, marginBottom: "16px" }}>Dit barn har det svært - og du ved ikke hvad du skal gøre</h1>
              <p style={{ fontSize: "16px", color: "#666", marginBottom: "16px" }}>Du har prøvet meget. Måske systemet. Måske venner. Du elsker dit barn og kan ikke nå ind til det. Det er ikke din fejl.</p>
              <p style={{ fontSize: "15px", color: "#555" }}>Jan arbejder med børn og unge der kæmper med angst, sociale problemer, selvbillede, søvnproblemer og præstationsangst - og hjælper forældre med at forstå hvad der sker.</p>
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
          <section
            ref={detailRef}
            style={{
              marginBottom: "60px",
              padding: "30px",
              background: "#f9fafb",
              borderRadius: "8px",
              animation: "slideDown 0.25s ease-out",
            }}>
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

            <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "8px" }}>
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
              {(() => {
                const prob = selected ? (problems as any)[selected] : null
                return prob?.link ? (
                  <a href={prob.link} style={{ fontSize: "13px", color: "#5a7a8f", textDecoration: "none", fontWeight: 500 }}>
                    Læs mere om dette emne →
                  </a>
                ) : null
              })()}
            </div>
          </section>
        )}


        {/* TESTIMONIAL */}
        <section style={{ marginBottom: "48px", padding: "28px 32px", background: "#fff", borderRadius: "10px", border: "1px solid #e5e7eb", borderLeft: "4px solid #5a7a8f" }}>
          <p style={{ fontSize: "17px", lineHeight: 1.8, color: "#333", marginBottom: "16px", fontStyle: "italic" }}>
            "Vi havde vores datter på 7 år til en konsultation hos Jan, med meget stor succes for både barn og forældre. Det var trygt for os alle, og Jan formåede at håndtere og behandle vores datter på den bedste og mest professionelle måde. Som forældre vil jeg anbefale andre at tage en dialog med Jan og afsøge om han kan være med til at hjælpe deres børn, da det for os har gjort en meget stor og positiv forandring!"
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ fontSize: "14px" }}>
              <span style={{ fontWeight: 500, color: "#333" }}>Mor til 7-årig pige</span>
              <span style={{ color: "#888", marginLeft: "8px", fontSize: "13px" }}>⭐⭐⭐⭐⭐ Google-anmeldelse</span>
            </div>
          </div>
        </section>

        {/* TILLID - hvem er Jan */}
        <section style={{ marginBottom: "48px", padding: "32px", background: "#f9fafb", borderRadius: "10px", borderLeft: "3px solid #5a7a8f" }}>
          <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px", color: "#333" }}>
                Hvem er Jan?
              </h2>
              <p style={{ fontSize: "15px", lineHeight: 1.7, marginBottom: "12px", color: "#555" }}>
                Jan er hypnoterapeut i Birkerød og arbejder med børn fra 8 år. Han tilpasser sin tilgang til barnets alder og temperament - og involverer altid forældrene som en del af forløbet.
              </p>
              <p style={{ fontSize: "15px", lineHeight: 1.7, color: "#555" }}>
                Hypnoterapi arbejder med de overbevisninger og reaktionsmønstre der driver adfærden - under bevidst tænkning. Dit barn behøver ikke forstå hvorfor for at ændre sig. Første samtale er uforpligtende.
              </p>
              <div style={{ marginTop: "16px", display: "flex", gap: "24px", flexWrap: "wrap" }}>
                <a href="/om" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", fontWeight: 500 }}>
                  Læs mere om Jan →
                </a>
                <a href="tel:+4542807474" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", fontWeight: 500 }}>
                  Ring +45 42 80 74 74
                </a>
              </div>
            </div>
            <div style={{ flexShrink: 0 }}>
              <Image
                src="/Jan-AI.png"
                alt="Jan Gaarsdal"
                width={90}
                height={90}
                className="rounded-xl object-cover shadow-sm"
              />
            </div>
          </div>
        </section>

        {/* FORÆLDREINDDRAGELSE */}
        <section style={{ marginBottom: "48px", padding: "32px", background: "#f5f7fa", borderRadius: "10px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "16px" }}>Sådan inddrages du som forælder</h2>
          <p style={{ fontSize: "15px", color: "#555", marginBottom: "12px", lineHeight: 1.7 }}>
            Som forælder er du altid en del af forløbet. Du deltager i den indledende forsamtale og i de opsamlende samtaler, og du er velkommen til at være til stede under selve sessionen, hvis barnet ønsker det.
          </p>
          <p style={{ fontSize: "15px", color: "#555", margin: 0, lineHeight: 1.7 }}>
            Nogle børn, særligt de ældre, arbejder bedst når de har rummet for sig selv. Derfor er separate samtaler også en mulighed. Vi tilpasser det til barnets alder, temperament og hvad der skaber mest tryghed.
          </p>
        </section>

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
                        📞 Livslinjen, 70 201 201 (gratis, døgnet rundt)
                      </a>
                      <a href="tel:1813" style={{ fontSize: "13px", color: "#5a7a8f", textDecoration: "none", fontWeight: 500 }}>
                        📞 Lægevagten, 1813
                      </a>
                      <a href="tel:112" style={{ fontSize: "13px", color: "#5a7a8f", textDecoration: "none", fontWeight: 500 }}>
                        📞 Akut hjælp, 112
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

      </main>
      <Footer />
    </>
  )
}
