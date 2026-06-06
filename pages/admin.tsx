import { useState, useEffect, useCallback } from "react"
import Head from "next/head"

type RawTurn = {
  ts: string; conversation_id: string; revision: number
  node_id: string; input_type: string; user_input: string; assistant_output: string
}
type Conversation = { conversation_id: string; user_key?: string; turns: RawTurn[] }
type Handoff = { id: string; received_at: string; navn: string; emne: string; kontakt: string; besked?: string; email_status?: string; conversation_id: string }
type Lead = { id: string; received_at: string; email: string; tema?: string; conversation_id: string }
type FeedbackItem = { ts: string; conversation_id: string; revision?: number; rating: "positive" | "partial" | "negative"; tags?: string[]; note?: string; meta?: { node?: string; mode?: string; move?: string } }
type AnticipateDraft = { job_id: string; based_on_revision: number; anticipated_user_text: string; rhetorical_instruction: string; conversation_goal_hypothesis: string | null; created_at: number }
type StateSummary = { conversation_id: string; fit?: "good" | "explore" | "unknown"; fit_reason?: string; arousal_level?: string; arousal_score?: number; problem_title?: string; topic_tags?: string[]; genHypnoTranscript?: Array<{role: string; content: string}>; chatbotType?: "standard" | "children" }
type TtmConversation = {
  conversation_id: string
  started_at: string
  turn_count: number
  score: number | null
  last_topic: string | null
  ritual_stage: string
  transcript: Array<{ role: string; content: string }>
}
type ExportData = { from: string; to: string; total_conversations: number; total_turns: number; conversations: Conversation[]; handoffs?: Handoff[]; leads?: Lead[]; feedback?: FeedbackItem[] }
type Hit = { ts: string; path: string; city: string; postal?: string; region: string; day: string; mobile?: boolean; type?: string; sid?: string; entry?: boolean; referrer?: string; referrer_source?: string; utm_source?: string; utm_medium?: string; utm_campaign?: string; vw?: number; lang?: string; prev_path?: string; prev_dwell_ms?: number; prev_scroll_pct?: number; dwell_ms?: number; scroll_pct?: number; own?: boolean }

function ConvRow({ c, i, total, stateMap, onOpen, onDelete, deleting, selected, onToggle }: {
  c: Conversation; i: number; total: number
  stateMap: Record<string, StateSummary>
  onOpen: () => void; onDelete: () => void; deleting: boolean
  selected: boolean; onToggle: () => void
}) {
  const s = stateMap[c.conversation_id]
  return (
    <tr style={{ borderBottom:i<total-1?"1px solid #F0EDE7":"none", background:selected?"#1a2a1a":"" }}>
      <td style={{ padding:"12px 16px" }} onClick={e=>e.stopPropagation()}>
        <input type="checkbox" checked={selected} onChange={onToggle} style={{ cursor:"pointer", accentColor:"#627A52" }} />
      </td>
      <td style={{ padding:"12px 16px", color:"#888888", whiteSpace:"nowrap", cursor:"pointer" }} onClick={onOpen}>{formatDate(c.turns[0]?.ts??"")}</td>
      <td style={{ padding:"12px 16px", fontFamily:"monospace", fontSize:"12px", color:"#888888", cursor:"pointer" }} onClick={onOpen}>{shortId(c.conversation_id)}</td>
      <td style={{ padding:"12px 16px", cursor:"pointer" }} onClick={onOpen}>{countUserTurns(c.turns)}</td>
      <td style={{ padding:"12px 16px", maxWidth:"240px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", cursor:"pointer" }} onClick={onOpen}>
        {s?.problem_title ? <span style={{ color:"#cccccc", fontWeight:500 }}>{s.problem_title}</span> : <span style={{ color:"#555555" }}>{getFirstUserMessage(c.turns)}</span>}
      </td>
      <td style={{ padding:"12px 16px", cursor:"pointer" }} onClick={onOpen}><FitBadge fit={s?.fit} /></td>
      <td style={{ padding:"12px 16px", cursor:"pointer" }} onClick={onOpen}><ArousalBadge level={s?.arousal_level} /></td>
      <td style={{ padding:"12px 16px", cursor:"pointer" }} onClick={onOpen}><span style={{ fontSize:"12px", padding:"2px 8px", borderRadius:"12px", background:getLastNode(c.turns)==="HANDOFF_CONFIRM"?"#0f2b15":"#1f1f1f", color:getLastNode(c.turns)==="HANDOFF_CONFIRM"?"#5aad72":"#888888" }}>{getLastNode(c.turns)}</span></td>
      <td style={{ padding:"12px 16px" }}>
        <button onClick={e=>{e.stopPropagation();onDelete()}} disabled={deleting} style={{ fontSize:"12px", color:"#c0392b", background:"none", border:"none", cursor:"pointer", padding:"2px 6px", opacity:deleting?0.4:1, fontFamily:"inherit" }}>{deleting?"…":"Slet"}</button>
      </td>
    </tr>
  )
}

function formatDate(iso: string): string {
  try { return new Date(iso).toLocaleString("da-DK", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) }
  catch { return iso }
}
function shortId(id: string) { return id.slice(-8) }
function countUserTurns(turns: RawTurn[]) { return turns.filter(t => t.input_type === "FREE_TEXT" && t.user_input?.trim()).length }
function getFirstUserMessage(turns: RawTurn[]) { return turns.find(t => t.input_type === "FREE_TEXT" && t.user_input?.trim())?.user_input?.slice(0, 80) ?? "—" }
function getLastNode(turns: RawTurn[]) { return turns[turns.length - 1]?.node_id ?? "—" }
function toCSV(conversations: Conversation[]) {
  const rows = ["conversation_id,started_at,turn,node,user,assistant"]
  for (const conv of conversations) for (let i = 0; i < conv.turns.length; i++) {
    const t = conv.turns[i]; const esc = (s: string) => { const c = (s ?? "").replace(/\r?\n/g, " "); return c.includes(",") || c.includes('"') ? `"${c.replace(/"/g, '""')}"` : c }
    rows.push([esc(conv.conversation_id), esc(t.ts), String(i+1), esc(t.node_id), esc(t.user_input), esc(t.assistant_output)].join(","))
  }
  return rows.join("\n")
}
function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url)
}

function FitBadge({ fit }: { fit?: string }) {
  if (!fit || fit === "unknown") return <span style={{ fontSize: "12px", color: "#555555" }}>—</span>
  const map: Record<string, { bg: string; color: string; label: string }> = {
    good:    { bg: "#0f2b15", color: "#5aad72", label: "✓ Klar" },
    explore: { bg: "#2a2010", color: "#d4a264", label: "~ Afklaring" },
  }
  const s = map[fit] ?? { bg: "#1f1f1f", color: "#888888", label: fit }
  return <span style={{ fontSize: "12px", padding: "2px 8px", borderRadius: "12px", background: s.bg, color: s.color }}>{s.label}</span>
}

function ArousalBadge({ level, score }: { level?: string; score?: number }) {
  if (!level) return null
  const map: Record<string, { bg: string; color: string }> = {
    high:   { bg: "#2b0f0f", color: "#e06060" },
    medium: { bg: "#2a2010", color: "#d4a264" },
    low:    { bg: "#0f2b15", color: "#5aad72" },
  }
  const s = map[level] ?? { bg: "#1f1f1f", color: "#888888" }
  return <span style={{ fontSize: "11px", padding: "1px 7px", borderRadius: "10px", background: s.bg, color: s.color }}>{level}{typeof score === "number" ? ` ${score.toFixed(2)}` : ""}</span>
}

export default function AdminPage() {
  const [secret, setSecret] = useState("")
  const [secretInput, setSecretInput] = useState("")
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState(false)
  const [autoLoaded, setAutoLoaded] = useState(false)
  const [from, setFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate()-7); return d.toISOString().slice(0,10) })
  const [to, setTo] = useState(() => new Date().toISOString().slice(0,10))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string|null>(null)
  const [data, setData] = useState<ExportData|null>(null)
  const [stateMap, setStateMap] = useState<Record<string,StateSummary>>({})
  const [statesLoading, setStatesLoading] = useState(false)
  const [tab, setTab] = useState<"conversations"|"handoffs"|"leads"|"feedback"|"traffic"|"memory"|"ttm">("handoffs")
  const [openConvId, setOpenConvId] = useState<string|null>(null)
  const [returnToTab, setReturnToTab] = useState<"conversations"|"handoffs"|"leads"|"feedback"|"traffic"|"memory"|"ttm">("conversations")
  const [anticipateDrafts, setAnticipateDrafts] = useState<AnticipateDraft[]>([])
  const [anticipateLoading, setAnticipateLoading] = useState(false)
  const [expandedAnticipate, setExpandedAnticipate] = useState<string|null>(null)
  const [memoryData, setMemoryData] = useState<any>(null)
  const [memoryLoading, setMemoryLoading] = useState(false)
  const [memoryError, setMemoryError] = useState<string|null>(null)
  const [expandedUser, setExpandedUser] = useState<string|null>(null)
  const [ttmData, setTtmData] = useState<TtmConversation[]|null>(null)
  const [ttmLoading, setTtmLoading] = useState(false)
  const [ttmError, setTtmError] = useState<string|null>(null)
  const [openTtmId, setOpenTtmId] = useState<string|null>(null)
  const [expandedThread, setExpandedThread] = useState<string|null>(null)
  const [hits, setHits] = useState<Hit[]>([])
  const [hitsLoading, setHitsLoading] = useState(false)
  const [hitsError, setHitsError] = useState<string|null>(null)
  const [hitsDays, setHitsDays] = useState(30)
  const [hideOwn, setHideOwn] = useState(true)
  const [kwData, setKwData] = useState<Array<{ day: string; keywords: Record<string, number> }>>([])
  const [kwLoading, setKwLoading] = useState(false)
  const [showTestUsers, setShowTestUsers] = useState(false)
  const [chatbotTypeFilter, setChatbotTypeFilter] = useState<"all" | "standard" | "children">("all")
  const [groupByUser, setGroupByUser] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const fetchMemory = useCallback(async () => {
    if (!secret) return; setMemoryLoading(true); setMemoryError(null)
    try {
      const res = await fetch(`/api/admin/memory?secret=${encodeURIComponent(secret)}`)
      if (!res.ok) { const j = await res.json().catch(()=>({})); setMemoryError(j.error ?? `HTTP ${res.status}`); return }
      setMemoryData(await res.json())
    } catch (e:any) { setMemoryError(e.message ?? "Ukendt fejl") } finally { setMemoryLoading(false) }
  }, [secret])

  const fetchHits = useCallback(async (days = hitsDays) => {
    if (!secret) return; setHitsLoading(true); setHitsError(null)
    try {
      const res = await fetch(`/api/admin/hits?secret=${encodeURIComponent(secret)}&days=${days}`)
      if (!res.ok) { const j = await res.json().catch(()=>({})); setHitsError(j.error ?? `HTTP ${res.status}`); return }
      const j = await res.json(); setHits(j.hits ?? [])
    } catch (e:any) { setHitsError(e.message ?? "Ukendt fejl") } finally { setHitsLoading(false) }
  }, [secret, hitsDays])

  const fetchKeywords = useCallback(async (days = hitsDays) => {
    setKwLoading(true)
    try {
      const res = await fetch(`/api/admin/keyword-counts?secret=${encodeURIComponent(secret)}&days=${days}`)
      const j = await res.json(); setKwData(j.days ?? [])
    } catch {} finally { setKwLoading(false) }
  }, [secret, hitsDays])

  const fetchStates = useCallback(async (ids: string[]) => {
    if (!secret || ids.length === 0) return; setStatesLoading(true)
    try {
      const res = await fetch("/api/admin/states", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ secret, conversation_ids: ids }) })
      if (!res.ok) return
      const json = await res.json(); const map: Record<string,StateSummary> = {}
      for (const s of (json.states ?? []) as StateSummary[]) map[s.conversation_id] = s
      setStateMap(map)
    } catch {} finally { setStatesLoading(false) }
  }, [secret])

  const fetchAnticipate = useCallback(async (convId: string) => {
    if (!secret || !convId) return; setAnticipateLoading(true); setAnticipateDrafts([]); setExpandedAnticipate(null)
    // Poll up to 3 times with 8s delay — anticipate jobs take 15-20s to complete
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(`/api/admin/anticipate?secret=${encodeURIComponent(secret)}&conversation_id=${encodeURIComponent(convId)}`)
        if (res.ok) {
          const j = await res.json()
          const drafts = j.drafts ?? []
          if (drafts.length > 0) { setAnticipateDrafts(drafts); break }
        }
      } catch {}
      if (attempt < 2) await new Promise(r => setTimeout(r, 8000))
    }
    setAnticipateLoading(false)
  }, [secret])

  const fetchTtm = useCallback(async () => {
    if (!secret) return; setTtmLoading(true); setTtmError(null)
    try {
      const res = await fetch(`/api/admin/ttm?secret=${encodeURIComponent(secret)}&from=${from}&to=${to}`)
      if (!res.ok) { const j = await res.json().catch(()=>({})); setTtmError(j.error ?? `HTTP ${res.status}`); return }
      const j = await res.json(); setTtmData(j.conversations ?? [])
    } catch (e:any) { setTtmError(e.message ?? "Ukendt fejl") } finally { setTtmLoading(false) }
  }, [secret, from, to])

  const deleteTtm = useCallback(async (conversationId: string) => {
    if (!secret) return
    if (!window.confirm(`Slet samtale ${conversationId.slice(-12)}?`)) return
    try {
      const res = await fetch(`/api/admin/ttm?secret=${encodeURIComponent(secret)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation_id: conversationId }),
      })
      if (!res.ok) { const j = await res.json().catch(()=>({})); alert(j.error ?? `Fejl ${res.status}`); return }
      setTtmData(prev => prev ? prev.filter(c => c.conversation_id !== conversationId) : prev)
      if (openTtmId === conversationId) setOpenTtmId(null)
    } catch (e:any) { alert(e.message ?? "Ukendt fejl") }
  }, [secret, openTtmId])

  const fetchData = useCallback(async () => {
    if (!secret) return; setLoading(true); setError(null); setData(null); setOpenConvId(null); setStateMap({})
    try {
      const res = await fetch(`/api/admin/export?secret=${encodeURIComponent(secret)}&from=${from}&to=${to}&format=json&include_handoffs=1&limit=500`)
      if (res.status === 401) { setAuthed(false); setAuthError(true); return }
      if (!res.ok) { const j = await res.json().catch(()=>({})); setError(j.error ?? `HTTP ${res.status}`); return }
      const json = await res.json(); setData(json)
      setTab(json.handoffs?.length > 0 ? "handoffs" : "conversations")
      const ids = (json.conversations ?? []).map((c: Conversation) => c.conversation_id)
      if (ids.length > 0) fetchStates(ids)
    } catch (e:any) { setError(e.message ?? "Ukendt fejl") } finally { setLoading(false) }
  }, [secret, from, to, fetchStates])

  useEffect(() => { if (authed && secret && !autoLoaded) { setAutoLoaded(true); fetchData() } }, [authed, secret, autoLoaded, fetchData])

  const S = { card: { background:"#1a1a1a", borderRadius:"12px", boxShadow:"0 2px 10px rgba(0,0,0,0.05)" } }

  if (!authed) return (
    <div style={{ minHeight:"100vh", background:"#111111", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px" }}>
      <Head><title>Admin — Gaarsdal</title></Head>
      <div style={{ ...S.card, padding:"40px", width:"100%", maxWidth:"380px" }}>
        <div style={{ marginBottom:"24px" }}>
          <div style={{ fontSize:"13px", color:"#888888", marginBottom:"4px", letterSpacing:"0.05em", textTransform:"uppercase" }}>Gaarsdal</div>
          <div style={{ fontSize:"22px", fontWeight:500, color:"#cccccc" }}>Admin</div>
        </div>
        {authError && <div style={{ background:"#2b0f0f", color:"#e06060", fontSize:"14px", padding:"10px 14px", borderRadius:"8px", marginBottom:"16px" }}>Forkert adgangskode</div>}
        <input type="password" placeholder="Adgangskode" value={secretInput} onChange={e=>setSecretInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(()=>{if(secretInput.trim()){setSecret(secretInput.trim());setAuthed(true);setAuthError(false)}})()}
          style={{ width:"100%", padding:"10px 14px", border:"1px solid #D8D5CC", borderRadius:"8px", fontSize:"15px", outline:"none", boxSizing:"border-box", fontFamily:"inherit", marginBottom:"12px" }} autoFocus />
        <button onClick={()=>{if(secretInput.trim()){setSecret(secretInput.trim());setAuthed(true);setAuthError(false)}}}
          style={{ width:"100%", padding:"11px", background:"#6B8F71", color:"#1a1a1a", border:"none", borderRadius:"8px", fontSize:"15px", fontWeight:500, cursor:"pointer", fontFamily:"inherit" }}>Log ind</button>
      </div>
    </div>
  )

  const isTestConversation = (id: string) => id.includes(":test-")
  async function deleteConversation(conversationId: string) {
    if (!secret) return
    if (!confirm("Slet denne samtale permanent?")) return
    setDeletingId(conversationId)
    try {
      await fetch("/api/admin/delete-conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, conversation_id: conversationId }),
      })
      setData(prev => prev ? { ...prev, conversations: prev.conversations.filter(c => c.conversation_id !== conversationId) } : prev)
      if (openConvId === conversationId) setOpenConvId(null)
    } finally {
      setDeletingId(null)
    }
  }

  async function bulkDelete() {
    if (selectedIds.size === 0) return
    if (!confirm(`Slet ${selectedIds.size} samtale${selectedIds.size!==1?"r":""}? Dette kan ikke fortrydes.`)) return
    const ids = [...selectedIds]
    setSelectedIds(new Set())
    for (const id of ids) {
      setDeletingId(id)
      try {
        await fetch("/api/admin/delete-conversation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ secret, conversation_id: id }),
        })
        setData(prev => prev ? { ...prev, conversations: prev.conversations.filter(c => c.conversation_id !== id) } : prev)
        if (openConvId === id) setOpenConvId(null)
      } catch { /* non-fatal */ }
    }
    setDeletingId(null)
  }

  const conversations = (data?.conversations ?? [])
    .filter(c => showTestUsers || !isTestConversation(c.conversation_id))
    .filter(c => {
      if (chatbotTypeFilter === "all") return true
      const t = stateMap[c.conversation_id]?.chatbotType ?? "standard"
      return chatbotTypeFilter === "children" ? t === "children" : t !== "children"
    })
  const handoffs = ((data?.handoffs ?? []) as Handoff[]).filter(h => showTestUsers || !isTestConversation(h.conversation_id))
  const leads = ((data?.leads ?? []) as Lead[]).filter(l => showTestUsers || !isTestConversation(l.conversation_id))
  const feedbackItems = (data?.feedback ?? []) as FeedbackItem[]
  const openConv = conversations.find(c => c.conversation_id === openConvId) ?? null
  const openState = openConvId ? stateMap[openConvId] : null

  return (
    <div style={{ minHeight:"100vh", background:"#111111", fontFamily:"inherit" }}>
      <Head><title>Admin — Gaarsdal</title></Head>

      <div style={{ background:"#1a1a1a", borderBottom:"1px solid #D8D5CC", padding:"0 24px" }}>
        <div style={{ maxWidth:"1100px", margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:"56px" }}>
          <span style={{ fontSize:"15px", fontWeight:500, color:"#cccccc" }}>Gaarsdal Admin</span>
          <button onClick={()=>{setAuthed(false);setSecret("");setSecretInput("");setData(null);setStateMap({})}}
            style={{ fontSize:"13px", color:"#888888", background:"none", border:"none", cursor:"pointer", padding:"4px 8px" }}>Log ud</button>
        </div>
      </div>

      <div style={{ maxWidth:"1100px", margin:"0 auto", padding:"24px" }}>
        {/* Filter bar */}
        <div style={{ ...S.card, padding:"16px 20px", marginBottom:"20px", display:"flex", alignItems:"flex-end", gap:"16px", flexWrap:"wrap" }}>
          {[["Fra", from, setFrom], ["Til", to, setTo]].map(([label, val, setter]:any) => (
            <div key={label}>
              <label style={{ display:"block", fontSize:"12px", color:"#888888", marginBottom:"4px" }}>{label}</label>
              <input type="date" value={val} onChange={e=>setter(e.target.value)} style={{ padding:"8px 12px", border:"1px solid #D8D5CC", borderRadius:"8px", fontSize:"14px", fontFamily:"inherit", outline:"none" }} />
            </div>
          ))}
          <button onClick={fetchData} disabled={loading} style={{ padding:"9px 20px", background:"#6B8F71", color:"#1a1a1a", border:"none", borderRadius:"8px", fontSize:"14px", fontWeight:500, cursor:loading?"not-allowed":"pointer", opacity:loading?0.7:1, fontFamily:"inherit" }}>
            {loading ? "Henter…" : "Hent data"}
          </button>
          {data && <>
            <button onClick={()=>downloadBlob(toCSV(conversations),`samtaler-${from}-${to}.csv`,"text/csv")} style={{ padding:"9px 16px", background:"transparent", color:"#6B8F71", border:"1.5px solid #627A52", borderRadius:"8px", fontSize:"14px", cursor:"pointer", fontFamily:"inherit" }}>Download CSV</button>
            <button onClick={()=>downloadBlob(JSON.stringify(data,null,2),`gaarsdal-export-${from}-${to}.json`,"application/json")} style={{ padding:"9px 16px", background:"transparent", color:"#888888", border:"1.5px solid #D8D5CC", borderRadius:"8px", fontSize:"14px", cursor:"pointer", fontFamily:"inherit" }}>Download JSON</button>
            <button onClick={()=>setShowTestUsers(v=>!v)} style={{ padding:"9px 16px", background:"transparent", color:showTestUsers?"#d4a264":"#888888", border:`1.5px solid ${showTestUsers?"#d4a264":"#D8D5CC"}`, borderRadius:"8px", fontSize:"14px", cursor:"pointer", fontFamily:"inherit" }}>{showTestUsers ? "⚗ Vis testbrugere" : "⚗ Skjul testbrugere"}</button>
            <div style={{ display:"flex", gap:"6px" }}>
              {(["all","standard","children"] as const).map(f => (
                <button key={f} onClick={() => setChatbotTypeFilter(f)} style={{ padding:"9px 14px", background:chatbotTypeFilter===f?"#5a7a8f":"transparent", color:chatbotTypeFilter===f?"#fff":"#888888", border:`1.5px solid ${chatbotTypeFilter===f?"#5a7a8f":"#D8D5CC"}`, borderRadius:"8px", fontSize:"13px", cursor:"pointer", fontFamily:"inherit" }}>
                  {f === "all" ? "Alle" : f === "standard" ? "Voksne" : "Børn & Unge"}
                </button>
              ))}
            </div>
            <button onClick={()=>setGroupByUser(v=>!v)} style={{ padding:"9px 16px", background:"transparent", color:groupByUser?"#6B8F71":"#888888", border:`1.5px solid ${groupByUser?"#627A52":"#D8D5CC"}`, borderRadius:"8px", fontSize:"14px", cursor:"pointer", fontFamily:"inherit" }}>{groupByUser ? "👤 Grupperet pr. bruger" : "👤 Gruppér pr. bruger"}</button>
            {statesLoading && <span style={{ fontSize:"13px", color:"#555555" }}>Henter fit-data…</span>}
          </>}
        </div>

        {error && <div style={{ background:"#2b0f0f", color:"#e06060", padding:"12px 16px", borderRadius:"8px", marginBottom:"16px", fontSize:"14px" }}>{error}</div>}

        {data && <>
          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(150px, 1fr))", gap:"12px", marginBottom:"20px" }}>
            {[
              { label:"Samtaler", value: data.total_conversations },
              { label:"Turns i alt", value: data.total_turns },
              { label:"Henvendelser", value: handoffs.length },
              { label:"Leads", value: leads.length },
              { label:"Klar til booking", value: Object.values(stateMap).filter(s=>s.fit==="good").length },
              { label:"Feedback", value: feedbackItems.length },
            ].map(s => (
              <div key={s.label} style={{ ...S.card, padding:"16px 20px" }}>
                <div style={{ fontSize:"28px", fontWeight:500, color:"#cccccc" }}>{s.value}</div>
                <div style={{ fontSize:"13px", color:"#888888", marginTop:"2px" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display:"flex", gap:"4px", marginBottom:"16px", flexWrap:"wrap" }}>
            {([
              { id:"handoffs", label:`Henvendelser (${handoffs.length})` },
              { id:"leads", label:`Leads (${leads.length})` },
              { id:"feedback", label:`Feedback (${feedbackItems.length})` },
              { id:"conversations", label:`Alle samtaler (${conversations.length})` },
              { id:"traffic", label:"Trafik" },
              { id:"memory", label:"Hukommelse" },
              { id:"ttm", label:`TTM (${ttmData?.length ?? "?"})` },
            ] as const).map(t => (
              <button key={t.id} onClick={()=>{ setTab(t.id); setOpenConvId(null); if(t.id==="memory"&&!memoryData&&!memoryLoading) fetchMemory(); if(t.id==="traffic"&&hits.length===0&&!hitsLoading) { fetchHits(); fetchKeywords() }; if(t.id==="ttm"&&!ttmData&&!ttmLoading) fetchTtm() }}
                style={{ padding:"8px 16px", borderRadius:"8px", fontSize:"14px", border:"none", cursor:"pointer", background:tab===t.id?"#6B8F71":"#1a1a1a", color:tab===t.id?"#1a1a1a":"#888888", fontWeight:tab===t.id?500:400, fontFamily:"inherit", boxShadow:"0 2px 10px rgba(0,0,0,0.05)" }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Handoffs */}
          {tab==="handoffs" && !openConvId && (
            <div style={{ ...S.card, overflow:"hidden" }}>
              {handoffs.length===0 ? <div style={{ padding:"40px", textAlign:"center", color:"#888888", fontSize:"14px" }}>Ingen henvendelser i perioden</div> : (
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"14px" }}>
                  <thead><tr style={{ background:"#1f1f1f", borderBottom:"1px solid #D8D5CC" }}>
                    {["Modtaget","Navn","Emne","Kontakt","Besked","Email",""].map(h=><th key={h} style={{ padding:"10px 16px", textAlign:"left", fontSize:"12px", color:"#888888", fontWeight:500 }}>{h}</th>)}
                  </tr></thead>
                  <tbody>{handoffs.map((h,i)=>{
                    const linked = conversations.find(c=>c.conversation_id===h.conversation_id)
                    return <tr key={h.id} style={{ borderBottom:i<handoffs.length-1?"1px solid #F0EDE7":"none" }}>
                      <td style={{ padding:"12px 16px", color:"#888888", whiteSpace:"nowrap" }}>{formatDate(h.received_at)}</td>
                      <td style={{ padding:"12px 16px", fontWeight:500 }}>{h.navn||"—"}</td>
                      <td style={{ padding:"12px 16px" }}>{h.emne||"—"}</td>
                      <td style={{ padding:"12px 16px" }}>{h.kontakt||"—"}</td>
                      <td style={{ padding:"12px 16px", color:"#888888", maxWidth:"200px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{h.besked||"—"}</td>
                      <td style={{ padding:"12px 16px" }}><span style={{ fontSize:"12px", padding:"2px 8px", borderRadius:"12px", background:h.email_status==="sent"?"#0f2b15":h.email_status?.startsWith("error")?"#2b0f0f":"#1f1f1f", color:h.email_status==="sent"?"#5aad72":h.email_status?.startsWith("error")?"#e06060":"#888888" }}>{h.email_status??"ukendt"}</span></td>
                      <td style={{ padding:"12px 16px" }}>{linked&&<button onClick={()=>{setReturnToTab("handoffs");setTab("conversations");setOpenConvId(h.conversation_id);fetchAnticipate(h.conversation_id)}} style={{ fontSize:"12px", color:"#6B8F71", background:"none", border:"none", cursor:"pointer", padding:0, fontFamily:"inherit", textDecoration:"underline" }}>Se samtale</button>}</td>
                    </tr>
                  })}</tbody>
                </table>
              )}
            </div>
          )}

          {/* Leads */}
          {tab==="leads" && (
            <div style={{ ...S.card, overflow:"hidden" }}>
              {leads.length===0 ? <div style={{ padding:"40px", textAlign:"center", color:"#888888", fontSize:"14px" }}>Ingen leads i perioden</div> : (
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"14px" }}>
                  <thead><tr style={{ background:"#1f1f1f", borderBottom:"1px solid #D8D5CC" }}>
                    {["Modtaget","Email","Tema"].map(h=><th key={h} style={{ padding:"10px 16px", textAlign:"left", fontSize:"12px", color:"#888888", fontWeight:500 }}>{h}</th>)}
                  </tr></thead>
                  <tbody>{leads.map((l,i)=><tr key={l.id} style={{ borderBottom:i<leads.length-1?"1px solid #F0EDE7":"none" }}>
                    <td style={{ padding:"12px 16px", color:"#888888", whiteSpace:"nowrap" }}>{formatDate(l.received_at)}</td>
                    <td style={{ padding:"12px 16px", fontWeight:500 }}>{l.email||"—"}</td>
                    <td style={{ padding:"12px 16px", color:"#888888" }}>{l.tema||"—"}</td>
                  </tr>)}</tbody>
                </table>
              )}
            </div>
          )}

          {/* Feedback */}
          {tab==="feedback" && (
            <div style={{ ...S.card, overflow:"hidden" }}>
              {feedbackItems.length===0 ? <div style={{ padding:"40px", textAlign:"center", color:"#888888", fontSize:"14px" }}>Ingen feedback i perioden</div> : (
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"14px" }}>
                  <thead><tr style={{ background:"#1f1f1f", borderBottom:"1px solid #D8D5CC" }}>
                    {["Tidspunkt","Vurdering","Node","Tags","Note",""].map(h=><th key={h} style={{ padding:"10px 16px", textAlign:"left", fontSize:"12px", color:"#888888", fontWeight:500 }}>{h}</th>)}
                  </tr></thead>
                  <tbody>{[...feedbackItems].reverse().map((f,i)=>{
                    const linked = conversations.find(c=>c.conversation_id===f.conversation_id)
                    const rc = f.rating==="positive"?{bg:"#0f2b15",color:"#5aad72",label:"👍 God"}:f.rating==="negative"?{bg:"#2b0f0f",color:"#e06060",label:"👎 Dårlig"}:{bg:"#2a2010",color:"#d4a264",label:"↔ Delvis"}
                    return <tr key={i} style={{ borderBottom:i<feedbackItems.length-1?"1px solid #F0EDE7":"none" }}>
                      <td style={{ padding:"12px 16px", color:"#888888", whiteSpace:"nowrap" }}>{formatDate(f.ts)}</td>
                      <td style={{ padding:"12px 16px" }}><span style={{ fontSize:"12px", padding:"2px 8px", borderRadius:"12px", background:rc.bg, color:rc.color }}>{rc.label}</span></td>
                      <td style={{ padding:"12px 16px", fontSize:"12px", color:"#888888", fontFamily:"monospace" }}>{f.meta?.node??"—"}</td>
                      <td style={{ padding:"12px 16px", fontSize:"12px", color:"#888888" }}>{(f.tags??[]).length>0?f.tags!.join(", "):"—"}</td>
                      <td style={{ padding:"12px 16px", color:"#cccccc", maxWidth:"220px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.note||"—"}</td>
                      <td style={{ padding:"12px 16px" }}>{linked&&<button onClick={()=>{setReturnToTab("feedback");setTab("conversations");setOpenConvId(f.conversation_id);fetchAnticipate(f.conversation_id)}} style={{ fontSize:"12px", color:"#6B8F71", background:"none", border:"none", cursor:"pointer", padding:0, fontFamily:"inherit", textDecoration:"underline" }}>Se samtale</button>}</td>
                    </tr>
                  })}</tbody>
                </table>
              )}
            </div>
          )}

          {/* Conversations list */}
          {tab==="conversations" && !openConvId && (
            <div style={{ ...S.card, overflow:"hidden" }}>
              {conversations.length===0 ? <div style={{ padding:"40px", textAlign:"center", color:"#888888", fontSize:"14px" }}>Ingen samtaler i perioden</div> : (<>
                {selectedIds.size > 0 && (
                  <div style={{ display:"flex", alignItems:"center", gap:"12px", padding:"10px 16px", background:"#1a2a1a", borderBottom:"1px solid #2a3a2a" }}>
                    <span style={{ fontSize:"13px", color:"#6B8F71" }}>{selectedIds.size} valgt</span>
                    <button onClick={bulkDelete} style={{ padding:"6px 14px", background:"transparent", color:"#c0392b", border:"1.5px solid #c0392b", borderRadius:"6px", fontSize:"13px", cursor:"pointer", fontFamily:"inherit" }}>Slet valgte</button>
                    <button onClick={()=>setSelectedIds(new Set())} style={{ padding:"6px 12px", background:"transparent", color:"#888888", border:"1.5px solid #444", borderRadius:"6px", fontSize:"13px", cursor:"pointer", fontFamily:"inherit" }}>Fravælg alle</button>
                  </div>
                )}
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"14px" }}>
                  <thead><tr style={{ background:"#1f1f1f", borderBottom:"1px solid #D8D5CC" }}>
                    <th style={{ padding:"10px 16px", width:"36px" }}>
                      <input type="checkbox"
                        style={{ cursor:"pointer", accentColor:"#627A52" }}
                        checked={conversations.length > 0 && conversations.every(c => selectedIds.has(c.conversation_id))}
                        onChange={e => {
                          if (e.target.checked) setSelectedIds(new Set(conversations.map(c => c.conversation_id)))
                          else setSelectedIds(new Set())
                        }}
                      />
                    </th>
                    {["Start","ID","Turns","Problem / Første besked","Fit","Arousal","Slut-node",""].map(h=><th key={h} style={{ padding:"10px 16px", textAlign:"left", fontSize:"12px", color:"#888888", fontWeight:500 }}>{h}</th>)}
                  </tr></thead>
                  <tbody>{(() => {
                    const sorted = [...conversations].reverse()
                    const makeRow = (c: Conversation, i: number, total: number) => (
                      <ConvRow key={c.conversation_id} c={c} i={i} total={total} stateMap={stateMap}
                        onOpen={()=>{setReturnToTab("conversations");setOpenConvId(c.conversation_id);fetchAnticipate(c.conversation_id)}}
                        onDelete={()=>deleteConversation(c.conversation_id)}
                        deleting={deletingId===c.conversation_id}
                        selected={selectedIds.has(c.conversation_id)}
                        onToggle={()=>setSelectedIds(prev=>{const n=new Set(prev);n.has(c.conversation_id)?n.delete(c.conversation_id):n.add(c.conversation_id);return n})}
                      />
                    )
                    if (!groupByUser) return sorted.map((c,i) => makeRow(c, i, sorted.length))
                    const groups: Map<string, typeof sorted> = new Map()
                    for (const c of sorted) {
                      const k = c.user_key ?? "ukendt"
                      if (!groups.has(k)) groups.set(k, [])
                      groups.get(k)!.push(c)
                    }
                    const rows: React.ReactNode[] = []
                    groups.forEach((convs, userKey) => {
                      const allSelected = convs.every(c => selectedIds.has(c.conversation_id))
                      rows.push(
                        <tr key={`group-${userKey}`}>
                          <td style={{ padding:"8px 16px", background:"#161616", borderBottom:"1px solid #2a2a2a" }}>
                            <input type="checkbox" checked={allSelected} style={{ cursor:"pointer", accentColor:"#627A52" }}
                              onChange={e=>{setSelectedIds(prev=>{const n=new Set(prev);convs.forEach(c=>e.target.checked?n.add(c.conversation_id):n.delete(c.conversation_id));return n})}} />
                          </td>
                          <td colSpan={8} style={{ padding:"8px 16px", background:"#161616", fontSize:"11px", color:"#555555", fontFamily:"monospace", borderBottom:"1px solid #2a2a2a" }}>👤 {userKey.slice(-12)} — {convs.length} samtale{convs.length!==1?"r":""}</td>
                        </tr>
                      )
                      convs.forEach((c,i) => rows.push(makeRow(c, i, convs.length)))
                    })
                    return rows
                  })()}</tbody>
                </table>
              </>)}
            </div>
          )}

          {/* Conversation detail */}
          {tab==="conversations" && openConv && (
            <div>
              <button onClick={()=>{setOpenConvId(null);setTab(returnToTab)}} style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"14px", color:"#6B8F71", background:"none", border:"none", cursor:"pointer", marginBottom:"16px", padding:0, fontFamily:"inherit" }}>← Tilbage</button>

              {/* State summary */}
              {openState && (
                <div style={{ ...S.card, padding:"16px 20px", marginBottom:"16px", display:"flex", gap:"24px", flexWrap:"wrap", alignItems:"flex-start" }}>
                  <div>
                    <div style={{ fontSize:"11px", color:"#555555", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"4px" }}>Fit</div>
                    <FitBadge fit={openState.fit} />
                    {openState.fit_reason && <div style={{ fontSize:"12px", color:"#888888", marginTop:"4px", maxWidth:"260px" }}>{openState.fit_reason}</div>}
                  </div>
                  {openState.arousal_level && (
                    <div>
                      <div style={{ fontSize:"11px", color:"#555555", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"4px" }}>Arousal</div>
                      <ArousalBadge level={openState.arousal_level} score={openState.arousal_score} />
                    </div>
                  )}
                  {openState.problem_title && (
                    <div>
                      <div style={{ fontSize:"11px", color:"#555555", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"4px" }}>Problem</div>
                      <div style={{ fontSize:"13px", color:"#cccccc", fontWeight:500 }}>{openState.problem_title}</div>
                    </div>
                  )}
                  {openState.topic_tags && openState.topic_tags.length > 0 && (
                    <div>
                      <div style={{ fontSize:"11px", color:"#555555", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"4px" }}>Tags</div>
                      <div style={{ display:"flex", gap:"4px", flexWrap:"wrap" }}>
                        {openState.topic_tags.map(tag=><span key={tag} style={{ fontSize:"12px", padding:"1px 8px", borderRadius:"10px", background:"#1f1f1f", color:"#888888", border:"1px solid #E5E2DB" }}>{tag}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div style={{ ...S.card, padding:"20px" }}>
                <div style={{ fontSize:"12px", color:"#888888", marginBottom:"16px", fontFamily:"monospace", display:"flex", alignItems:"center", gap:"12px" }}>
                  {(() => {
                    const transcript = openState?.genHypnoTranscript
                    const pairCount = transcript ? Math.floor(transcript.filter(t=>t.role==="user").length) + openConv.turns.filter(t=>t.user_input?.trim() && !transcript.some(tr=>tr.content.trim()===t.user_input.trim())).length : openConv.turns.filter(t=>t.user_input?.trim()).length
                    return <span>{openConv.conversation_id} · {pairCount} turns{transcript ? " (fra transcript)" : ""}</span>
                  })()}
                  {anticipateLoading && <span style={{ color:"#555555" }}>henter lookahead…</span>}
                  {!anticipateLoading && anticipateDrafts.length > 0 && <span style={{ color:"#6B8F71", fontSize:"11px" }}>✓ {anticipateDrafts.length} lookahead-drafts</span>}
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
                  {(()=>{
                    const transcript = openState?.genHypnoTranscript
                    // Sort drafts by revision for position-based matching
                    const sortedDrafts = [...anticipateDrafts].sort((a,b)=>a.based_on_revision-b.based_on_revision)

                    // Build unified turn list:
                    // 1. Start from transcript pairs (preserves GEN_HYPNO turns incl. turn 1)
                    // 2. For pairs missing assistant (node transitioned away), fill from raw:conversation
                    // 3. Append raw:conversation turns not covered by transcript
                    type DisplayPair = { user: string; assistant: string; rawRevision?: number; ts?: string }
                    const rawFree = openConv.turns.filter(t=>t.user_input?.trim())
                    const allPairs: DisplayPair[] = []

                    if (transcript && transcript.length > 0) {
                      // Build pairs from transcript
                      let i = 0
                      while (i < transcript.length) {
                        if (transcript[i].role === "user") {
                          const user = transcript[i].content
                          const nextIsAssistant = transcript[i+1]?.role === "assistant"
                          let assistant = nextIsAssistant ? transcript[i+1].content : ""
                          // If no assistant in transcript, look up from raw by matching user_input
                          if (!assistant) {
                            const rawMatch = rawFree.find(r => r.user_input?.trim() === user.trim())
                            if (rawMatch) { assistant = rawMatch.assistant_output ?? ""; }
                          }
                          const rawForTs = rawFree.find(r => r.user_input?.trim() === user.trim())
                          allPairs.push({ user, assistant, ts: rawForTs?.ts })
                          i += nextIsAssistant ? 2 : 1
                        } else { i++ }
                      }
                      // Append raw turns not covered by transcript (e.g. turns entirely on HANDOFF_FORM)
                      const transcriptUsers = new Set(allPairs.map(p=>p.user.trim()))
                      for (const raw of rawFree) {
                        if (!transcriptUsers.has(raw.user_input.trim())) {
                          allPairs.push({ user: raw.user_input, assistant: raw.assistant_output ?? "", rawRevision: raw.revision, ts: raw.ts })
                        }
                      }
                    } else {
                      // No transcript — use raw turns directly
                      for (const raw of rawFree) {
                        allPairs.push({ user: raw.user_input, assistant: raw.assistant_output ?? "", rawRevision: raw.revision, ts: raw.ts })
                      }
                    }

                    return allPairs.map((pair, idx) => {
                      const draft = sortedDrafts[idx] ?? null
                      const nextPair = allPairs[idx+1]
                      const hasOverlap = draft && nextPair ? (() => { const ant = draft.anticipated_user_text.toLowerCase(); const act = nextPair.user.toLowerCase(); return ant.split(/\s+/).filter(w=>w.length>4).some(tok=>act.includes(tok)) })() : false
                      const draftKey = `draft-t-${idx}`
                      return (
                        <div key={idx}>
                          {pair.user && <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:"8px" }}><div style={{ background:"#6B8F71", color:"#1a1a1a", borderRadius:"12px 12px 2px 12px", padding:"10px 14px", maxWidth:"75%", fontSize:"14px", lineHeight:1.5 }}>{pair.user}</div></div>}
                          {pair.assistant && <div style={{ display:"flex", justifyContent:"flex-start", marginBottom:"2px" }}><div style={{ background:"#1f1f1f", color:"#cccccc", borderRadius:"12px 12px 12px 2px", padding:"10px 14px", maxWidth:"75%", fontSize:"14px", lineHeight:1.5, border:"1px solid #2d2d2d" }}>{pair.assistant}</div></div>}
                          {pair.ts && (() => {
                            const botTs = new Date(pair.ts)
                            const botHms = botTs.toLocaleTimeString("da-DK",{hour:"2-digit",minute:"2-digit",second:"2-digit"})
                            const dTs = draft ? new Date(draft.created_at) : null
                            const dSec = dTs ? Math.round((dTs.getTime()-botTs.getTime())/1000) : null
                            const nextTs = nextPair?.ts ? new Date(nextPair.ts) : null
                            const margin = nextTs && dTs ? Math.round((nextTs.getTime()-dTs.getTime())/1000) : null
                            return <div style={{ paddingLeft:"2px", marginBottom:draft?"2px":"4px", fontSize:"10px", color:"#444", display:"flex", gap:"8px", flexWrap:"wrap" }}>
                              <span>bot {botHms}</span>
                              {dSec !== null && <span style={{color:"#555"}}>lookahead +{dSec}s → {dTs!.toLocaleTimeString("da-DK",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}</span>}
                              {margin !== null && <span style={{color:margin>0?"#6B8F71":"#c0392b"}}>{margin>0?`✓ ${margin}s klar før næste turn`:`✗ ${Math.abs(margin)}s for sent`}</span>}
                            </div>
                          })()}
                          {draft && (
                            <div style={{ paddingLeft:"8px", marginBottom:"4px" }}>
                              <button onClick={()=>setExpandedAnticipate(expandedAnticipate===draftKey?null:draftKey)}
                                style={{ fontSize:"11px", padding:"2px 10px", borderRadius:"10px", border:"none", cursor:"pointer", background:hasOverlap?"#0f2b15":"#1f1f1f", color:hasOverlap?"#5aad72":"#888888", fontFamily:"inherit", display:"inline-flex", alignItems:"center", gap:"4px" }}>
                                {hasOverlap?"✓":"○"} lookahead {expandedAnticipate===draftKey?"▲":"▼"}
                                {draft.created_at && (() => {
                                  const d = new Date(draft.created_at)
                                  const hms = d.toLocaleTimeString("da-DK", {hour:"2-digit",minute:"2-digit",second:"2-digit"})
                                  return <span style={{opacity:0.5, fontSize:"10px", marginLeft:"4px"}}>turn {draft.based_on_revision} · {hms}</span>
                                })()}
                              </button>
                              {expandedAnticipate===draftKey && (
                                <div style={{ marginTop:"6px", background:"#1a1a1a", border:"1px solid #2d2d2d", borderRadius:"10px", padding:"12px 14px", fontSize:"13px", maxWidth:"80%" }}>
                                  <div style={{ marginBottom:"8px" }}>
                                    <div style={{ fontSize:"11px", color:"#555555", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.04em", marginBottom:"3px" }}>Forventet næste besked</div>
                                    <div style={{ color:"#cccccc", lineHeight:1.5, fontStyle:"italic" }}>"{draft.anticipated_user_text}"</div>
                                  </div>
                                  {draft.conversation_goal_hypothesis && <div style={{ marginBottom:"8px" }}>
                                    <div style={{ fontSize:"11px", color:"#555555", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.04em", marginBottom:"3px" }}>Samtalemål-hypotese</div>
                                    <div style={{ color:"#B48FE8", lineHeight:1.5, fontStyle:"italic" }}>{draft.conversation_goal_hypothesis}</div>
                                  </div>}
                                  <div>
                                    <div style={{ fontSize:"11px", color:"#555555", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.04em", marginBottom:"3px" }}>Retorisk instruktion</div>
                                    <div style={{ color:"#7BA3E8", lineHeight:1.5 }}>{draft.rhetorical_instruction}</div>
                                  </div>
                                  {nextPair && <div style={{ marginTop:"8px", paddingTop:"8px", borderTop:"1px solid #2d2d2d", fontSize:"11px", color:hasOverlap?"#5aad72":"#888888" }}>
                                    {hasOverlap?"✓ Bruger fulgte forventet retning":"○ Bruger gik anden retning (topic-overlap miss)"}
                                  </div>}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Memory */}
          {tab==="traffic" && !openConvId && (() => {
            // Skjul egne besøg hvis slået til
            const visibleHits = hideOwn ? hits.filter(h => h.own !== true) : hits
            const ownCount = hits.filter(h => h.own === true && h.type !== "engagement").length
            // Adskil page-hits fra engagement-events
            const pageHits = visibleHits.filter(h => h.type !== "engagement")
            const engagementEvents = visibleHits.filter(h => h.type === "engagement")

            // Aggregate hits
            const byDay: Record<string, number> = {}
            const byPath: Record<string, number> = {}
            const byCity: Record<string, number> = {}
            const bySource: Record<string, number> = {}
            const byUTM: Record<string, number> = {}
            const byEntry: Record<string, number> = {}
            for (const h of pageHits) {
              byDay[h.day] = (byDay[h.day] ?? 0) + 1
              byPath[h.path] = (byPath[h.path] ?? 0) + 1
              const cityKey = h.postal ? `${h.city} (${h.postal})` : h.city
              byCity[cityKey] = (byCity[cityKey] ?? 0) + 1
              const src = h.referrer_source || "ukendt"
              bySource[src] = (bySource[src] ?? 0) + 1
              if (h.utm_source) {
                const u = `${h.utm_source}${h.utm_medium ? " / " + h.utm_medium : ""}${h.utm_campaign ? " / " + h.utm_campaign : ""}`
                byUTM[u] = (byUTM[u] ?? 0) + 1
              }
              if (h.entry && h.path) byEntry[h.path] = (byEntry[h.path] ?? 0) + 1
            }
            const days = Object.entries(byDay).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,30)
            const paths = Object.entries(byPath).sort((a,b)=>b[1]-a[1])
            const cities = Object.entries(byCity).sort((a,b)=>b[1]-a[1]).slice(0,10)
            const sources = Object.entries(bySource).sort((a,b)=>b[1]-a[1])
            const utms = Object.entries(byUTM).sort((a,b)=>b[1]-a[1]).slice(0,10)
            const entryPaths = Object.entries(byEntry).sort((a,b)=>b[1]-a[1]).slice(0,10)
            const maxDay = Math.max(...days.map(d=>d[1]), 1)

            // Engagement per side: gennemsnitlig tid og scroll
            const engByPath: Record<string, { dwell: number[]; scroll: number[] }> = {}
            for (const e of engagementEvents) {
              const pth = e.path || ""
              if (!pth) continue
              if (!engByPath[pth]) engByPath[pth] = { dwell: [], scroll: [] }
              if (typeof e.dwell_ms === "number") engByPath[pth].dwell.push(e.dwell_ms)
              if (typeof e.scroll_pct === "number") engByPath[pth].scroll.push(e.scroll_pct)
            }
            const engRows = Object.entries(engByPath).map(([pth, d]) => {
              const avgDwell = d.dwell.length ? Math.round(d.dwell.reduce((a,b)=>a+b,0)/d.dwell.length/1000) : 0
              const avgScroll = d.scroll.length ? Math.round(d.scroll.reduce((a,b)=>a+b,0)/d.scroll.length) : 0
              return { path: pth, avgDwell, avgScroll, n: d.dwell.length || d.scroll.length }
            }).sort((a,b)=>b.n-a.n).slice(0,12)

            // Session-rejser: grupper hits per sid, sorter kronologisk
            const bySid: Record<string, Hit[]> = {}
            for (const h of pageHits) {
              if (!h.sid) continue
              if (!bySid[h.sid]) bySid[h.sid] = []
              bySid[h.sid].push(h)
            }
            const journeys = Object.entries(bySid)
              .map(([sid, hs]) => ({ sid, hits: hs.sort((a,b)=>a.ts.localeCompare(b.ts)) }))
              .filter(j => j.hits.length > 0)
              .sort((a,b)=>b.hits[b.hits.length-1].ts.localeCompare(a.hits[a.hits.length-1].ts))
              .slice(0,25)
            return (
              <div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                    <div style={{ fontSize:"14px", color:"#888888" }}>Danske besøgende · {pageHits.length} sidevisninger · {journeys.length} sessioner</div>
                    <select
                      value={hitsDays}
                      onChange={e => { const d = Number(e.target.value); setHitsDays(d); fetchHits(d); fetchKeywords(d) }}
                      style={{ padding:"4px 8px", border:"1px solid #D8D5CC", borderRadius:"6px", fontSize:"13px", fontFamily:"inherit", color:"#cccccc", outline:"none" }}
                    >
                      <option value={7}>7 dage</option>
                      <option value={30}>30 dage</option>
                      <option value={90}>90 dage</option>
                      <option value={365}>365 dage</option>
                    </select>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                    <button onClick={()=>setHideOwn(v=>!v)} style={{ padding:"7px 14px", background:"transparent", color:hideOwn?"#d4a264":"#888888", border:`1.5px solid ${hideOwn?"#d4a264":"#D8D5CC"}`, borderRadius:"8px", fontSize:"13px", cursor:"pointer", fontFamily:"inherit" }}>{hideOwn ? `🙈 Egne skjult (${ownCount})` : "👁 Egne vist"}</button>
                    <button onClick={()=>{ fetchHits(); fetchKeywords() }} disabled={hitsLoading} style={{ padding:"7px 16px", background:"#6B8F71", color:"#1a1a1a", border:"none", borderRadius:"8px", fontSize:"13px", cursor:hitsLoading?"not-allowed":"pointer", opacity:hitsLoading?0.7:1, fontFamily:"inherit" }}>{hitsLoading?"Henter…":"↻ Opdater"}</button>
                  </div>
                </div>
                {hitsError && <div style={{ background:"#2b0f0f", color:"#e06060", padding:"12px 16px", borderRadius:"8px", marginBottom:"16px", fontSize:"14px" }}>{hitsError}</div>}
                {hitsLoading && hits.length===0 && <div style={{ textAlign:"center", color:"#888888", fontSize:"14px", padding:"40px 0" }}>Henter trafik…</div>}
                {!hitsLoading && hits.length===0 && !hitsError && <div style={{ textAlign:"center", color:"#888888", fontSize:"14px", padding:"40px 0" }}>Ingen hits endnu – data akkumuleres løbende</div>}
                {hits.length > 0 && (
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>
                    {/* Hits per day */}
                    <div style={{ ...S.card, padding:"20px", gridColumn:"1/-1" }}>
                      <div style={{ fontSize:"13px", fontWeight:500, color:"#888888", marginBottom:"12px", textTransform:"uppercase", letterSpacing:"0.05em" }}>Hits pr. dag</div>
                      <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                        {days.map(([day, count]) => (
                          <div key={day} style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                            <div style={{ fontSize:"12px", color:"#888888", width:"80px", flexShrink:0 }}>{day.slice(5)}</div>
                            <div style={{ flex:1, background:"#1f1f1f", borderRadius:"4px", height:"20px", overflow:"hidden" }}>
                              <div style={{ height:"100%", background:"#6B8F71", borderRadius:"4px", width:`${(count/maxDay)*100}%`, transition:"width 0.3s" }} />
                            </div>
                            <div style={{ fontSize:"13px", fontWeight:500, color:"#cccccc", width:"28px", textAlign:"right" }}>{count}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* By path */}
                    <div style={{ ...S.card, padding:"20px" }}>
                      <div style={{ fontSize:"13px", fontWeight:500, color:"#888888", marginBottom:"12px", textTransform:"uppercase", letterSpacing:"0.05em" }}>Side</div>
                      <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                        {paths.map(([path, count]) => (
                          <div key={path} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <span style={{ fontSize:"13px", color:"#cccccc", fontFamily:"monospace" }}>{path || "/"}</span>
                            <span style={{ fontSize:"13px", fontWeight:500, color:"#6B8F71" }}>{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* By city */}
                    <div style={{ ...S.card, padding:"20px" }}>
                      <div style={{ fontSize:"13px", fontWeight:500, color:"#888888", marginBottom:"12px", textTransform:"uppercase", letterSpacing:"0.05em" }}>By</div>
                      <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                        {cities.map(([city, count]) => (
                          <div key={city} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <span style={{ fontSize:"13px", color:"#cccccc" }}>{city}</span>
                            <span style={{ fontSize:"13px", fontWeight:500, color:"#6B8F71" }}>{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* By device */}
                    <div style={{ ...S.card, padding:"20px" }}>
                      <div style={{ fontSize:"13px", fontWeight:500, color:"#888888", marginBottom:"12px", textTransform:"uppercase", letterSpacing:"0.05em" }}>Enhed</div>
                      {(() => {
                        const mobileCount = hits.filter(h => h.mobile === true).length
                        const desktopCount = hits.filter(h => h.mobile === false).length
                        const unknownCount = hits.filter(h => h.mobile === undefined).length
                        const total = hits.length
                        const rows = [
                          { label:"📱 Mobil", count: mobileCount },
                          { label:"🖥 Desktop", count: desktopCount },
                          ...(unknownCount > 0 ? [{ label:"? Ukendt", count: unknownCount }] : []),
                        ]
                        return (
                          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                            {rows.map(r => (
                              <div key={r.label}>
                                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"4px" }}>
                                  <span style={{ fontSize:"13px", color:"#cccccc" }}>{r.label}</span>
                                  <span style={{ fontSize:"13px", fontWeight:500, color:"#6B8F71" }}>{r.count} <span style={{ color:"#888888", fontWeight:400 }}>({total > 0 ? Math.round(r.count/total*100) : 0}%)</span></span>
                                </div>
                                <div style={{ background:"#1f1f1f", borderRadius:"4px", height:"6px", overflow:"hidden" }}>
                                  <div style={{ height:"100%", background:"#6B8F71", borderRadius:"4px", width:`${total > 0 ? (r.count/total)*100 : 0}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                )}

                {/* Kilde (referrer) */}
                {hits.length > 0 && (
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", marginTop:"16px" }}>
                    <div style={{ ...S.card, padding:"20px" }}>
                      <div style={{ fontSize:"13px", fontWeight:500, color:"#888888", marginBottom:"12px", textTransform:"uppercase", letterSpacing:"0.05em" }}>Kilde (hvor kom de fra)</div>
                      <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                        {sources.map(([src, count]) => (
                          <div key={src} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <span style={{ fontSize:"13px", color:"#cccccc" }}>{src}</span>
                            <span style={{ fontSize:"13px", fontWeight:500, color:"#6B8F71" }}>{count}</span>
                          </div>
                        ))}
                        {sources.length === 0 && <span style={{ fontSize:"13px", color:"#666" }}>Ingen data endnu</span>}
                      </div>
                    </div>

                    {/* Entry-sider (hvor landede de først) */}
                    <div style={{ ...S.card, padding:"20px" }}>
                      <div style={{ fontSize:"13px", fontWeight:500, color:"#888888", marginBottom:"12px", textTransform:"uppercase", letterSpacing:"0.05em" }}>Entry-side (første side i besøg)</div>
                      <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                        {entryPaths.map(([pth, count]) => (
                          <div key={pth} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <span style={{ fontSize:"13px", color:"#cccccc", fontFamily:"monospace" }}>{pth || "/"}</span>
                            <span style={{ fontSize:"13px", fontWeight:500, color:"#6B8F71" }}>{count}</span>
                          </div>
                        ))}
                        {entryPaths.length === 0 && <span style={{ fontSize:"13px", color:"#666" }}>Ingen data endnu</span>}
                      </div>
                    </div>
                  </div>
                )}

                {/* UTM-kampagner (kun hvis der er nogen) */}
                {utms.length > 0 && (
                  <div style={{ ...S.card, padding:"20px", marginTop:"16px" }}>
                    <div style={{ fontSize:"13px", fontWeight:500, color:"#888888", marginBottom:"12px", textTransform:"uppercase", letterSpacing:"0.05em" }}>UTM-kampagner (source / medium / campaign)</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                      {utms.map(([u, count]) => (
                        <div key={u} style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <span style={{ fontSize:"13px", color:"#cccccc", fontFamily:"monospace" }}>{u}</span>
                          <span style={{ fontSize:"13px", fontWeight:500, color:"#6B8F71" }}>{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Engagement: tid og scroll pr. side */}
                {engRows.length > 0 && (
                  <div style={{ ...S.card, padding:"20px", marginTop:"16px" }}>
                    <div style={{ fontSize:"13px", fontWeight:500, color:"#888888", marginBottom:"12px", textTransform:"uppercase", letterSpacing:"0.05em" }}>Engagement pr. side (gns. tid og scroll)</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                      {engRows.map(r => (
                        <div key={r.path} style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                          <span style={{ fontSize:"13px", color:"#cccccc", fontFamily:"monospace", width:"160px", flexShrink:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.path || "/"}</span>
                          <span style={{ fontSize:"12px", color:"#6B8F71", width:"70px" }}>{r.avgDwell}s</span>
                          <div style={{ flex:1, background:"#1f1f1f", borderRadius:"3px", height:"14px", overflow:"hidden" }}>
                            <div style={{ height:"100%", background:"#5a7a8f", borderRadius:"3px", width:`${r.avgScroll}%` }} />
                          </div>
                          <span style={{ fontSize:"12px", color:"#888", width:"40px", textAlign:"right" }}>{r.avgScroll}%</span>
                          <span style={{ fontSize:"11px", color:"#666", width:"36px", textAlign:"right" }}>n={r.n}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize:"11px", color:"#666", marginTop:"10px" }}>Tid = gns. sekunder på siden · søjle = gns. scroll-dybde · n = antal målinger</div>
                  </div>
                )}

                {/* Session-rejser */}
                {journeys.length > 0 && (
                  <div style={{ ...S.card, padding:"20px", marginTop:"16px" }}>
                    <div style={{ fontSize:"13px", fontWeight:500, color:"#888888", marginBottom:"12px", textTransform:"uppercase", letterSpacing:"0.05em" }}>Besøgsrejser (seneste 25 sessioner)</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
                      {journeys.map(j => {
                        const first = j.hits[0]
                        const src = first.referrer_source || "ukendt"
                        const when = first.ts.slice(0,16).replace("T", " ")
                        const cityLabel = first.postal ? `${first.city} (${first.postal})` : first.city
                        return (
                          <div key={j.sid} style={{ borderBottom:"1px solid #1f1f1f", paddingBottom:"10px" }}>
                            <div style={{ fontSize:"11px", color:"#666", marginBottom:"4px" }}>
                              {when} · {cityLabel} · via {src} · {first.mobile ? "📱" : "🖥"} · {j.hits.length} sider
                            </div>
                            <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:"4px" }}>
                              {j.hits.map((h, i) => (
                                <span key={i} style={{ display:"flex", alignItems:"center", gap:"4px" }}>
                                  <span style={{ fontSize:"12px", color:"#cccccc", fontFamily:"monospace", background:"#1a1a1a", padding:"2px 6px", borderRadius:"4px" }}>{h.path || "/"}</span>
                                  {i < j.hits.length-1 && <span style={{ fontSize:"12px", color:"#666" }}>→</span>}
                                </span>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Emne-keywords fra samtaler */}
                {(kwData.length > 0 || kwLoading) && (
                  <div style={{ ...S.card, padding:"20px", marginTop:"16px" }}>
                    <div style={{ fontSize:"13px", fontWeight:500, color:"#888888", marginBottom:"12px", textTransform:"uppercase", letterSpacing:"0.05em" }}>Emner pr. dag (fra chatsamtaler)</div>
                    {kwLoading && kwData.length === 0 && <div style={{ color:"#888888", fontSize:"13px" }}>Henter…</div>}
                    {kwData.length > 0 && (
                      <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
                        {kwData.map(({ day, keywords }) => {
                          const sorted = Object.entries(keywords).sort((a,b)=>b[1]-a[1])
                          const max = Math.max(...sorted.map(e=>e[1]), 1)
                          return (
                            <div key={day}>
                              <div style={{ fontSize:"12px", color:"#666", marginBottom:"6px" }}>{day.slice(5)}</div>
                              <div style={{ display:"flex", flexDirection:"column", gap:"4px" }}>
                                {sorted.map(([kw, count]) => (
                                  <div key={kw} style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                                    <div style={{ fontSize:"12px", color:"#cccccc", width:"140px", flexShrink:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{kw}</div>
                                    <div style={{ flex:1, background:"#1f1f1f", borderRadius:"3px", height:"14px", overflow:"hidden" }}>
                                      <div style={{ height:"100%", background:"#5a7a8f", borderRadius:"3px", width:`${(count/max)*100}%` }} />
                                    </div>
                                    <div style={{ fontSize:"12px", color:"#888", width:"20px", textAlign:"right" }}>{count}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {!kwLoading && kwData.length === 0 && <div style={{ color:"#888888", fontSize:"13px" }}>Ingen emner endnu — data akkumuleres fra chatsamtaler</div>}
                  </div>
                )}
              </div>
            )
          })()}

          {tab==="memory" && !openConvId && (
            <div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px" }}>
                <div style={{ fontSize:"14px", color:"#888888" }}>Brugernes hukommelse, topics og tråd-genbrug</div>
                <button onClick={fetchMemory} disabled={memoryLoading} style={{ padding:"7px 16px", background:"#6B8F71", color:"#1a1a1a", border:"none", borderRadius:"8px", fontSize:"13px", cursor:memoryLoading?"not-allowed":"pointer", opacity:memoryLoading?0.7:1, fontFamily:"inherit" }}>{memoryLoading?"Henter…":"↻ Opdater"}</button>
              </div>
              {memoryError && <div style={{ background:"#2b0f0f", color:"#e06060", padding:"12px 16px", borderRadius:"8px", marginBottom:"16px", fontSize:"14px" }}>{memoryError}</div>}
              {memoryLoading && !memoryData && <div style={{ textAlign:"center", color:"#888888", fontSize:"14px", padding:"40px 0" }}>Henter hukommelse…</div>}
              {memoryData && (memoryData.users as any[]).length === 0 && <div style={{ textAlign:"center", color:"#888888", fontSize:"14px", padding:"40px 0" }}>Ingen brugere fundet</div>}
              {memoryData && (memoryData.users as any[]).map((user:any) => {
                const shortKey = user.user_key.slice(0,8)+"…"
                const isExpanded = expandedUser===user.user_key
                const threads:any[] = user.threads??[]
                const topicScores:Record<string,number> = user.profile?.topic_scores??{}
                const topTopics = Object.entries(topicScores).sort((a,b)=>b[1]-a[1]).slice(0,6)
                const threadsWithDraft = threads.filter(t=>t.latest_draft?.summary_draft)
                return (
                  <div key={user.user_key} style={{ ...S.card, marginBottom:"12px", overflow:"hidden" }}>
                    <div onClick={()=>setExpandedUser(isExpanded?null:user.user_key)} style={{ padding:"16px 20px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between", gap:"16px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"20px", flex:1, flexWrap:"wrap" }}>
                        <div>
                          <div style={{ fontSize:"13px", fontFamily:"monospace", color:"#cccccc", fontWeight:500 }}>{shortKey}</div>
                          <div style={{ fontSize:"12px", color:"#888888", marginTop:"2px" }}>{user.profile?.last_seen_at?`Sidst set ${formatDate(user.profile.last_seen_at)}`:"Ingen profil"}</div>
                        </div>
                        <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                          {topTopics.map(([topic,score])=><span key={topic} style={{ fontSize:"12px", padding:"2px 8px", borderRadius:"12px", background:score>0.8?"#0f2b15":score>0.4?"#FEF9C3":"#1f1f1f", color:score>0.8?"#5aad72":score>0.4?"#713F12":"#888888", border:`1px solid ${score>0.8?"#BBF7D0":score>0.4?"#FDE68A":"#2d2d2d"}` }}>{topic} <span style={{ opacity:0.6 }}>{score.toFixed(2)}</span></span>)}
                        </div>
                        <div style={{ fontSize:"12px", color:"#888888", display:"flex", gap:"12px" }}>
                          <span>{threads.length} tråde</span>
                          <span style={{ color:threadsWithDraft.length>0?"#6B8F71":"#888888" }}>{threadsWithDraft.length} drafts</span>
                        </div>
                      </div>
                      <div style={{ fontSize:"16px", color:"#888888" }}>{isExpanded?"▲":"▼"}</div>
                    </div>
                    {isExpanded && <div style={{ borderTop:"1px solid #F0EDE7", padding:"4px 0" }}>
                      {threads.length===0 && <div style={{ padding:"16px 20px", fontSize:"14px", color:"#888888" }}>Ingen tråde</div>}
                      {threads.map((th:any)=>{
                        const threadKey = `${user.user_key}:${th.conversation_id}`
                        const isTE = expandedThread===threadKey
                        const hasDraft = !!th.latest_draft?.summary_draft
                        return <div key={th.conversation_id} style={{ borderBottom:"1px solid #F9F8F5" }}>
                          <div onClick={()=>setExpandedThread(isTE?null:threadKey)} style={{ padding:"12px 20px 12px 32px", cursor:"pointer", display:"flex", alignItems:"center", gap:"12px" }}>
                            <div style={{ flex:1 }}>
                              <div style={{ fontSize:"14px", fontWeight:500, color:"#cccccc" }}>{th.title}</div>
                              {th.preview && <div style={{ fontSize:"13px", color:"#888888", marginTop:"2px", maxWidth:"500px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{th.preview}</div>}
                            </div>
                            <div style={{ display:"flex", gap:"6px", alignItems:"center" }}>
                              {hasDraft && <span style={{ fontSize:"11px", padding:"1px 6px", borderRadius:"8px", background:"#0f1a2b", color:"#7BA3E8", border:"1px solid #BFDBFE" }}>draft</span>}
                              <span style={{ fontSize:"12px", color:"#555555" }}>{isTE?"▲":"▼"}</span>
                            </div>
                          </div>
                          {isTE && <div style={{ padding:"0 20px 16px 32px" }}>
                            {hasDraft ? <div style={{ background:"#0f1a2b", borderRadius:"8px", padding:"12px 14px", border:"1px solid #BFDBFE" }}>
                              <div style={{ fontSize:"12px", fontWeight:600, color:"#7BA3E8", marginBottom:"6px", textTransform:"uppercase", letterSpacing:"0.04em" }}>Scan_threads draft</div>
                              <div style={{ fontSize:"13px", color:"#1E3A5F", lineHeight:1.6 }}>{th.latest_draft.summary_draft}</div>
                              {th.latest_draft.open_questions?.length>0 && <div style={{ marginTop:"8px" }}>
                                <div style={{ fontSize:"12px", color:"#3B82F6", marginBottom:"4px" }}>Åbne spørgsmål:</div>
                                {th.latest_draft.open_questions.map((q:string,i:number)=><div key={i} style={{ fontSize:"13px", color:"#7BA3E8", paddingLeft:"12px", marginBottom:"2px" }}>• {q}</div>)}
                              </div>}
                              <div style={{ fontSize:"11px", color:"#60A5FA", marginTop:"8px" }}>{th.latest_draft.created_at?`Skabt ${formatDate(new Date(th.latest_draft.created_at).toISOString())}`:""}</div>
                            </div> : <div style={{ fontSize:"13px", color:"#555555", fontStyle:"italic" }}>Ingen memory-data endnu</div>}
                          </div>}
                        </div>
                      })}
                    </div>}
                  </div>
                )
              })}
              {memoryData && <div style={{ fontSize:"12px", color:"#555555", textAlign:"right", marginTop:"8px" }}>Opdateret {formatDate(memoryData.fetched_at)}</div>}
            </div>
          )}
        </>}

        {!data && !loading && <div style={{ textAlign:"center", color:"#888888", fontSize:"14px", padding:"60px 0" }}>Vælg en periode og tryk "Hent data"</div>}

          {/* TTM — Talk To Me */}
          {tab==="ttm" && !openTtmId && (
            <div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px" }}>
                <div style={{ fontSize:"14px", color:"#888888" }}>Talk To Me samtaler</div>
                <button onClick={fetchTtm} disabled={ttmLoading} style={{ padding:"7px 16px", background:"#c4a97d", color:"#1a1610", border:"none", borderRadius:"8px", fontSize:"13px", cursor:ttmLoading?"not-allowed":"pointer", opacity:ttmLoading?0.7:1, fontFamily:"inherit" }}>{ttmLoading?"Henter…":"↻ Opdater"}</button>
              </div>
              {ttmError && <div style={{ background:"#2b0f0f", color:"#e06060", padding:"12px 16px", borderRadius:"8px", marginBottom:"16px", fontSize:"14px" }}>{ttmError}</div>}
              {ttmLoading && !ttmData && <div style={{ textAlign:"center", color:"#888888", fontSize:"14px", padding:"40px 0" }}>Henter TTM-samtaler…</div>}
              {ttmData && ttmData.length === 0 && <div style={{ textAlign:"center", color:"#888888", fontSize:"14px", padding:"40px 0" }}>Ingen TTM-samtaler i perioden</div>}
              {ttmData && ttmData.length > 0 && (
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"14px" }}>
                  <thead>
                    <tr style={{ borderBottom:"2px solid #2d2d2d" }}>
                      <th style={{ padding:"10px 16px", textAlign:"left", color:"#888888", fontWeight:400 }}>Samtale</th>
                      <th style={{ padding:"10px 16px", textAlign:"left", color:"#888888", fontWeight:400 }}>Score</th>
                      <th style={{ padding:"10px 16px", textAlign:"left", color:"#888888", fontWeight:400 }}>Emne</th>
                      <th style={{ padding:"10px 16px", textAlign:"left", color:"#888888", fontWeight:400 }}>Turns</th>
                      <th style={{ padding:"10px 16px", textAlign:"left", color:"#888888", fontWeight:400 }}>Stage</th>
                      <th style={{ padding:"10px 4px", width:"40px" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {ttmData.map(conv => (
                      <tr key={conv.conversation_id} onClick={()=>setOpenTtmId(conv.conversation_id)}
                        style={{ borderBottom:"1px solid #2d2d2d", cursor:"pointer" }}
                        onMouseEnter={e=>(e.currentTarget.style.background="#1f1f1f")}
                        onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                        <td style={{ padding:"12px 16px", fontFamily:"monospace", fontSize:"12px", color:"#cccccc" }}>{conv.conversation_id.slice(-12)}</td>
                        <td style={{ padding:"12px 16px" }}>
                          {conv.score !== null
                            ? <span style={{ padding:"2px 10px", borderRadius:"12px", fontSize:"13px",
                                background: conv.score >= 7 ? "#0f2b15" : conv.score >= 4 ? "#2a2010" : "#2b0f0f",
                                color: conv.score >= 7 ? "#5aad72" : conv.score >= 4 ? "#d4a264" : "#e06060" }}>
                                {conv.score}/10
                              </span>
                            : <span style={{ color:"#555555" }}>—</span>}
                        </td>
                        <td style={{ padding:"12px 16px", color:"#cccccc", maxWidth:"200px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{conv.last_topic ?? "—"}</td>
                        <td style={{ padding:"12px 16px", color:"#888888" }}>{conv.turn_count}</td>
                        <td style={{ padding:"12px 16px" }}>
                          <span style={{ fontSize:"12px", padding:"2px 8px", borderRadius:"10px",
                            background: conv.ritual_stage === "open" ? "#0f2b15" : "#1f1f1f",
                            color: conv.ritual_stage === "open" ? "#5aad72" : "#888888" }}>
                            {conv.ritual_stage}
                          </span>
                        </td>
                        <td style={{ padding:"12px 16px" }} onClick={e=>e.stopPropagation()}>
                          <button onClick={()=>deleteTtm(conv.conversation_id)}
                            style={{ background:"none", border:"none", cursor:"pointer", color:"#555555", fontSize:"16px", padding:"2px 6px", lineHeight:1, fontFamily:"inherit" }}
                            title="Slet samtale">✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TTM samtale-detalje */}
          {tab==="ttm" && openTtmId && (() => {
            const conv = ttmData?.find(c => c.conversation_id === openTtmId)
            if (!conv) return null
            return (
              <div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px" }}>
                <button onClick={()=>setOpenTtmId(null)} style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"14px", color:"#c4a97d", background:"none", border:"none", cursor:"pointer", padding:0, fontFamily:"inherit" }}>← Tilbage til TTM</button>
                <button onClick={()=>deleteTtm(conv.conversation_id)} style={{ fontSize:"13px", color:"#e06060", background:"none", border:"1px solid #4a1a1a", borderRadius:"8px", padding:"6px 14px", cursor:"pointer", fontFamily:"inherit" }}>Slet samtale</button>
              </div>
                <div style={{ display:"flex", gap:"16px", marginBottom:"20px", flexWrap:"wrap" }}>
                  <div style={{ ...S.card, padding:"14px 20px", minWidth:"120px" }}>
                    <div style={{ fontSize:"11px", color:"#888888", marginBottom:"4px", textTransform:"uppercase", letterSpacing:"0.05em" }}>Score</div>
                    <div style={{ fontSize:"24px", fontWeight:500, color: conv.score !== null ? (conv.score >= 7 ? "#5aad72" : conv.score >= 4 ? "#d4a264" : "#e06060") : "#888888" }}>{conv.score !== null ? `${conv.score}/10` : "—"}</div>
                  </div>
                  <div style={{ ...S.card, padding:"14px 20px", minWidth:"120px" }}>
                    <div style={{ fontSize:"11px", color:"#888888", marginBottom:"4px", textTransform:"uppercase", letterSpacing:"0.05em" }}>Turns</div>
                    <div style={{ fontSize:"24px", fontWeight:500, color:"#cccccc" }}>{conv.turn_count}</div>
                  </div>
                  <div style={{ ...S.card, padding:"14px 20px", flex:1, minWidth:"200px" }}>
                    <div style={{ fontSize:"11px", color:"#888888", marginBottom:"4px", textTransform:"uppercase", letterSpacing:"0.05em" }}>Emne</div>
                    <div style={{ fontSize:"16px", color:"#cccccc" }}>{conv.last_topic ?? "—"}</div>
                  </div>
                </div>
                <div style={{ ...S.card, padding:"20px", display:"flex", flexDirection:"column", gap:"12px" }}>
                  {conv.transcript.map((t, i) => (
                    <div key={i} style={{ display:"flex", flexDirection:"column", alignItems: t.role === "user" ? "flex-end" : "flex-start", maxWidth:"80%", alignSelf: t.role === "user" ? "flex-end" : "flex-start" }}>
                      <div style={{ fontSize:"10px", color:"#555555", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"4px" }}>{t.role === "assistant" ? "Ida" : "Bruger"}</div>
                      <div style={{ padding:"10px 14px", borderRadius:"12px", fontSize:"13px", lineHeight:1.6, whiteSpace:"pre-wrap",
                        background: t.role === "assistant" ? "#252018" : "#33291e",
                        color: t.role === "assistant" ? "#c8bc9e" : "#e8dcc8",
                        borderBottomLeftRadius: t.role === "assistant" ? 4 : 12,
                        borderBottomRightRadius: t.role === "user" ? 4 : 12 }}>
                        {t.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

      </div>
    </div>
  )
}
