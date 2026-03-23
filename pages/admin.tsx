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

type ExportData = {
  from: string
  to: string
  total_conversations: number
  total_turns: number
  conversations: Conversation[]
  handoffs?: Handoff[]
  leads?: Lead[]
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

  const [from, setFrom] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().slice(0, 10)
  })
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10))

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ExportData | null>(null)

  const [tab, setTab] = useState<"conversations" | "handoffs" | "leads">("handoffs")
  const [openConvId, setOpenConvId] = useState<string | null>(null)

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
              ].map(s => (
                <div key={s.label} style={{ background: "#fff", borderRadius: "12px", padding: "16px 20px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                  <div style={{ fontSize: "28px", fontWeight: 500, color: "#2C2A28" }}>{s.value}</div>
                  <div style={{ fontSize: "13px", color: "#6B675F", marginTop: "2px" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: "4px", marginBottom: "16px" }}>
              {([
                { id: "handoffs", label: `Henvendelser (${handoffs.length})` },
                { id: "leads", label: `Leads (${leads.length})` },
                { id: "conversations", label: `Alle samtaler (${conversations.length})` },
              ] as const).map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTab(t.id); setOpenConvId(null) }}
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
            {tab === "handoffs" && (
              <div style={{ background: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                {handoffs.length === 0 ? (
                  <div style={{ padding: "40px", textAlign: "center", color: "#6B675F", fontSize: "14px" }}>Ingen henvendelser i perioden</div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                    <thead>
                      <tr style={{ background: "#F9F8F5", borderBottom: "1px solid #D8D5CC" }}>
                        {["Modtaget", "Navn", "Emne", "Kontakt", "Besked", "Email"].map(h => (
                          <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "12px", color: "#6B675F", fontWeight: 500 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {handoffs.map((h, i) => (
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
                        </tr>
                      ))}
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
                          onClick={() => setOpenConvId(c.conversation_id)}
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
                  onClick={() => setOpenConvId(null)}
                  style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "#627A52", background: "none", border: "none", cursor: "pointer", marginBottom: "16px", padding: 0, fontFamily: "inherit" }}
                >
                  ← Tilbage
                </button>
                <div style={{ background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                  <div style={{ fontSize: "12px", color: "#6B675F", marginBottom: "16px", fontFamily: "monospace" }}>
                    {openConv.conversation_id} · {openConv.turns.length} turns
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {openConv.turns.filter(t => t.input_type === "FREE_TEXT").map((t, i) => (
                      <div key={i}>
                        {t.user_input?.trim() && (
                          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
                            <div style={{ background: "#627A52", color: "#fff", borderRadius: "12px 12px 2px 12px", padding: "10px 14px", maxWidth: "75%", fontSize: "14px", lineHeight: 1.5 }}>
                              {t.user_input}
                            </div>
                          </div>
                        )}
                        {t.assistant_output?.trim() && (
                          <div style={{ display: "flex", justifyContent: "flex-start" }}>
                            <div style={{ background: "#F9F8F5", color: "#2C2A28", borderRadius: "12px 12px 12px 2px", padding: "10px 14px", maxWidth: "75%", fontSize: "14px", lineHeight: 1.5, border: "1px solid #EFEDE7" }}>
                              {t.assistant_output}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
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
