import { useState, useEffect, useCallback } from "react"
import Head from "next/head"

// ─── Types ────────────────────────────────────────────────────────────────────

type RawTurn = {
  ts: string
  conversation_id: string
  revision: number
  node_id: string
  input_type: string
  user_input: string
  assistant_output: string
}

type Conversation = {
  conversation_id: string
  turns: RawTurn[]
}

type Handoff = {
  id: string
  received_at: string
  navn: string
  emne: string
  kontakt: string
  besked?: string
  email_status?: string
  conversation_id: string
}

type Lead = {
  id: string
  received_at: string
  email: string
  tema?: string
  conversation_id: string
}

type FeedbackItem = {
  ts: string
  conversation_id: string
  revision?: number
  rating: "positive" | "partial" | "negative"
  tags?: string[]
  note?: string
  meta?: { node?: string; mode?: string; move?: string }
}

type AnticipateDraft = {
  job_id: string
  based_on_revision: number
  anticipated_user_text: string
  rhetorical_instruction: string
  created_at: number
}

type ExportData = {
  from: string
  to: string
  total_conversations: number
  total_turns: number
  conversations: Conversation[]
  handoffs?: Handoff[]
  leads?: Lead[]
  feedback?: FeedbackItem[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("da-DK", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
  } catch { return iso }
}

function shortId(id: string): string {
  return id.slice(-8)
}

function countUserTurns(turns: RawTurn[]): number {
  return turns.filter(t => t.input_type === "FREE_TEXT" && t.user_input?.trim()).length
}

function getFirstUserMessage(turns: RawTurn[]): string {
  const t = turns.find(t => t.input_type === "FREE_TEXT" && t.user_input?.trim())
  return t?.user_input?.slice(0, 80) ?? "—"
}

function getLastNode(turns: RawTurn[]): string {
  return turns[turns.length - 1]?.node_id ?? "—"
}

function toCSV(conversations: Conversation[]): string {
  const rows: string[] = ["conversation_id,started_at,turn,node,user,assistant"]
  for (const conv of conversations) {
    for (let i = 0; i < conv.turns.length; i++) {
      const t = conv.turns[i]
      const esc = (s: string) => {
        const c = (s ?? "").replace(/\r?\n/g, " ")
        return c.includes(",") || c.includes('"') ? `"${c.replace(/"/g, '""')}"` : c
      }
      rows.push([
        esc(conv.conversation_id),
        esc(t.ts),
        String(i + 1),
        esc(t.node_id),
        esc(t.user_input),
        esc(t.assistant_output),
      ].join(","))
    }
  }
  return rows.join("\n")
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [secret, setSecret] = useState("")
  const [secretInput, setSecretInput] = useState("")
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState(false)
  const [autoLoaded, setAutoLoaded] = useState(false)

  const [from, setFrom] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d.toISOString().slice(0, 10)
  })
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10))

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ExportData | null>(null)

  const [tab, setTab] = useState<"conversations" | "handoffs" | "leads" | "feedback" | "memory">("handoffs")
  const [openConvId, setOpenConvId] = useState<string | null>(null)
  const [returnToTab, setReturnToTab] = useState<"conversations" | "handoffs" | "leads" | "feedback" | "memory">("conversations")

  // Anticipate state
  const [anticipateDrafts, setAnticipateDrafts] = useState<AnticipateDraft[]>([])
  const [anticipateLoading, setAnticipateLoading] = useState(false)
  const [expandedAnticipate, setExpandedAnticipate] = useState<string | null>(null)

  // Memory tab state
  const [memoryData, setMemoryData] = useState<any>(null)
  const [memoryLoading, setMemoryLoading] = useState(false)
  const [memoryError, setMemoryError] = useState<string | null>(null)
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [expandedThread, setExpandedThread] = useState<string | null>(null)

  const fetchMemory = useCallback(async () => {
    if (!secret) return
    setMemoryLoading(true)
    setMemoryError(null)
    try {
      const res = await fetch(`/api/admin/memory?secret=${encodeURIComponent(secret)}`)
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setMemoryError(j.error ?? `HTTP ${res.status}`)
        return
      }
      setMemoryData(await res.json())
    } catch (e: any) {
      setMemoryError(e.message ?? "Ukendt fejl")
    } finally {
      setMemoryLoading(false)
    }
  }, [secret])

  const fetchAnticipate = useCallback(async (convId: string) => {
    if (!secret || !convId) return
    setAnticipateLoading(true)
    setAnticipateDrafts([])
    setExpandedAnticipate(null)
    try {
      const res = await fetch(`/api/admin/anticipate?secret=${encodeURIComponent(secret)}&conversation_id=${encodeURIComponent(convId)}`)
      if (res.ok) {
        const j = await res.json()
        setAnticipateDrafts(j.drafts ?? [])
      }
    } catch { /* non-fatal */ }
    finally { setAnticipateLoading(false) }
  }, [secret])

  const handleAuth = () => {
    if (!secretInput.trim()) return
    setSecret(secretInput.trim())
    setAuthed(true)
    setAuthError(false)
  }

  const fetchData = useCallback(async () => {
    if (!secret) return
    setLoading(true)
    setError(null)
    setData(null)
    setOpenConvId(null)
    try {
      const url = `/api/admin/export?secret=${encodeURIComponent(secret)}&from=${from}&to=${to}&format=json&include_handoffs=1&limit=500`
      const res = await fetch(url)
      if (res.status === 401) {
        setAuthed(false)
        setAuthError(true)
        return
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setError(j.error ?? `HTTP ${res.status}`)
        return
      }
      const json = await res.json()
      setData(json)
      setTab(json.handoffs?.length > 0 ? "handoffs" : "conversations")
    } catch (e: any) {
      setError(e.message ?? "Ukendt fejl")
    } finally {
      setLoading(false)
    }
  }, [secret, from, to])

  // Auto-load on login
  useEffect(() => {
    if (authed && secret && !autoLoaded) {
      setAutoLoaded(true)
      fetchData()
    }
  }, [authed, secret, autoLoaded, fetchData])

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: "#EFEDE7", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <Head><title>Admin — Gaarsdal</title></Head>
        <div style={{ background: "#fff", borderRadius: "16px", padding: "40px", width: "100%", maxWidth: "380px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
          <div style={{ marginBottom: "24px" }}>
            <div style={{ fontSize: "13px", color: "#6B675F", marginBottom: "4px", letterSpacing: "0.05em", textTransform: "uppercase" }}>Gaarsdal</div>
            <div style={{ fontSize: "22px", fontWeight: 500, color: "#2C2A28" }}>Admin</div>
          </div>
          {authError && (
            <div style={{ background: "#FEF2F2", color: "#991B1B", fontSize: "14px", padding: "10px 14px", borderRadius: "8px", marginBottom: "16px" }}>
              Forkert adgangskode
            </div>
          )}
          <input
            type="password"
            placeholder="Adgangskode"
            value={secretInput}
            onChange={e => setSecretInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAuth()}
            style={{ width: "100%", padding: "10px 14px", border: "1px solid #D8D5CC", borderRadius: "8px", fontSize: "15px", outline: "none", boxSizing: "border-box", fontFamily: "inherit", marginBottom: "12px" }}
            autoFocus
          />
          <button
            onClick={handleAuth}
            style={{ width: "100%", padding: "11px", background: "#627A52", color: "#fff", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
          >
            Log ind
          </button>
        </div>
      </div>
    )
  }

  const conversations = data?.conversations ?? []
  const handoffs = (data?.handoffs ?? []) as Handoff[]
  const leads = (data?.leads ?? []) as Lead[]
  const feedbackItems = (data?.feedback ?? []) as FeedbackItem[]
  const openConv = conversations.find(c => c.conversation_id === openConvId) ?? null

  return (
    <div style={{ minHeight: "100vh", background: "#EFEDE7", fontFamily: "inherit" }}>
      <Head><title>Admin — Gaarsdal</title></Head>

      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #D8D5CC", padding: "0 24px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: "56px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ fontSize: "15px", fontWeight: 500, color: "#2C2A28" }}>Gaarsdal Admin</span>
          </div>
          <button
            onClick={() => { setAuthed(false); setSecret(""); setSecretInput(""); setData(null) }}
            style={{ fontSize: "13px", color: "#6B675F", background: "none", border: "none", cursor: "pointer", padding: "4px 8px" }}
          >
            Log ud
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px" }}>

        {/* Filter bar */}
        <div style={{ background: "#fff", borderRadius: "12px", padding: "16px 20px", marginBottom: "20px", display: "flex", alignItems: "flex-end", gap: "16px", flexWrap: "wrap", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "#6B675F", marginBottom: "4px" }}>Fra</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              style={{ padding: "8px 12px", border: "1px solid #D8D5CC", borderRadius: "8px", fontSize: "14px", fontFamily: "inherit", outline: "none" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "#6B675F", marginBottom: "4px" }}>Til</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              style={{ padding: "8px 12px", border: "1px solid #D8D5CC", borderRadius: "8px", fontSize: "14px", fontFamily: "inherit", outline: "none" }} />
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            style={{ padding: "9px 20px", background: "#627A52", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, fontFamily: "inherit" }}
          >
            {loading ? "Henter…" : "Hent data"}
          </button>
          {data && (
            <>
              <button
                onClick={() => downloadBlob(toCSV(conversations), `samtaler-${from}-${to}.csv`, "text/csv")}
                style={{ padding: "9px 16px", background: "transparent", color: "#627A52", border: "1.5px solid #627A52", borderRadius: "8px", fontSize: "14px", cursor: "pointer", fontFamily: "inherit" }}
              >
                Download CSV
              </button>
              <button
                onClick={() => downloadBlob(JSON.stringify(data, null, 2), `gaarsdal-export-${from}-${to}.json`, "application/json")}
                style={{ padding: "9px 16px", background: "transparent", color: "#6B675F", border: "1.5px solid #D8D5CC", borderRadius: "8px", fontSize: "14px", cursor: "pointer", fontFamily: "inherit" }}
              >
                Download JSON
              </button>
            </>
          )}
        </div>

        {error && (
          <div style={{ background: "#FEF2F2", color: "#991B1B", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", fontSize: "14px" }}>
            {error}
          </div>
        )}

        {data && (
          <>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "20px" }}>
              {[
                { label: "Samtaler", value: data.total_conversations },
                { label: "Turns i alt", value: data.total_turns },
                { label: "Henvendelser", value: handoffs.length },
                { label: "Leads", value: leads.length },
                { label: "Feedback", value: feedbackItems.length },
              ].map(s => (
                <div key={s.label} style={{ background: "#fff", borderRadius: "12px", padding: "16px 20px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                  <div style={{ fontSize: "28px", fontWeight: 500, color: "#2C2A28" }}>{s.value}</div>
                  <div style={{ fontSize: "13px", color: "#6B675F", marginTop: "2px" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: "4px", marginBottom: "16px", flexWrap: "wrap" }}>
              {([
                { id: "handoffs", label: `Henvendelser (${handoffs.length})` },
                { id: "leads", label: `Leads (${leads.length})` },
                { id: "feedback", label: `Feedback (${feedbackItems.length})` },
                { id: "conversations", label: `Alle samtaler (${conversations.length})` },
                { id: "memory", label: "Hukommelse" },
              ] as const).map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTab(t.id); setOpenConvId(null)
                    if (t.id === "memory" && !memoryData && !memoryLoading) fetchMemory()
                  }}
                  style={{
                    padding: "8px 16px", borderRadius: "8px", fontSize: "14px", border: "none", cursor: "pointer",
                    background: tab === t.id ? "#627A52" : "#fff",
                    color: tab === t.id ? "#fff" : "#6B675F",
                    fontWeight: tab === t.id ? 500 : 400,
                    fontFamily: "inherit",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Handoffs tab */}
            {tab === "handoffs" && !openConvId && (
              <div style={{ background: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                {handoffs.length === 0 ? (
                  <div style={{ padding: "40px", textAlign: "center", color: "#6B675F", fontSize: "14px" }}>Ingen henvendelser i perioden</div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                    <thead>
                      <tr style={{ background: "#F9F8F5", borderBottom: "1px solid #D8D5CC" }}>
                        {["Modtaget", "Navn", "Emne", "Kontakt", "Besked", "Email", ""].map(h => (
                          <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "12px", color: "#6B675F", fontWeight: 500 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {handoffs.map((h, i) => {
                        const linkedConv = conversations.find(c => c.conversation_id === h.conversation_id)
                        return (
                          <tr key={h.id} style={{ borderBottom: i < handoffs.length - 1 ? "1px solid #F0EDE7" : "none" }}>
                            <td style={{ padding: "12px 16px", color: "#6B675F", whiteSpace: "nowrap" }}>{formatDate(h.received_at)}</td>
                            <td style={{ padding: "12px 16px", fontWeight: 500 }}>{h.navn || "—"}</td>
                            <td style={{ padding: "12px 16px" }}>{h.emne || "—"}</td>
                            <td style={{ padding: "12px 16px" }}>{h.kontakt || "—"}</td>
                            <td style={{ padding: "12px 16px", color: "#6B675F", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.besked || "—"}</td>
                            <td style={{ padding: "12px 16px" }}>
                              <span style={{
                                fontSize: "12px", padding: "2px 8px", borderRadius: "12px",
                                background: h.email_status === "sent" ? "#F0FDF4" : h.email_status?.startsWith("error") ? "#FEF2F2" : "#F9F8F5",
                                color: h.email_status === "sent" ? "#166534" : h.email_status?.startsWith("error") ? "#991B1B" : "#6B675F",
                              }}>
                                {h.email_status ?? "ukendt"}
                              </span>
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              {linkedConv && (
                                <button
                                  onClick={() => { setReturnToTab("handoffs"); setTab("conversations"); setOpenConvId(h.conversation_id); fetchAnticipate(h.conversation_id) }}
                                  style={{ fontSize: "12px", color: "#627A52", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit", textDecoration: "underline" }}
                                >
                                  Se samtale
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Leads tab */}
            {tab === "leads" && (
              <div style={{ background: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                {leads.length === 0 ? (
                  <div style={{ padding: "40px", textAlign: "center", color: "#6B675F", fontSize: "14px" }}>Ingen leads i perioden</div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                    <thead>
                      <tr style={{ background: "#F9F8F5", borderBottom: "1px solid #D8D5CC" }}>
                        {["Modtaget", "Email", "Tema"].map(h => (
                          <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "12px", color: "#6B675F", fontWeight: 500 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((l, i) => (
                        <tr key={l.id} style={{ borderBottom: i < leads.length - 1 ? "1px solid #F0EDE7" : "none" }}>
                          <td style={{ padding: "12px 16px", color: "#6B675F", whiteSpace: "nowrap" }}>{formatDate(l.received_at)}</td>
                          <td style={{ padding: "12px 16px", fontWeight: 500 }}>{l.email || "—"}</td>
                          <td style={{ padding: "12px 16px", color: "#6B675F" }}>{l.tema || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Feedback tab */}
            {tab === "feedback" && (
              <div style={{ background: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                {feedbackItems.length === 0 ? (
                  <div style={{ padding: "40px", textAlign: "center", color: "#6B675F", fontSize: "14px" }}>Ingen feedback i perioden</div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                    <thead>
                      <tr style={{ background: "#F9F8F5", borderBottom: "1px solid #D8D5CC" }}>
                        {["Tidspunkt", "Vurdering", "Node", "Tags", "Note", ""].map(h => (
                          <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "12px", color: "#6B675F", fontWeight: 500 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...feedbackItems].reverse().map((f, i) => {
                        const linkedConv = conversations.find(c => c.conversation_id === f.conversation_id)
                        const ratingColor = f.rating === "positive" ? { bg: "#F0FDF4", color: "#166534", label: "👍 God" }
                          : f.rating === "negative" ? { bg: "#FEF2F2", color: "#991B1B", label: "👎 Dårlig" }
                          : { bg: "#FFFBEB", color: "#92400E", label: "↔ Delvis" }
                        return (
                          <tr key={i} style={{ borderBottom: i < feedbackItems.length - 1 ? "1px solid #F0EDE7" : "none" }}>
                            <td style={{ padding: "12px 16px", color: "#6B675F", whiteSpace: "nowrap" }}>{formatDate(f.ts)}</td>
                            <td style={{ padding: "12px 16px" }}>
                              <span style={{ fontSize: "12px", padding: "2px 8px", borderRadius: "12px", background: ratingColor.bg, color: ratingColor.color }}>
                                {ratingColor.label}
                              </span>
                            </td>
                            <td style={{ padding: "12px 16px", fontSize: "12px", color: "#6B675F", fontFamily: "monospace" }}>{f.meta?.node ?? "—"}</td>
                            <td style={{ padding: "12px 16px", fontSize: "12px", color: "#6B675F" }}>
                              {(f.tags ?? []).length > 0 ? f.tags!.join(", ") : "—"}
                            </td>
                            <td style={{ padding: "12px 16px", color: "#2C2A28", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {f.note || "—"}
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              {linkedConv && (
                                <button
                                  onClick={() => { setReturnToTab("feedback"); setTab("conversations"); setOpenConvId(f.conversation_id); fetchAnticipate(f.conversation_id) }}
                                  style={{ fontSize: "12px", color: "#627A52", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit", textDecoration: "underline" }}
                                >
                                  Se samtale
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Conversations tab */}
            {tab === "conversations" && !openConvId && (
              <div style={{ background: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                {conversations.length === 0 ? (
                  <div style={{ padding: "40px", textAlign: "center", color: "#6B675F", fontSize: "14px" }}>Ingen samtaler i perioden</div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                    <thead>
                      <tr style={{ background: "#F9F8F5", borderBottom: "1px solid #D8D5CC" }}>
                        {["Start", "ID", "Turns", "Første besked", "Slut-node"].map(h => (
                          <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "12px", color: "#6B675F", fontWeight: 500 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {conversations.map((c, i) => (
                        <tr
                          key={c.conversation_id}
                          onClick={() => { setReturnToTab("conversations"); setOpenConvId(c.conversation_id); fetchAnticipate(c.conversation_id) }}
                          style={{ borderBottom: i < conversations.length - 1 ? "1px solid #F0EDE7" : "none", cursor: "pointer" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#FAFAF7")}
                          onMouseLeave={e => (e.currentTarget.style.background = "")}
                        >
                          <td style={{ padding: "12px 16px", color: "#6B675F", whiteSpace: "nowrap" }}>{formatDate(c.turns[0]?.ts ?? "")}</td>
                          <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: "12px", color: "#6B675F" }}>{shortId(c.conversation_id)}</td>
                          <td style={{ padding: "12px 16px" }}>{countUserTurns(c.turns)}</td>
                          <td style={{ padding: "12px 16px", maxWidth: "280px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getFirstUserMessage(c.turns)}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ fontSize: "12px", padding: "2px 8px", borderRadius: "12px", background: getLastNode(c.turns) === "HANDOFF_CONFIRM" ? "#F0FDF4" : "#F9F8F5", color: getLastNode(c.turns) === "HANDOFF_CONFIRM" ? "#166534" : "#6B675F" }}>
                              {getLastNode(c.turns)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Conversation detail */}
            {tab === "conversations" && openConv && (
              <div>
                <button
                  onClick={() => { setOpenConvId(null); setTab(returnToTab) }}
                  style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "#627A52", background: "none", border: "none", cursor: "pointer", marginBottom: "16px", padding: 0, fontFamily: "inherit" }}
                >
                  ← Tilbage
                </button>
                <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                  <div style={{ fontSize: "12px", color: "#6B675F", marginBottom: "16px", fontFamily: "monospace", display: "flex", alignItems: "center", gap: "12px" }}>
                    <span>{openConv.conversation_id} · {openConv.turns.length} turns</span>
                    {anticipateLoading && <span style={{ color: "#9CA3AF" }}>henter lookahead…</span>}
                    {!anticipateLoading && anticipateDrafts.length > 0 && (
                      <span style={{ color: "#627A52", fontSize: "11px" }}>✓ {anticipateDrafts.length} lookahead-drafts</span>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {openConv.turns.filter(t => t.input_type === "FREE_TEXT").map((t, i) => {
                      // Match anticipate draft: based_on_revision === t.revision means
                      // this draft was produced AFTER this turn and should inform the next
                      const draft = anticipateDrafts.find(d => d.based_on_revision === t.revision)
                      // Check topic overlap with next turn's user_input
                      const nextTurn = openConv.turns.filter(x => x.input_type === "FREE_TEXT")[i + 1]
                      const hasOverlap = draft && nextTurn ? (() => {
                        const anticipated = draft.anticipated_user_text.toLowerCase()
                        const actual = nextTurn.user_input.toLowerCase()
                        const tokens = anticipated.split(/\s+/).filter(w => w.length > 4)
                        return tokens.some(tok => actual.includes(tok))
                      })() : false
                      const draftKey = `draft-${t.revision}`

                      return (
                        <div key={i}>
                          {t.user_input?.trim() && (
                            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
                              <div style={{ background: "#627A52", color: "#fff", borderRadius: "12px 12px 2px 12px", padding: "10px 14px", maxWidth: "75%", fontSize: "14px", lineHeight: 1.5 }}>
                                {t.user_input}
                              </div>
                            </div>
                          )}
                          {t.assistant_output?.trim() && (
                            <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: draft ? "6px" : "0" }}>
                              <div style={{ background: "#F9F8F5", color: "#2C2A28", borderRadius: "12px 12px 12px 2px", padding: "10px 14px", maxWidth: "75%", fontSize: "14px", lineHeight: 1.5, border: "1px solid #EFEDE7" }}>
                                {t.assistant_output}
                              </div>
                            </div>
                          )}
                          {/* Anticipate chip */}
                          {draft && (
                            <div style={{ paddingLeft: "8px", marginBottom: "4px" }}>
                              <button
                                onClick={() => setExpandedAnticipate(expandedAnticipate === draftKey ? null : draftKey)}
                                style={{
                                  fontSize: "11px", padding: "2px 10px", borderRadius: "10px", border: "none", cursor: "pointer",
                                  background: hasOverlap ? "#F0FDF4" : "#F9F8F5",
                                  color: hasOverlap ? "#166534" : "#6B675F",
                                  fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: "4px",
                                }}
                              >
                                {hasOverlap ? "✓" : "○"} lookahead {expandedAnticipate === draftKey ? "▲" : "▼"}
                              </button>
                              {expandedAnticipate === draftKey && (
                                <div style={{ marginTop: "6px", background: "#fff", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "12px 14px", fontSize: "13px", maxWidth: "80%" }}>
                                  <div style={{ marginBottom: "8px" }}>
                                    <div style={{ fontSize: "11px", color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "3px" }}>Forventet næste besked</div>
                                    <div style={{ color: "#374151", lineHeight: 1.5, fontStyle: "italic" }}>"{draft.anticipated_user_text}"</div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: "11px", color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "3px" }}>Retorisk instruktion til GEN_HYPNO</div>
                                    <div style={{ color: "#1D4ED8", lineHeight: 1.5 }}>{draft.rhetorical_instruction}</div>
                                  </div>
                                  {nextTurn && (
                                    <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #F3F4F6", fontSize: "11px", color: hasOverlap ? "#166534" : "#6B675F" }}>
                                      {hasOverlap ? "✓ Bruger fulgte den forventede retning — instruktion sandsynligvis injiceret" : "○ Bruger gik anden retning — instruktion ignoreret (topic-overlap miss)"}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
            {/* Memory tab */}
            {tab === "memory" && !openConvId && (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <div style={{ fontSize: "14px", color: "#6B675F" }}>
                    Brugernes hukommelse, topics og tråd-genbrug via scan_threads
                  </div>
                  <button
                    onClick={fetchMemory}
                    disabled={memoryLoading}
                    style={{ padding: "7px 16px", background: "#627A52", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", cursor: memoryLoading ? "not-allowed" : "pointer", opacity: memoryLoading ? 0.7 : 1, fontFamily: "inherit" }}
                  >
                    {memoryLoading ? "Henter…" : "↻ Opdater"}
                  </button>
                </div>

                {memoryError && (
                  <div style={{ background: "#FEF2F2", color: "#991B1B", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", fontSize: "14px" }}>
                    {memoryError}
                  </div>
                )}

                {memoryLoading && !memoryData && (
                  <div style={{ textAlign: "center", color: "#6B675F", fontSize: "14px", padding: "40px 0" }}>Henter hukommelse…</div>
                )}

                {memoryData && (memoryData.users as any[]).length === 0 && (
                  <div style={{ textAlign: "center", color: "#6B675F", fontSize: "14px", padding: "40px 0" }}>Ingen brugere fundet</div>
                )}

                {memoryData && (memoryData.users as any[]).map((user: any) => {
                  const shortKey = user.user_key.slice(0, 8) + "…"
                  const isExpanded = expandedUser === user.user_key
                  const threads: any[] = user.threads ?? []
                  const topics: string[] = user.profile?.topics ?? []
                  const topicScores: Record<string, number> = user.profile?.topic_scores ?? {}
                  const topTopics = Object.entries(topicScores).sort((a, b) => b[1] - a[1]).slice(0, 6)
                  const threadsWithDraft = threads.filter(t => t.latest_draft?.summary_draft)
                  const threadsWithEpisode = threads.filter(t => t.episode_summary?.summary_short)

                  return (
                    <div key={user.user_key} style={{ background: "#fff", borderRadius: "12px", marginBottom: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", overflow: "hidden" }}>
                      {/* User header */}
                      <div
                        onClick={() => setExpandedUser(isExpanded ? null : user.user_key)}
                        style={{ padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "20px", flex: 1, flexWrap: "wrap" }}>
                          <div>
                            <div style={{ fontSize: "13px", fontFamily: "monospace", color: "#2C2A28", fontWeight: 500 }}>{shortKey}</div>
                            <div style={{ fontSize: "12px", color: "#6B675F", marginTop: "2px" }}>
                              {user.profile?.last_seen_at ? `Sidst set ${formatDate(user.profile.last_seen_at)}` : "Ingen profil"}
                            </div>
                          </div>
                          {/* Topic pills */}
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            {topTopics.map(([topic, score]) => (
                              <span key={topic} style={{
                                fontSize: "12px", padding: "2px 8px", borderRadius: "12px",
                                background: score > 0.8 ? "#F0FDF4" : score > 0.4 ? "#FEF9C3" : "#F9F8F5",
                                color: score > 0.8 ? "#166534" : score > 0.4 ? "#713F12" : "#6B675F",
                                border: `1px solid ${score > 0.8 ? "#BBF7D0" : score > 0.4 ? "#FDE68A" : "#E5E2DB"}`,
                              }}>
                                {topic} <span style={{ opacity: 0.6 }}>{score.toFixed(2)}</span>
                              </span>
                            ))}
                          </div>
                          <div style={{ fontSize: "12px", color: "#6B675F", display: "flex", gap: "12px" }}>
                            <span>{threads.length} tråde</span>
                            <span style={{ color: threadsWithDraft.length > 0 ? "#627A52" : "#6B675F" }}>{threadsWithDraft.length} drafts</span>
                            <span style={{ color: threadsWithEpisode.length > 0 ? "#627A52" : "#6B675F" }}>{threadsWithEpisode.length} episode-summaries</span>
                          </div>
                        </div>
                        <div style={{ fontSize: "16px", color: "#6B675F" }}>{isExpanded ? "▲" : "▼"}</div>
                      </div>

                      {/* Expanded: threads */}
                      {isExpanded && (
                        <div style={{ borderTop: "1px solid #F0EDE7", padding: "4px 0" }}>
                          {threads.length === 0 && (
                            <div style={{ padding: "16px 20px", fontSize: "14px", color: "#6B675F" }}>Ingen tråde</div>
                          )}
                          {threads.map((th: any) => {
                            const threadKey = `${user.user_key}:${th.conversation_id}`
                            const isThreadExpanded = expandedThread === threadKey
                            const hasDraft = !!th.latest_draft?.summary_draft
                            const hasEpisode = !!th.episode_summary?.summary_short

                            return (
                              <div key={th.conversation_id} style={{ borderBottom: "1px solid #F9F8F5" }}>
                                <div
                                  onClick={() => setExpandedThread(isThreadExpanded ? null : threadKey)}
                                  style={{ padding: "12px 20px 12px 32px", cursor: "pointer", display: "flex", alignItems: "center", gap: "12px" }}
                                >
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: "14px", fontWeight: 500, color: "#2C2A28" }}>{th.title}</div>
                                    {th.preview && (
                                      <div style={{ fontSize: "13px", color: "#6B675F", marginTop: "2px", maxWidth: "500px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {th.preview}
                                      </div>
                                    )}
                                  </div>
                                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                    {hasDraft && (
                                      <span style={{ fontSize: "11px", padding: "1px 6px", borderRadius: "8px", background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #BFDBFE" }}>draft</span>
                                    )}
                                    {hasEpisode && (
                                      <span style={{ fontSize: "11px", padding: "1px 6px", borderRadius: "8px", background: "#F0FDF4", color: "#166534", border: "1px solid #BBF7D0" }}>episode</span>
                                    )}
                                    <span style={{ fontSize: "12px", color: "#9CA3AF" }}>{isThreadExpanded ? "▲" : "▼"}</span>
                                  </div>
                                </div>

                                {isThreadExpanded && (
                                  <div style={{ padding: "0 20px 16px 32px", display: "flex", flexDirection: "column", gap: "12px" }}>
                                    {/* Episode summary */}
                                    {th.episode_summary && (
                                      <div style={{ background: "#F9F8F5", borderRadius: "8px", padding: "12px 14px" }}>
                                        <div style={{ fontSize: "12px", fontWeight: 600, color: "#6B675F", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Episode</div>
                                        {th.episode_summary.summary_short
                                          ? <div style={{ fontSize: "13px", color: "#2C2A28", lineHeight: 1.5 }}>{th.episode_summary.summary_short}</div>
                                          : <div style={{ fontSize: "13px", color: "#9CA3AF", fontStyle: "italic" }}>Ingen summary endnu (SUMMARIZE_EPISODE ikke kørt)</div>
                                        }
                                        {th.episode_summary.open_loops?.length > 0 && (
                                          <div style={{ marginTop: "8px" }}>
                                            <div style={{ fontSize: "12px", color: "#6B675F", marginBottom: "4px" }}>Open loops:</div>
                                            {th.episode_summary.open_loops.map((loop: string, i: number) => (
                                              <div key={i} style={{ fontSize: "13px", color: "#6B675F", paddingLeft: "12px" }}>• {loop}</div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Scan_threads draft */}
                                    {th.latest_draft && (
                                      <div style={{ background: "#EFF6FF", borderRadius: "8px", padding: "12px 14px", border: "1px solid #BFDBFE" }}>
                                        <div style={{ fontSize: "12px", fontWeight: 600, color: "#1D4ED8", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>Scan_threads draft</div>
                                        <div style={{ fontSize: "13px", color: "#1E3A5F", lineHeight: 1.6 }}>{th.latest_draft.summary_draft}</div>
                                        {th.latest_draft.open_questions?.length > 0 && (
                                          <div style={{ marginTop: "8px" }}>
                                            <div style={{ fontSize: "12px", color: "#3B82F6", marginBottom: "4px" }}>Åbne spørgsmål:</div>
                                            {th.latest_draft.open_questions.map((q: string, i: number) => (
                                              <div key={i} style={{ fontSize: "13px", color: "#1D4ED8", paddingLeft: "12px", marginBottom: "2px" }}>• {q}</div>
                                            ))}
                                          </div>
                                        )}
                                        <div style={{ fontSize: "11px", color: "#60A5FA", marginTop: "8px" }}>
                                          {th.latest_draft.created_at ? `Skabt ${formatDate(new Date(th.latest_draft.created_at).toISOString())}` : ""}
                                        </div>
                                      </div>
                                    )}

                                    {!th.episode_summary && !th.latest_draft && (
                                      <div style={{ fontSize: "13px", color: "#9CA3AF", fontStyle: "italic", paddingLeft: "4px" }}>Ingen memory-data for denne tråd endnu</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}

                {memoryData && (
                  <div style={{ fontSize: "12px", color: "#9CA3AF", textAlign: "right", marginTop: "8px" }}>
                    Opdateret {formatDate(memoryData.fetched_at)}
                  </div>
                )}
              </div>
            )}

          </>
        )}

        {!data && !loading && (
          <div style={{ textAlign: "center", color: "#6B675F", fontSize: "14px", padding: "60px 0" }}>
            Vælg en periode og tryk "Hent data"
          </div>
        )}
      </div>
    </div>
  )
}
