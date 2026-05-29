import React, { useState, useEffect, useRef } from "react"
import Head from "next/head"
import Image from "next/image"
import Header from "../../components/Header"
import Footer from "../../components/Footer"

type ProblemType =
  | "bekymring" | "søvn" | "rygning" | "præstation"
  | "selvværd" | "vaner" | "stress" | "fobi"
  | "spisning" | "tanker" | null

const problems: Record<Exclude<ProblemType, null>, { title: string; oplevelse: string; hvadSker: string; hvadVirker: string }> = {
  bekymring: {
    title: "Bekymrer mig hele tiden",
    oplevelse: "Du ved godt at det du bekymrer dig om sandsynligvis ikke sker. Og alligevel stopper tankerne ikke. De starter om morgenen og følger dig hele dagen. Du er træt af det - men kan ikke bare beslutte dig for at lade være.",
    hvadSker: "Bekymring er ikke en tankegang - det er en neurologisk vane. Hjernen har lært at scanning for trusler er nødvendig for din sikkerhed. Den kører automatisk, under bevidst kontrol. Rationelle argumenter når ikke derind - de er fra et andet lag af hjernen.",
    hvadVirker: "Hypnoterapi arbejder direkte med det lag der kører bekymringen. Dit nervesystem lærer at den konstante scanning ikke er nødvendig. Du ændrer ikke hvad du tænker - du ændrer hvad der sker automatisk.",
  },
  søvn: {
    title: "Kan ikke sove",
    oplevelse: "Du er træt om aftenen men vågen så snart du lægger dig. Tankerne starter. Du vågner om natten og kan ikke falde i søvn igen. Du har prøvet alt - ingen skærme, magnesium, podcasts. Ingenting virker konsekvent.",
    hvadSker: "Søvnproblemer hos voksne er sjældent et søvnproblem. Det er et nervesystem der er for aktiveret til at slippe ned. Hjernen associerer sengen med uro i stedet for ro. Den association sidder dybere end viljestyrke kan nå.",
    hvadVirker: "Hypnotisk tilstand og søvnindledning aktiverer de samme neurologiske mekanismer. Du lærer at lede dig selv ned i ro - ikke som teknik du skal huske, men som en ny automatisk reaktion. Resultater kommer typisk hurtigt.",
  },
  rygning: {
    title: "Vil gerne holde op med at ryge",
    oplevelse: "Du har prøvet at holde op - måske flere gange. Du ved godt det er skadeligt. Du vil gerne stoppe. Men i bestemte situationer - stress, kaffe, pauser - er lysten der automatisk. Viljestyrke slår fra når det gælder.",
    hvadSker: "Rygning er ikke en vane der sidder i tankerne - den sidder i de automatiske reaktioner. Hjernen har koblet cigaretter til ro, pauser og belønning. Den kobling kører under bevidst styring og kan ikke brydes ved at tænke sig til det.",
    hvadVirker: "Arbejder direkte med de associationer der driver trangen. Ikke med viljestyrke eller erstatninger - men med hvad hjernen automatisk kobler til rygning. Mange oplever at lysten forsvinder efter 1-2 sessioner.",
  },
  præstation: {
    title: "Præsterer ikke som jeg burde",
    oplevelse: "Du er dygtig - det ved du godt. Men i vigtige situationer blokerer du. Eksamen, præsentationer, samtaler der betyder noget. Du ser andre klare det ubesværet. Du forbereder dig mere end de fleste og leverer alligevel ikke det du ved du kan.",
    hvadSker: "Præstationsangst er ikke mangel på evner eller forberedelse. Det er en overbevisning om at resultatet definerer din værdi - og en forventning om at fejle. Kroppen aktiverer en reel stressrespons der blokerer adgang til det du faktisk ved.",
    hvadVirker: "To ting samtidigt: overbevisningen om at resultatet definerer værdi, og kroppens automatiske stressrespons i præstationssituationen. Du lærer at aktivere ro og fokus i stedet for panik. Det er en reel ændring i nervesystemet.",
  },
  selvværd: {
    title: "Lavt selvværd",
    oplevelse: "Du sammenligner dig med andre og kommer til kort. Du afviser komplimenter - de passer ikke ind i dit billede af dig selv. Du er hårdere ved dig selv end du ville være ved nogen anden. Det er ikke noget du vælger.",
    hvadSker: "Selvværd er summen af alle de overbevisninger du har om dig selv - og de fleste er ikke bevidst valgte. De er bygget op over tid og sidder under rationel tænkning. Positive bekræftelser afvises fordi de ikke passer ind i systemet.",
    hvadVirker: "Hypnoterapi går ind under de bevidste lag og erstatter de gamle overbevisninger med nye - ikke som positiv tænkning, men som en reel oplevelse. Det er anderledes end at tale om selvværd. Det ændrer udgangspunktet.",
  },
  vaner: {
    title: "Vaner jeg ikke kan bryde",
    oplevelse: "Du ved præcis hvad du burde gøre anderledes. Du har besluttet dig mange gange. De første dage går godt - og så er du tilbage til det gamle. Det er ikke manglende motivation. Du har masser af motivation. Det virker bare ikke.",
    hvadSker: "Vaner kører i de basale dele af hjernen - ikke i den del der beslutter og planlægger. Det er derfor beslutninger ikke er nok. Vanen har sin egen automatik der er stærkere end intentionen i det øjeblik den udløses.",
    hvadVirker: "Arbejder direkte med den automatiske reaktion der driver vanen. Ændrer hvad der sker i det øjeblik vanen ville have kørt - ikke ved at styrke viljestyrken, men ved at afkoble triggeren fra reaktionen.",
  },
  stress: {
    title: "Konstant stress",
    oplevelse: "Du har altid noget der presser. Selv når der objektivt set ikke er grund til stress, er kroppen på vagt. Du slapper ikke rigtig af - ikke engang i weekenden. Du funktionerer, men det koster mere end det burde.",
    hvadSker: "Kronisk stress er et nervesystem der er låst i beredskab. Det er ikke en reaktion på aktuelle trusler - det er en grundindstilling. Kroppen ved ikke at krigen er slut. Den kører på lavblus alarmberedskab kontinuerligt.",
    hvadVirker: "Resetter nervesystemets grundindstilling. Dit system lærer at beredskab ikke er standard - ro er. Det er ikke afspænding eller mindfulness. Det er en dybere ændring i hvad kroppen opfatter som normalt.",
  },
  fobi: {
    title: "Bange for noget specifikt",
    oplevelse: "Du ved det er irrationelt. Det hjælper ikke. Frygtreaktionen kører alligevel - hurtigt og totalt. Det kan være højder, flyvning, sprøjter, edderkopper eller noget helt andet. Du planlægger dit liv delvist for at undgå det.",
    hvadSker: "En fobi er en lært reaktion der sidder i amygdala - hjernens alarmsystem. Den er ikke styret af den rationelle del af hjernen, og den kan ikke overtalges væk. Den udløses automatisk og er designet til at overstyre alt andet.",
    hvadVirker: "Et af hypnoterapiens stærkeste områder. Arbejder direkte med den lærte reaktion og erstatter den med ro. Ikke gradvis eksponering eller rationalisering - men en direkte ændring af den automatiske respons.",
  },
  spisning: {
    title: "Spiser på følelserne",
    oplevelse: "Det er ikke sult der driver det. Det er kedsomhed, stress, uro, ensomhed - og maden dæmper det i et øjeblik. Du ved det. Det ændrer ikke på at det sker igen. Efterfølgende er der skam oveni.",
    hvadSker: "Følelsesspisning er en reguleringsmekanisme. Hjernen har lært at mad dæmper ubehag hurtigt og pålideligt. Den reaktion kører automatisk og er stærkere end beslutningen om at lade være i det øjeblik ubehaget opstår.",
    hvadVirker: "Arbejder med det underliggende behov der driver spisningen - ikke med maden i sig selv. Når hjernen finder andre måder at regulere ubehaget, falder trangen naturligt. Ingen restriktioner. Ingen viljestyrke.",
  },
  tanker: {
    title: "Overvældet af tanker",
    oplevelse: "Du kan ikke slukke for det. Du gennemtænker samtaler der allerede er sket, forbereder dig på scenarier der aldrig sker, forestiller dig hvad andre tænker. Det er udmattende. Din hjerne holder ikke pause.",
    hvadSker: "Overtænkning er ikke intelligens - det er et nervesystem der kompenserer for usikkerhed ved at simulere og kontrollere. Hjernen tror den hjælper dig. Den kører et program der er beregnet til at beskytte, og det kører på fuld kraft.",
    hvadVirker: "Ændrer hvad nervesystemet opfatter som nødvendigt. Når hjernen lærer at usikkerhed ikke er farlig, falder behovet for konstant simulering. Du tænker stadig - men du styrer det i stedet for at det styrer dig.",
  },
}

interface Message {
  role: "user" | "assistant"
  content: string
}

export default function KenderDuDetPage() {
  const [selected, setSelected] = useState<ProblemType>(null)
  const [showChat, setShowChat] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
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
        chatbotType: "standard",
      }
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (response.ok) {
        const data = await response.json()
        setState(data.state)
        if (data.consent_required) return
        setHasConsent(true)
        const initMsg = data.state?.active_node_message ?? data.transition?.response_message
        if (initMsg) setMessages([{ role: "assistant", content: initMsg }])
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
          chatbotType: "standard",
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
          chatbotType: "standard",
        }),
      })
    } catch (e) {}
  }

  const resetChat = async () => {
    setMessages([])
    setState(null)
    setLoading(false)
    try {
      await fetch("/api/children-reset", { method: "POST" })
    } catch (e) {}
    setLoading(true)
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: null,
          input: { type: "INIT", text: "" },
          chatbotType: "standard",
        }),
      })
      if (response.ok) {
        const data = await response.json()
        setState(data.state)
        const msg = data.state?.active_node_message ?? data.transition?.response_message
        if (msg) setMessages([{ role: "assistant", content: msg }])
      }
    } catch (e) {} finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <Head>
        <title>Kender du det? Angst, søvn, stress og vaner | Gaarsdal Birkerød</title>
        <meta name="description" content="Kender du det - bekymringer der ikke stopper, søvn der ikke vil, vaner du ikke kan bryde? Hypnoterapi i Birkerød arbejder der tankerne ikke når ind." />
        <link rel="canonical" href="https://gaarsdal.net/kender-du-det" />
        <meta property="og:title" content="Kender du det? | Gaarsdal Hypnoterapi Birkerød" />
        <meta property="og:description" content="Angst, søvn, stress, rygning, selvværd, vaner. Hypnoterapi arbejder der analysen ikke når ind." />
        <meta property="og:image" content="https://gaarsdal.net/Jan-AI.png" />
        <meta property="og:url" content="https://gaarsdal.net/kender-du-det" />
        <meta property="og:type" content="website" />
        <meta name="robots" content="index, follow" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "MedicalWebPage",
              name: "Kender du det - hypnoterapi til voksne",
              description: "Angst, søvn, stress, rygning, selvværd og vaner. Hypnoterapi i Birkerød.",
              url: "https://gaarsdal.net/kender-du-det",
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
          <h1 style={{ fontSize: "32px", fontWeight: 600, marginBottom: "16px", lineHeight: 1.3 }}>
            Kender du det?
          </h1>
          <p style={{ fontSize: "18px", color: "#666", marginBottom: "16px", maxWidth: "640px" }}>
            Du ved godt hvad problemet er. Du har tænkt over det mange gange. Måske prøvet at arbejde med det. Og alligevel bliver det ved.
          </p>
          <p style={{ fontSize: "15px", color: "#555", maxWidth: "640px" }}>
            Hypnoterapi arbejder der analyserne ikke når ind - med de automatiske reaktioner og mønstre der kører under bevidst tænkning. Du behøver ikke forstå dem for at ændre dem.
          </p>
        </section>

        {/* SEKTION 2: PROBLEMKORT */}
        <section style={{ marginBottom: "60px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "24px", textAlign: "center" }}>Genkend dig selv:</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
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
                  transition: "all 0.15s",
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
            <div style={{ marginBottom: "24px" }}>
              <h4 style={{ fontSize: "13px", fontWeight: 600, textTransform: "uppercase", color: "#888", marginBottom: "10px", letterSpacing: "0.05em" }}>Din oplevelse</h4>
              <p style={{ fontSize: "15px", lineHeight: 1.7 }}>{problems[selected].oplevelse}</p>
            </div>
            <div style={{ marginBottom: "24px" }}>
              <h4 style={{ fontSize: "13px", fontWeight: 600, textTransform: "uppercase", color: "#888", marginBottom: "10px", letterSpacing: "0.05em" }}>Hvad der sker</h4>
              <p style={{ fontSize: "15px", lineHeight: 1.7 }}>{problems[selected].hvadSker}</p>
            </div>
            <div style={{ marginBottom: "24px" }}>
              <h4 style={{ fontSize: "13px", fontWeight: 600, textTransform: "uppercase", color: "#888", marginBottom: "10px", letterSpacing: "0.05em" }}>Hvad der virker</h4>
              <p style={{ fontSize: "15px", lineHeight: 1.7 }}>{problems[selected].hvadVirker}</p>
            </div>
            <button onClick={() => setSelected(null)} style={{ padding: "8px 16px", fontSize: "13px", background: "transparent", border: "1px solid #ccc", borderRadius: "4px", cursor: "pointer", color: "#666" }}>
              Luk
            </button>
          </section>
        )}

        {/* SEKTION 4: OM JAN */}
        <section style={{ marginBottom: "48px", padding: "32px", background: "#f9fafb", borderRadius: "10px", borderLeft: "3px solid #5a7a8f" }}>
          <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px", color: "#333" }}>
                Hvem er Jan Gaarsdal?
              </h2>
              <p style={{ fontSize: "15px", lineHeight: 1.7, marginBottom: "12px", color: "#555" }}>
                Jan er hypnoterapeut i Birkerød. Han arbejder med de mønstre og reaktioner der kører automatisk - dem der ikke ændrer sig selv om man forstår dem nok og vil nok.
              </p>
              <p style={{ fontSize: "15px", lineHeight: 1.7, color: "#555" }}>
                Første samtale er altid en afklaring - ingen forpligtelse. Du finder ud af om metoden og Jans måde at arbejde på giver mening for dig.
              </p>
              <div style={{ marginTop: "16px", display: "flex", gap: "24px", flexWrap: "wrap" }}>
                <a href="/om" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", fontWeight: 500 }}>Læs mere om Jan →</a>
                <a href="tel:+4542807474" style={{ fontSize: "14px", color: "#5a7a8f", textDecoration: "none", fontWeight: 500 }}>Ring +45 42 80 74 74</a>
              </div>
            </div>
            <div style={{ flexShrink: 0 }}>
              <Image src="/Jan-AI.png" alt="Jan Gaarsdal" width={90} height={90} className="rounded-xl object-cover shadow-sm" />
            </div>
          </div>
        </section>

        {/* SEKTION 5: CHATBOT */}
        {!showChat ? (
          <section style={{ marginBottom: "60px", padding: "40px", background: "#f5f7fa", borderRadius: "8px", textAlign: "center" }}>
            <h2 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "16px" }}>Stil et spørgsmål eller fortæl hvad du kæmper med</h2>
            <p style={{ fontSize: "15px", marginBottom: "24px", maxWidth: "560px", margin: "0 auto 24px", color: "#555" }}>
              Jeg har en AI-assistent der kan besvare spørgsmål og hjælpe dig afklare om hypnoterapi giver mening for dig.
            </p>
            <button
              onClick={() => { setShowChat(true); initChat() }}
              style={{ padding: "12px 28px", background: "#5a7a8f", color: "#fff", border: "none", borderRadius: "4px", fontWeight: 500, fontSize: "15px", cursor: "pointer" }}
            >
              Åbn chat
            </button>
            <p style={{ fontSize: "13px", color: "#888", marginTop: "16px" }}>
              Dine samtaler bruges ikke til træning og deles ikke med tredjeparter. Jan ser ikke dine refleksioner.
            </p>
          </section>
        ) : !hasConsent ? (
          <section style={{ marginBottom: "60px", padding: "40px", background: "#fff", borderRadius: "8px", border: "1px solid #ddd" }}>
            <div style={{ maxWidth: "500px", margin: "0 auto", textAlign: "center" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "16px" }}>Samtykke til at gemme din samtale</h2>
              <p style={{ fontSize: "14px", color: "#555", marginBottom: "24px", lineHeight: 1.6 }}>
                Vælg nedenfor hvad du er komfortabel med.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button onClick={() => startChat(365)} style={{ padding: "12px 20px", background: "#5a7a8f", color: "#fff", border: "none", borderRadius: "4px", fontWeight: 500, fontSize: "14px", cursor: "pointer", textAlign: "left" }}>
                  Gem samtale (1 år)
                </button>
                <button onClick={() => startChat(0)} style={{ padding: "12px 20px", background: "transparent", color: "#5a7a8f", border: "1px solid #5a7a8f", borderRadius: "4px", fontWeight: 500, fontSize: "14px", cursor: "pointer", textAlign: "left" }}>
                  Kun denne session (ingen gemte data)
                </button>
              </div>
              <p style={{ fontSize: "12px", color: "#888", marginTop: "16px" }}>
                Dine samtaler bruges ikke til træning og deles ikke med tredjeparter.
              </p>
              <button onClick={() => setShowChat(false)} style={{ marginTop: "12px", padding: "8px 16px", background: "transparent", color: "#666", border: "1px solid #ccc", borderRadius: "4px", cursor: "pointer", fontSize: "13px" }}>
                Annuller
              </button>
            </div>
          </section>
        ) : (
          <section style={{ marginBottom: "60px", padding: "30px", background: "#fff", borderRadius: "8px", border: "1px solid #ddd" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 600 }}>AI-assistent</h2>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <button onClick={() => setShowSettings(s => !s)} style={{ background: "transparent", border: "1px solid #ddd", borderRadius: "4px", padding: "5px 8px", fontSize: "14px", cursor: "pointer", color: "#888" }}>⚙</button>
                <button onClick={resetChat} style={{ background: "transparent", border: "1px solid #ddd", borderRadius: "4px", padding: "5px 10px", fontSize: "12px", cursor: "pointer", color: "#666" }}>Ny samtale</button>
                <button onClick={() => setShowChat(false)} style={{ background: "transparent", border: "none", fontSize: "20px", cursor: "pointer", color: "#999" }}>✕</button>
              </div>
            </div>

            {showSettings && (
              <div style={{ marginBottom: "12px", padding: "14px 16px", background: "#f5f7fa", borderRadius: "6px", border: "1px solid #e5e7eb", fontSize: "13px" }}>
                <div style={{ fontWeight: 600, marginBottom: "10px", color: "#444" }}>Dataindstillinger</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {([{ days: 365, label: "Gem i 1 år" }, { days: 90, label: "Gem i 3 måneder" }, { days: 30, label: "Gem i 30 dage" }, { days: 0, label: "Kun denne session" }] as { days: number; label: string }[]).map(({ days, label }) => (
                    <button key={days} onClick={() => updateConsent(days)} style={{ padding: "8px 12px", background: retentionDays === days ? "#5a7a8f" : "#fff", color: retentionDays === days ? "#fff" : "#444", border: "1px solid", borderColor: retentionDays === days ? "#5a7a8f" : "#ddd", borderRadius: "4px", cursor: "pointer", fontSize: "13px", textAlign: "left" }}>
                      {label}{retentionDays === days ? " ✓" : ""}
                    </button>
                  ))}
                </div>
                <p style={{ color: "#999", fontSize: "12px", marginTop: "10px" }}>Dine samtaler bruges ikke til træning og deles ikke med tredjeparter.</p>
              </div>
            )}

            {showCrisisBanner && (
              <div style={{ marginBottom: "12px", padding: "14px 16px", background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", display: "flex", alignItems: "flex-start", gap: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                <span style={{ fontSize: "22px", flexShrink: 0 }}>🕊</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "13px", color: "#444", margin: 0, lineHeight: 1.5 }}>Hvis du har det meget svært, er der gratis hjælp at få.</p>
                  {showCrisisResources && (
                    <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <a href="tel:70201201" style={{ fontSize: "13px", color: "#5a7a8f", textDecoration: "none", fontWeight: 500 }}>📞 Livslinjen - 70 201 201 (gratis, døgnet rundt)</a>
                      <a href="tel:1813" style={{ fontSize: "13px", color: "#5a7a8f", textDecoration: "none", fontWeight: 500 }}>📞 Lægevagten - 1813</a>
                      <a href="tel:112" style={{ fontSize: "13px", color: "#5a7a8f", textDecoration: "none", fontWeight: 500 }}>📞 Akut - 112</a>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                  <button onClick={() => setShowCrisisResources(r => !r)} style={{ padding: "5px 10px", border: "1px solid #ccc", borderRadius: "4px", background: "#fff", fontSize: "12px", cursor: "pointer", color: "#444" }}>{showCrisisResources ? "Skjul ▲" : "Find hjælp ▼"}</button>
                  <button onClick={() => { setShowCrisisBanner(false); setShowCrisisResources(false) }} style={{ background: "transparent", border: "none", fontSize: "16px", cursor: "pointer", color: "#bbb" }}>✕</button>
                </div>
              </div>
            )}

            <div style={{ height: "400px", overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: "6px", padding: "16px", marginBottom: "16px", background: "#fafbfc" }}>
              {messages.length === 1 && !loading && (
                <div style={{ marginTop: "16px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {["Jeg bekymrer mig for meget", "Kan ikke sove", "Vil stoppe med at ryge", "Har angst", "Lavt selvværd"].map((chip) => (
                    <button key={chip} onClick={async () => {
                      if (loading) return
                      setMessages(prev => [...prev, { role: "user", content: chip }])
                      setLoading(true)
                      try {
                        const r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ state, input: { type: "FREE_TEXT", text: chip }, chatbotType: "standard" }) })
                        if (r.ok) { const d = await r.json(); setState(d.state); const msg = d.state?.active_node_message ?? d.transition?.response_message; if (msg) setMessages(prev => [...prev, { role: "assistant", content: msg }]) }
                      } catch(e) {} finally { setLoading(false) }
                    }} style={{ padding: "7px 14px", background: "#f0f4f8", border: "1px solid #d0dce8", borderRadius: "20px", fontSize: "13px", cursor: "pointer", color: "#3d5a72" }}>
                      {chip}
                    </button>
                  ))}
                </div>
              )}
              {messages.map((msg, idx) => (
                <div key={idx} style={{ marginBottom: "12px", display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{ maxWidth: "70%", padding: "10px 14px", borderRadius: "6px", background: msg.role === "user" ? "#5a7a8f" : "#e5e7eb", color: msg.role === "user" ? "#fff" : "#333", fontSize: "14px", lineHeight: 1.5 }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && <div style={{ color: "#999", fontSize: "13px" }}>Assistenten skriver...</div>}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === "Enter" && sendMessage()} placeholder="Skriv hvad som helst..." disabled={loading} style={{ flex: 1, padding: "10px 14px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "14px", fontFamily: "inherit" }} />
              <button onClick={sendMessage} disabled={loading || !input.trim()} style={{ padding: "10px 20px", background: "#5a7a8f", color: "#fff", border: "none", borderRadius: "4px", cursor: loading ? "default" : "pointer", fontSize: "14px", opacity: loading || !input.trim() ? 0.6 : 1 }}>
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
