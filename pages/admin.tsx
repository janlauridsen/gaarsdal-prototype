import { useState, useEffect, useCallback } from "react"
import Head from "next/head"

type RawTurn = {
  ts: string; conversation_id: string; revision: number
  node_id: string; input_type: string; user_input: string; assistant_output: string
}
type Conversation = { conversation_id: string; turns: RawTurn[] }
type Handoff = { id: string; received_at: string; navn: string; emne: string; kontakt: string; besked?: string; email_status?: string; conversation_id: string }
type Lead = { id: string; received_at: string; email: string; tema?: string; conversation_id: string }
type FeedbackItem = { ts: string; conversation_id: string; revision?: number; rating: "positive" | "partial" | "negative"; tags?: string[]; note?: string; meta?: { node?: string; mode?: string; move?: string } }
type AnticipateDraft = { job_id: string; based_on_revision: number; anticipated_user_text: string; rhetorical_instruction: string; conversation_goal_hypothesis: string | null; created_at: number }
type StateSummary = { conversation_id: string; fit?: "good" | "explore" | "unknown"; fit_reason?: string; arousal_level?: string; arousal_score?: number; problem_title?: string; topic_tags?: string[]; genHypnoTranscript?: Array<{role: string; content: string}> }
type ExportData = { from: string; to: string; total_conversations: number; total_turns: number; conversations: Conversation[]; handoffs?: Handoff[]; leads?: Lead[]; feedback?: FeedbackItem[] }
type Hit = { ts: string; path: string; city: string; postal?: string; region: string; day: string }

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
  const [tab, setTab] = useState<"conversations"|"handoffs"|"leads"|"feedback"|"traffic"|"memory">("handoffs")
  const [openConvId, setOpenConvId] = useState<string|null>(null)
  const [returnToTab, setReturnToTab] = useState<"conversations"|"handoffs"|"leads"|"feedback"|"traffic"|"memory">("conversations")
  const [anticipateDrafts, setAnticipateDrafts] = useState<AnticipateDraft[]>([])
  const [anticipateLoading, setAnticipateLoading] = useState(false)
  const [expandedAnticipate, setExpandedAnticipate] = useState<string|null>(null)
  const [memoryData, setMemoryData] = useState<any>(null)
  const [memoryLoading, setMemoryLoading] = useState(false)
  const [memoryError, setMemoryError] = useState<string|null>(null)
  const [expandedUser, setExpandedUser] = useState<string|null>(null)
  const [expandedThread, setExpandedThread] = useState<string|null>(null)
  const [hits, setHits] = useState<Hit[]>([])
  const [hitsLoading, setHitsLoading] = useState(false)
  const [hitsError, setHitsError] = useState<string|null>(null)
  const [hitsDays, setHitsDays] = useState(30)

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

  const conversations = data?.conversations ?? []
  const handoffs = (data?.handoffs ?? []) as Handoff[]
  const leads = (data?.leads ?? []) as Lead[]
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
            ] as const).map(t => (
              <button key={t.id} onClick={()=>{ setTab(t.id); setOpenConvId(null); if(t.id==="memory"&&!memoryData&&!memoryLoading) fetchMemory(); if(t.id==="traffic"&&hits.length===0&&!hitsLoading) fetchHits() }}
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
              {conversations.length===0 ? <div style={{ padding:"40px", textAlign:"center", color:"#888888", fontSize:"14px" }}>Ingen samtaler i perioden</div> : (
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"14px" }}>
                  <thead><tr style={{ background:"#1f1f1f", borderBottom:"1px solid #D8D5CC" }}>
                    {["Start","ID","Turns","Problem / Første besked","Fit","Arousal","Slut-node"].map(h=><th key={h} style={{ padding:"10px 16px", textAlign:"left", fontSize:"12px", color:"#888888", fontWeight:500 }}>{h}</th>)}
                  </tr></thead>
                  <tbody>{[...conversations].reverse().map((c,i)=>{
                    const s = stateMap[c.conversation_id]
                    return <tr key={c.conversation_id} onClick={()=>{setReturnToTab("conversations");setOpenConvId(c.conversation_id);fetchAnticipate(c.conversation_id)}}
                      style={{ borderBottom:i<conversations.length-1?"1px solid #F0EDE7":"none", cursor:"pointer" }}
                      onMouseEnter={e=>(e.currentTarget.style.background="#222222")} onMouseLeave={e=>(e.currentTarget.style.background="")}>
                      <td style={{ padding:"12px 16px", color:"#888888", whiteSpace:"nowrap" }}>{formatDate(c.turns[0]?.ts??"")}</td>
                      <td style={{ padding:"12px 16px", fontFamily:"monospace", fontSize:"12px", color:"#888888" }}>{shortId(c.conversation_id)}</td>
                      <td style={{ padding:"12px 16px" }}>{countUserTurns(c.turns)}</td>
                      <td style={{ padding:"12px 16px", maxWidth:"240px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {s?.problem_title ? <span style={{ color:"#cccccc", fontWeight:500 }}>{s.problem_title}</span> : <span style={{ color:"#555555" }}>{getFirstUserMessage(c.turns)}</span>}
                      </td>
                      <td style={{ padding:"12px 16px" }}><FitBadge fit={s?.fit} /></td>
                      <td style={{ padding:"12px 16px" }}><ArousalBadge level={s?.arousal_level} /></td>
                      <td style={{ padding:"12px 16px" }}><span style={{ fontSize:"12px", padding:"2px 8px", borderRadius:"12px", background:getLastNode(c.turns)==="HANDOFF_CONFIRM"?"#0f2b15":"#1f1f1f", color:getLastNode(c.turns)==="HANDOFF_CONFIRM"?"#5aad72":"#888888" }}>{getLastNode(c.turns)}</span></td>
                    </tr>
                  })}</tbody>
                </table>
              )}
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
                    type DisplayPair = { user: string; assistant: string; rawRevision?: number }
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
                          allPairs.push({ user, assistant })
                          i += nextIsAssistant ? 2 : 1
                        } else { i++ }
                      }
                      // Append raw turns not covered by transcript (e.g. turns entirely on HANDOFF_FORM)
                      const transcriptUsers = new Set(allPairs.map(p=>p.user.trim()))
                      for (const raw of rawFree) {
                        if (!transcriptUsers.has(raw.user_input.trim())) {
                          allPairs.push({ user: raw.user_input, assistant: raw.assistant_output ?? "", rawRevision: raw.revision })
                        }
                      }
                    } else {
                      // No transcript — use raw turns directly
                      for (const raw of rawFree) {
                        allPairs.push({ user: raw.user_input, assistant: raw.assistant_output ?? "", rawRevision: raw.revision })
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
                          {pair.assistant && <div style={{ display:"flex", justifyContent:"flex-start", marginBottom:draft?"6px":"0" }}><div style={{ background:"#1f1f1f", color:"#cccccc", borderRadius:"12px 12px 12px 2px", padding:"10px 14px", maxWidth:"75%", fontSize:"14px", lineHeight:1.5, border:"1px solid #2d2d2d" }}>{pair.assistant}</div></div>}
                          {draft && (
                            <div style={{ paddingLeft:"8px", marginBottom:"4px" }}>
                              <button onClick={()=>setExpandedAnticipate(expandedAnticipate===draftKey?null:draftKey)}
                                style={{ fontSize:"11px", padding:"2px 10px", borderRadius:"10px", border:"none", cursor:"pointer", background:hasOverlap?"#0f2b15":"#1f1f1f", color:hasOverlap?"#5aad72":"#888888", fontFamily:"inherit", display:"inline-flex", alignItems:"center", gap:"4px" }}>
                                {hasOverlap?"✓":"○"} lookahead {expandedAnticipate===draftKey?"▲":"▼"}
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
            // Aggregate hits
            const byDay: Record<string, number> = {}
            const byPath: Record<string, number> = {}
            const byCity: Record<string, number> = {}
            for (const h of hits) {
              byDay[h.day] = (byDay[h.day] ?? 0) + 1
              byPath[h.path] = (byPath[h.path] ?? 0) + 1
              const cityKey = h.postal ? `${h.city} (${h.postal})` : h.city
              byCity[cityKey] = (byCity[cityKey] ?? 0) + 1
            }
            const days = Object.entries(byDay).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,30)
            const paths = Object.entries(byPath).sort((a,b)=>b[1]-a[1])
            const cities = Object.entries(byCity).sort((a,b)=>b[1]-a[1]).slice(0,10)
            const maxDay = Math.max(...days.map(d=>d[1]), 1)
            return (
              <div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                    <div style={{ fontSize:"14px", color:"#888888" }}>Danske besøgende · {hits.length} hits</div>
                    <select
                      value={hitsDays}
                      onChange={e => { const d = Number(e.target.value); setHitsDays(d); fetchHits(d) }}
                      style={{ padding:"4px 8px", border:"1px solid #D8D5CC", borderRadius:"6px", fontSize:"13px", fontFamily:"inherit", color:"#cccccc", outline:"none" }}
                    >
                      <option value={7}>7 dage</option>
                      <option value={30}>30 dage</option>
                      <option value={90}>90 dage</option>
                      <option value={365}>365 dage</option>
                    </select>
                  </div>
                  <button onClick={()=>fetchHits()} disabled={hitsLoading} style={{ padding:"7px 16px", background:"#6B8F71", color:"#1a1a1a", border:"none", borderRadius:"8px", fontSize:"13px", cursor:hitsLoading?"not-allowed":"pointer", opacity:hitsLoading?0.7:1, fontFamily:"inherit" }}>{hitsLoading?"Henter…":"↻ Opdater"}</button>
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
      </div>
    </div>
  )
}
