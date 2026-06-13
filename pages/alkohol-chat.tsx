import React, { useState, useEffect, useRef } from "react"
import Head from "next/head"

type Message = { role: "user" | "assistant"; content: string }

export default function AlkoholChatTest() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [state, setState] = useState<any>(null)
  const [crisis, setCrisis] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages, loading])

  const init = async () => {
    setLoading(true)
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: null, input: { type: "INIT", text: "" }, chatbotType: "alcohol" }),
      })
      if (r.ok) {
        const data = await r.json()
        setState(data.state)
        const msg = data.state?.active_node_message ?? data.transition?.response_message
        if (msg) setMessages([{ role: "assistant", content: msg }])
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { init() }, [])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMessage = input
    setInput("")
    setMessages(prev => [...prev, { role: "user", content: userMessage }])
    setLoading(true)
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state, input: { type: "FREE_TEXT", text: userMessage }, chatbotType: "alcohol" }),
      })
      if (r.ok) {
        const data = await r.json()
        setState(data.state)
        const isCrisis = data.transition?.to === "CRISIS_INFO" || data.transition?.reason?.includes("crisis")
        if (isCrisis) setCrisis(true)
        const reply = data.state?.active_node_message ?? data.transition?.response_message
        if (reply) setMessages(prev => [...prev, { role: "assistant", content: reply }])
      }
    } catch (e) {
      console.error(e)
    } finally { setLoading(false) }
  }

  const reset = () => { setMessages([]); setState(null); setCrisis(false); init() }

  return (
    <>
      <Head><title>Alkohol-assistent (TEST)</title><meta name="robots" content="noindex" /></Head>
      <div style={{ minHeight: "100vh", background: "#EFEDE7", fontFamily: "'DM Sans', system-ui, sans-serif", padding: "20px" }}>
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h1 style={{ fontSize: "18px", fontWeight: 600, color: "#2C2A28", margin: 0 }}>Alkohol-assistent</h1>
              <span style={{ fontSize: "12px", color: "#8a8a86" }}>TEST · chatbotType: alcohol</span>
            </div>
            <button onClick={reset} style={{ fontSize: "13px", padding: "6px 12px", border: "1px solid #c5c2ba", background: "#fff", borderRadius: "6px", cursor: "pointer" }}>Nulstil</button>
          </div>

          {crisis && (
            <div style={{ padding: "16px", background: "#fdf6f0", border: "1px solid #ecd9c6", borderRadius: "10px", marginBottom: "12px", fontSize: "14px", color: "#5a4a38" }}>
              Det lyder som om du har det svært lige nu. Du er ikke alene med det. Ring til Alkolinjen 80 200 500 (gratis, anonym), din egen læge, eller 1813.
            </div>
          )}

          <div style={{ background: "#fff", borderRadius: "12px", padding: "16px", minHeight: "400px", maxHeight: "60vh", overflowY: "auto", marginBottom: "12px" }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: "10px" }}>
                <div style={{ maxWidth: "80%", padding: "10px 14px", borderRadius: "12px", fontSize: "15px", lineHeight: 1.6, whiteSpace: "pre-wrap",
                  background: m.role === "user" ? "#5a7a8f" : "#f0efe9", color: m.role === "user" ? "#fff" : "#2C2A28" }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && <div style={{ fontSize: "13px", color: "#8a8a86", padding: "8px" }}>...</div>}
            <div ref={endRef} />
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Skriv her..."
              style={{ flex: 1, padding: "12px 14px", border: "1px solid #c5c2ba", borderRadius: "8px", fontSize: "15px", fontFamily: "inherit", outline: "none" }}
            />
            <button onClick={send} disabled={loading} style={{ padding: "12px 20px", background: "#5a7a8f", color: "#fff", border: "none", borderRadius: "8px", fontSize: "15px", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}>Send</button>
          </div>
        </div>
      </div>
    </>
  )
}
