import React, { useState, useEffect, useRef } from "react"

type Message = { role: "user" | "assistant"; content: string }

const WELCOME = "Hej. Her kan du undersøge din relation til alkohol — hvad fylder, hvad koster det, hvad er du i tvivl om. Skriv frit, det er fortroligt."

const CHIPS = [
  "Jeg drikker mere end jeg vil",
  "Drikker for at slappe af",
  "Påvirker det min søvn?",
  "Hvornår er det et problem?",
]

export default function AlcoholChat() {
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: WELCOME }])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [state, setState] = useState<any>(null)
  const [started, setStarted] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const convIdRef = useRef<string>("lobby:u:alc-" + Math.random().toString(36).slice(2) + Date.now().toString(36))

  useEffect(() => {
    if (started && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading, started])

  const sendMessage = async (text: string) => {
    const userMessage = text.trim()
    if (!userMessage || loading) return
    setStarted(true)
    setInput("")
    setMessages(prev => [...prev, { role: "user", content: userMessage }])
    setLoading(true)
    try {
      // Første rigtige tur: send INIT-state med frisk conversation_id
      const payloadState = state ?? { conversation_id: convIdRef.current }
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: payloadState, input: { type: "FREE_TEXT", text: userMessage }, chatbotType: "alcohol" }),
      })
      if (r.ok) {
        const data = await r.json()
        setState(data.state)
        const reply = data.state?.active_node_message ?? data.transition?.response_message
        if (reply) setMessages(prev => [...prev, { role: "assistant", content: reply }])
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "Beklager, der opstod en fejl. Prøv igen, eller ring til Jan på 42 80 74 74." }])
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Beklager, der opstod en fejl. Prøv igen, eller ring til Jan på 42 80 74 74." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      border: "1px solid #dfe5ea",
      borderRadius: "14px",
      overflow: "hidden",
      background: "#fff",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
    }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", background: "#5a7a8f", color: "#fff", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#a3d9a5" }} />
        <div>
          <div style={{ fontSize: "15px", fontWeight: 600 }}>Anonym samtale om alkohol</div>
          <div style={{ fontSize: "12px", opacity: 0.85 }}>Fortroligt · ingen registrering · svar med det samme</div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ padding: "20px", maxHeight: started ? "440px" : "none", overflowY: "auto" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: "12px" }}>
            <div style={{
              maxWidth: "82%",
              padding: "11px 15px",
              borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              fontSize: "15px",
              lineHeight: 1.65,
              whiteSpace: "pre-wrap",
              background: m.role === "user" ? "#5a7a8f" : "#f0f3f5",
              color: m.role === "user" ? "#fff" : "#2C2A28",
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "12px" }}>
            <div style={{ padding: "11px 15px", borderRadius: "14px 14px 14px 4px", background: "#f0f3f5", color: "#999", fontSize: "15px" }}>
              <span className="alc-dots">skriver</span>
            </div>
          </div>
        )}

        {/* Chips - kun før samtalen er startet */}
        {!started && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
            {CHIPS.map((chip, i) => (
              <button
                key={i}
                onClick={() => sendMessage(chip)}
                style={{
                  fontSize: "13px",
                  color: "#5a7a8f",
                  background: "#fff",
                  border: "1px solid #c5d2da",
                  borderRadius: "20px",
                  padding: "7px 14px",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f4f8")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
              >
                {chip}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: "14px 16px", borderTop: "1px solid #eef1f3", display: "flex", gap: "10px", alignItems: "center" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
          placeholder="Skriv her…"
          disabled={loading}
          style={{
            flex: 1,
            padding: "11px 14px",
            border: "1px solid #d7dde2",
            borderRadius: "8px",
            fontSize: "15px",
            fontFamily: "inherit",
            outline: "none",
            background: loading ? "#f7f8f9" : "#fff",
          }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          style={{
            padding: "11px 20px",
            background: loading || !input.trim() ? "#b8c5ce" : "#5a7a8f",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "15px",
            fontWeight: 500,
            cursor: loading || !input.trim() ? "default" : "pointer",
          }}
        >
          Send
        </button>
      </div>

      {/* Disclaimer */}
      <div style={{ padding: "10px 16px", background: "#fafbfc", borderTop: "1px solid #eef1f3" }}>
        <p style={{ fontSize: "11px", color: "#9aa0a6", margin: 0, lineHeight: 1.5 }}>
          Dette er en støttende samtale, ikke behandling eller diagnose. Ved akut behov: Alkolinjen 80 200 500 eller egen læge.
        </p>
      </div>

      <style jsx>{`
        .alc-dots::after {
          content: "";
          animation: alcDots 1.4s infinite;
        }
        @keyframes alcDots {
          0% { content: ""; }
          25% { content: "."; }
          50% { content: ".."; }
          75% { content: "..."; }
        }
      `}</style>
    </div>
  )
}
