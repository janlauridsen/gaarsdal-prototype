// pages/talk-to-me.tsx
// TTM — Talk To Me
// Selvstændig side med eget design — deler ingen UI med hypno-chatbotten.

import Head from "next/head"
import { useState, useEffect, useRef, useCallback } from "react"

// ─── Types ─────────────────────────────────────────────────────────────────

type Message = {
  role: "user" | "assistant"
  content: string
  showNumberPicker?: boolean
  showContinuationPicker?: boolean
  isHistory?: boolean
  isHistoryDivider?: boolean
}

type Screen = "landing" | "chat"
type ConsentStatus = "unknown" | "pending" | "given" | "managing"

const CONV_ID_KEY = "ttm_conversation_id"

// ─── Styles ─────────────────────────────────────────────────────────────────

const C = {
  bg: "#1a1610",
  bgOuter: "#120f0a",
  bgSurface: "#201c15",
  bgBubbleJan: "#252018",
  bgBubbleUser: "#3d3020",
  bgInput: "#252018",
  bgConsent: "#1f1b14",
  accent: "#c4a97d",
  accentDim: "rgba(196,169,125,0.15)",
  textPrimary: "#e8dcc8",
  textMuted: "#7a6e5e",
  textDim: "#4a4030",
  border: "#2e2820",
  borderMid: "#3a3028",
}

// ─── Landing ────────────────────────────────────────────────────────────────

function Landing({ onStart }: { onStart: () => void }) {
  const [showMore, setShowMore] = useState(false)

  return (
    <div style={{ minHeight: "100vh", background: C.bgOuter, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ width: "100%", maxWidth: 540, background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 32px 40px", textAlign: "center" }}>

      <div style={{ marginBottom: 20, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: C.textDim }}>
        Gaarsdal · Talk To Me
      </div>

      {/* Jans stemme — tilløbet */}
      <p style={{ fontSize: 15, color: C.textMuted, lineHeight: 1.8, maxWidth: 380, margin: "0 0 8px", fontStyle: "italic" }}>
        "Mange der sidder over for mig, ved ikke helt hvorfor de er der. De bærer på noget — men har ikke haft nogen at sige det højt til."
      </p>
      <p style={{ fontSize: 12, color: C.textDim, margin: "0 0 32px", letterSpacing: "0.04em" }}>— Jan Gaarsdal</p>

      {/* Hvad er TTM — fold ud */}
      <div style={{ marginBottom: 36, width: "100%", maxWidth: 400 }}>
        <button
          onClick={() => setShowMore(!showMore)}
          style={{ background: "none", border: "none", color: C.textDim, fontSize: 12, cursor: "pointer", letterSpacing: "0.06em", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, margin: "0 auto" }}
        >
          <span style={{ fontSize: 10 }}>{showMore ? "▲" : "▼"}</span>
          {showMore ? "Luk" : "Hvad er TTM?"}
        </button>
        {showMore && (
          <div style={{ marginTop: 20, textAlign: "left", padding: "20px 24px", background: C.bgSurface, borderRadius: 12, border: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.75, margin: "0 0 14px" }}>
              TTM er ikke terapi. Det er ikke coaching. Det er en samtale med en der ikke har en dagsorden — og som husker hvad du har fortalt.
            </p>
            <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.75, margin: "0 0 14px" }}>
              Mange har ting på hjerte som de ikke rigtig kan tale med nogen om. Ikke fordi det er hemmeligt — men fordi det er svært at finde de rigtige ord, eller den rigtige stemning.
            </p>
            <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.75, margin: 0 }}>
              Her er der tid. Ingen forkerte svar. Og næste gang du er her, husker vi hvad vi talte om.
            </p>
          </div>
        )}
      </div>

      {/* Akronym */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 40, textAlign: "left" }}>
        {[
          { letter: "T", word: "Tal", desc: "Sig det højt — uanset om du har ord for det" },
          { letter: "T", word: "Tænk", desc: "Find ud af hvad der egentlig sker i dig" },
          { letter: "M", word: "Mærk", desc: "Kom tættere på det der betyder noget" },
        ].map(({ letter, word, desc }) => (
          <div key={letter + word} style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
            <span style={{ fontFamily: "Georgia, serif", fontSize: 26, color: C.accent, width: 20, textAlign: "right", flexShrink: 0 }}>{letter}</span>
            <div>
              <div style={{ fontSize: 15, color: C.textPrimary, letterSpacing: "0.03em" }}>{word}</div>
              <div style={{ fontSize: 12, color: C.textDim, marginTop: 1 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.7, maxWidth: 340, margin: "0 0 32px", fontStyle: "italic" }}>
        Et sted at tænke højt — uden at skulle have svarene klar.
      </p>

      <button
        onClick={onStart}
        style={{ background: C.accent, color: C.bg, border: "none", borderRadius: 40, padding: "13px 32px", fontSize: 14, letterSpacing: "0.04em", cursor: "pointer", fontWeight: 500 }}
      >
        Start samtalen →
      </button>

      <div style={{ marginTop: 36, fontSize: 11, color: C.textDim, letterSpacing: "0.06em" }}>
        Jan Gaarsdal · Hypnoterapeut · Birkerød
      </div>
    </div>
    </div>
  )
}

// ─── Number picker ──────────────────────────────────────────────────────────

function NumberPicker({ onPick }: { onPick: (n: number) => void }) {
  const [selected, setSelected] = useState<number | null>(null)

  function pick(n: number) {
    setSelected(n)
    setTimeout(() => onPick(n), 200)
  }

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 10, letterSpacing: "0.02em" }}>
        Tryk på et tal herunder
      </div>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        {[1,2,3,4,5,6,7,8,9,10].map((n) => (
          <button
            key={n}
            onClick={() => pick(n)}
            style={{
              width: 34, height: 34, borderRadius: "50%",
              border: `1px solid ${selected === n ? C.accent : C.borderMid}`,
              background: selected === n ? C.accent : "transparent",
              color: selected === n ? C.bg : C.textMuted,
              fontSize: 13, cursor: "pointer", fontWeight: selected === n ? 600 : 400,
              transition: "all 0.15s",
            }}
          >
            {n}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: C.textMuted }}>
        <span>Det er svært</span>
        <span>Det går godt</span>
      </div>
    </div>
  )
}

// ─── Continuation picker ────────────────────────────────────────────────────

function ContinuationPicker({ onPick }: { onPick: (choice: "fortsæt" | "nyt emne") => void }) {
  const [picked, setPicked] = useState<string | null>(null)

  function pick(choice: "fortsæt" | "nyt emne") {
    setPicked(choice)
    setTimeout(() => onPick(choice), 180)
  }

  return (
    <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" as const }}>
      <button
        onClick={() => pick("fortsæt")}
        disabled={picked !== null}
        style={{
          background: picked === "fortsæt" ? C.accent : "transparent",
          color: picked === "fortsæt" ? C.bg : C.accent,
          border: `1px solid ${C.accent}`,
          borderRadius: 20, padding: "7px 16px", fontSize: 13,
          cursor: picked !== null ? "default" : "pointer",
          fontFamily: "inherit", transition: "all 0.15s",
          opacity: picked !== null && picked !== "fortsæt" ? 0.4 : 1,
        }}
      >
        Fortsæt samtalen
      </button>
      <button
        onClick={() => pick("nyt emne")}
        disabled={picked !== null}
        style={{
          background: picked === "nyt emne" ? C.accent : "transparent",
          color: picked === "nyt emne" ? C.bg : C.textMuted,
          border: `1px solid ${C.borderMid}`,
          borderRadius: 20, padding: "7px 16px", fontSize: 13,
          cursor: picked !== null ? "default" : "pointer",
          fontFamily: "inherit", transition: "all 0.15s",
          opacity: picked !== null && picked !== "nyt emne" ? 0.4 : 1,
        }}
      >
        Nyt emne
      </button>
    </div>
  )
}

// ─── Consent banner ─────────────────────────────────────────────────────────

function ConsentBanner({ onConsent, manageMode = false, onClose }: {
  onConsent: (days: number) => void
  manageMode?: boolean
  onClose?: () => void
}) {
  return (
    <div style={{ background: C.bgConsent, borderTop: `1px solid ${C.border}`, padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
        <div style={{ fontSize: 12, color: C.textPrimary, fontWeight: 500 }}>
          {manageMode ? "Dine data" : "Inden vi begynder"}
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 16, lineHeight: 1, padding: "0 2px" }}>✕</button>
        )}
      </div>
      {manageMode ? (
        <>
          <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.6, marginBottom: 12 }}>
            Skift opbevaringsperiode, eller slet alle dine data.
          </div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            <button onClick={() => onConsent(90)} style={chipStyle("ghost")}>90 dage</button>
            <button onClick={() => onConsent(365)} style={chipStyle("ghost")}>1 år</button>
            <button onClick={() => onConsent(0)} style={chipStyle("ghost")}>Kun denne samtale</button>
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.6, marginBottom: 12 }}>
            Vores samtaler kan indeholde følsomme personlige oplysninger. Må jeg gemme dem så vi kan fortsætte næste gang?
          </div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            <button onClick={() => onConsent(90)} style={chipStyle("primary")}>Ja, 90 dage</button>
            <button onClick={() => onConsent(0)} style={chipStyle("ghost")}>Kun denne samtale</button>
            <button onClick={() => onConsent(365)} style={chipStyle("ghost")}>1 år</button>
          </div>
          <div style={{ fontSize: 10, color: C.textDim, marginTop: 8, lineHeight: 1.5 }}>
            Ved at vælge gemme giver du udtrykkeligt samtykke til behandling af sundhedsrelaterede oplysninger (GDPR art. 9). Data deles ikke og bruges ikke til træning.
          </div>
        </>
      )}
    </div>
  )
}

function chipStyle(variant: "primary" | "ghost"): React.CSSProperties {
  return {
    background: variant === "primary" ? C.accent : "transparent",
    color: variant === "primary" ? C.bg : C.textMuted,
    border: `1px solid ${variant === "primary" ? C.accent : C.borderMid}`,
    borderRadius: 20, padding: "6px 13px", fontSize: 11, cursor: "pointer",
    fontFamily: "inherit", whiteSpace: "nowrap" as const,
  }
}

// ─── Chat ────────────────────────────────────────────────────────────────────

function Chat({
  messages,
  loading,
  consentStatus,
  onSend,
  onPickNumber,
  onPickContinuation,
  onConsent,
  onNewConversation,
  onManageConsent,
}: {
  messages: Message[]
  loading: boolean
  consentStatus: ConsentStatus
  onSend: (text: string) => void
  onPickNumber: (n: number) => void
  onPickContinuation: (choice: "fortsæt" | "nyt emne") => void
  onConsent: (days: number) => void
  onNewConversation: () => void
  onManageConsent: () => void
}) {
  const [text, setText] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  const lastMsg = messages[messages.length - 1]
  const showPicker = lastMsg?.showNumberPicker === true && lastMsg.role === "assistant"
  const showContinuation = lastMsg?.showContinuationPicker === true && lastMsg.role === "assistant"
  const isQ2 = lastMsg?.role === "assistant" && lastMsg.content.includes("fylder så")
  const showInput = !showPicker && !showContinuation && consentStatus !== "pending"

  function handleSend() {
    const t = text.trim()
    if (!t || loading) return
    setText("")
    onSend(t)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bgOuter, display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
    <div style={{ width: "100%", maxWidth: 680, minHeight: "100vh", display: "flex", flexDirection: "column", background: C.bg }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: `1px solid ${C.border}`, background: C.bg, flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.borderMid, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: C.accent, opacity: 0.7 }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, color: C.textPrimary, fontWeight: 500 }}>Ida</div>
          <div style={{ fontSize: 11, color: C.textDim, letterSpacing: "0.04em" }}>Talk To Me · Gaarsdal</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={onManageConsent}
            title="Dine data"
            style={{ background: "none", border: "none", cursor: "pointer", color: C.textDim, fontSize: 16, padding: "4px 6px", lineHeight: 1, fontFamily: "inherit" }}
          >⚙</button>
          <button
            onClick={onNewConversation}
            title="Ny samtale"
            style={{ background: "none", border: `1px solid ${C.borderMid}`, borderRadius: 20, cursor: "pointer", color: C.textDim, fontSize: 11, padding: "5px 12px", fontFamily: "inherit", letterSpacing: "0.04em", whiteSpace: "nowrap" as const }}
          >Ny samtale</button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px 12px", display: "flex", flexDirection: "column", gap: 14 }}>
        {messages.map((msg, i) => {
          // Skillelinje over historiske beskeder
          if (msg.isHistoryDivider) {
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0" }}>
                <div style={{ flex: 1, height: 1, background: C.border }} />
                <div style={{ fontSize: 10, color: C.textDim, letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" as const }}>Tidligere i samtalen</div>
                <div style={{ flex: 1, height: 1, background: C.border }} />
              </div>
            )
          }

          const historyOpacity = msg.isHistory ? 0.55 : 1

          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%", alignSelf: msg.role === "user" ? "flex-end" : "flex-start", opacity: historyOpacity }}>
              {msg.role === "assistant" && !msg.isHistory && (
                <div style={{ fontSize: 10, letterSpacing: "0.1em", color: C.textDim, textTransform: "uppercase", marginBottom: 5 }}>Ida</div>
              )}
              <div style={{
                padding: "11px 14px",
                borderRadius: 16,
                borderBottomLeftRadius: msg.role === "assistant" ? 4 : 16,
                borderBottomRightRadius: msg.role === "user" ? 4 : 16,
                background: msg.isHistory
                  ? (msg.role === "assistant" ? C.bgBubbleJan : C.bgBubbleUser)
                  : (msg.role === "assistant" ? C.bgBubbleJan : C.bgBubbleUser),
                color: msg.role === "assistant" ? "#c8bc9e" : "#ede3cc",
                fontSize: msg.isHistory ? 13 : 14,
                lineHeight: 1.65,
                whiteSpace: "pre-wrap" as const,
                border: msg.isHistory ? `1px solid ${C.border}` : "none",
              }}>
                {msg.content}
                {msg.showNumberPicker && msg.role === "assistant" && (
                  <NumberPicker onPick={onPickNumber} />
                )}
                {msg.showContinuationPicker && msg.role === "assistant" && (
                  <ContinuationPicker onPick={onPickContinuation} />
                )}
              </div>
            </div>
          )
        })}

        {loading && (
          <div style={{ alignSelf: "flex-start" }}>
            <div style={{ fontSize: 10, letterSpacing: "0.1em", color: C.textDim, textTransform: "uppercase", marginBottom: 5 }}>Ida</div>
            <div style={{ padding: "11px 16px", borderRadius: 16, borderBottomLeftRadius: 4, background: C.bgBubbleJan, display: "flex", gap: 6, alignItems: "center" }}>
              {[0,1,2].map((i) => (
                <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: C.textDim, animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Consent */}
      {(consentStatus === "pending" || consentStatus === "managing") && (
        <ConsentBanner
          onConsent={onConsent}
          manageMode={consentStatus === "managing"}
          onClose={consentStatus === "managing" ? onManageConsent : undefined}
        />
      )}

      {/* Input */}
      {showInput && (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 9, padding: "12px 14px", borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder={isQ2 ? "Skriv frit — der er ingen forkerte svar her..." : "Skriv noget…"}
            rows={1}
            style={{
              flex: 1, background: C.bgInput, border: `1px solid ${C.border}`, borderRadius: 18,
              padding: "9px 14px", fontSize: 14, color: "#c8bc9e", fontFamily: "inherit",
              outline: "none", resize: "none", lineHeight: 1.5, maxHeight: 100,
            }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || loading}
            style={{
              width: 34, height: 34, borderRadius: "50%", border: "none", cursor: text.trim() && !loading ? "pointer" : "default",
              background: text.trim() && !loading ? C.accent : C.borderMid,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M14 8L2 2l2.5 6L2 14l12-6z" fill={text.trim() && !loading ? C.bg : C.textDim} />
            </svg>
          </button>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function TalkToMe() {
  const [screen, setScreen] = useState<Screen>("landing")
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string>("")
  const [consentStatus, setConsentStatus] = useState<ConsentStatus>("unknown")

  // ── Init: hent åbningsbesked fra API ──────────────────────────────────────

  const initCalledRef = useRef(false)

  const initChat = useCallback(async () => {
    if (initCalledRef.current) return
    initCalledRef.current = true
    setScreen("chat")
    setLoading(true)

    const storedId = typeof window !== "undefined" ? localStorage.getItem(CONV_ID_KEY) ?? "" : ""

    try {
      const res = await fetch("/api/talk-to-me-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userText: "", conversationId: storedId }),
      })
      const data = await res.json()

      if (data.conversationId) {
        setConversationId(data.conversationId)
        if (typeof window !== "undefined") {
          localStorage.setItem(CONV_ID_KEY, data.conversationId)
        }
      }

      if (data.message) {
        const historyMsgs: Message[] = []
        if (data.showContinuationPicker && Array.isArray(data.previousTurns) && data.previousTurns.length > 0) {
          historyMsgs.push({ role: "assistant", content: "", isHistoryDivider: true })
          for (const t of data.previousTurns) {
            historyMsgs.push({ role: t.role as "user" | "assistant", content: t.content, isHistory: true })
          }
        }
        setMessages([
          ...historyMsgs,
          { role: "assistant", content: data.message, showNumberPicker: data.showNumberPicker, showContinuationPicker: data.showContinuationPicker },
        ])
      }

      // Ny bruger uden samtykke → vis banner
      setConsentStatus(data.isReturning ? "given" : "pending")

    } catch {
      setMessages([{ role: "assistant", content: "Noget gik galt. Prøv at genindlæse siden." }])
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Send besked ───────────────────────────────────────────────────────────

  async function sendMessage(userText: string, retentionDays?: number) {
    setMessages((prev) => [...prev, { role: "user", content: userText }])
    setLoading(true)

    try {
      const body: Record<string, unknown> = { userText, conversationId }
      if (typeof retentionDays === "number") body.retentionDays = retentionDays

      const res = await fetch("/api/talk-to-me-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (data.message) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.message, showNumberPicker: data.showNumberPicker, showContinuationPicker: data.showContinuationPicker },
        ])
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Noget gik galt. Prøv igen." }])
    } finally {
      setLoading(false)
    }
  }

  // ── Tal-vælger (Q1) ────────────────────────────────────────────────────────

  function handlePickNumber(n: number) {
    sendMessage(String(n))
  }

  // ── Continuation-vælger ────────────────────────────────────────────────────

  function handlePickContinuation(choice: "fortsæt" | "nyt emne") {
    sendMessage(choice)
  }

  // ── Samtykke ───────────────────────────────────────────────────────────────

  async function handleConsent(days: number) {
    setConsentStatus("given")
    try {
      await fetch("/api/talk-to-me-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userText: "", conversationId, retentionDays: days }),
      })
    } catch {
      // Non-critical
    }
  }

  // ── Administrer data ────────────────────────────────────────────────────────

  function handleManageConsent() {
    setConsentStatus((prev) => prev === "managing" ? "given" : "managing")
  }

  // ── Ny samtale ──────────────────────────────────────────────────────────────

  async function handleNewConversation() {
    // Hard reset: slet Redis-state for nuværende samtale
    if (conversationId) {
      try {
        await fetch("/api/talk-to-me-chat", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId }),
        })
      } catch {
        // Non-critical — state udløber alligevel via TTL
      }
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem(CONV_ID_KEY)
    }
    setMessages([])
    setConversationId("")
    setConsentStatus("unknown")
    initCalledRef.current = false
    initChat()
  }

  return (
    <>
      <Head>
        <title>Talk To Me — Gaarsdal</title>
        <meta name="description" content="Et sted at tænke højt — uden at skulle have svarene klar. TTM af Gaarsdal." />
        <meta name="robots" content="noindex" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {screen === "landing" ? (
        <Landing onStart={initChat} />
      ) : (
        <Chat
          messages={messages}
          loading={loading}
          consentStatus={consentStatus}
          onSend={sendMessage}
          onPickNumber={handlePickNumber}
          onPickContinuation={handlePickContinuation}
          onConsent={handleConsent}
          onNewConversation={handleNewConversation}
          onManageConsent={handleManageConsent}
        />
      )}
    </>
  )
}
