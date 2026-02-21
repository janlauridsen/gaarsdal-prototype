import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

type SessionSummary = {
  conversation_id: string
  kind: "lobby" | "conversation" | "unknown"
  first_at: string | null
  last_at: string | null
  event_count: number
  last_event_type: string | null
  last_node: string | null
  status: string | null
  revision: number | null
}

type ConversationEventV1 = {
  schema_version: "v1"
  event_id: string
  event_type: string
  conversation_id: string
  user_key: string
  revision: number
  input_id: number
  node_id?: string
  timestamp_ms: number
  payload: any
}

type SessionDetail = SessionSummary & {
  state: any | null
  events: ConversationEventV1[]
}

function byNewestIso(a: string | null, b: string | null): number {
  const at = a ? new Date(a).getTime() : 0
  const bt = b ? new Date(b).getTime() : 0
  return bt - at
}

function formatIso(iso: string | null): string {
  if (!iso) return "–"
  try {
    return new Date(iso).toISOString()
  } catch {
    return iso
  }
}

function safeJson(x: unknown): string {
  try {
    return JSON.stringify(x, null, 2)
  } catch {
    return String(x)
  }
}

export default function SessionsPage() {
  const [summaries, setSummaries] = useState<SessionSummary[]>([])
  const [detail, setDetail] = useState<SessionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)

  async function loadList() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/sessions")
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? "Kunne ikke hente sessions")
      const list = Array.isArray(data) ? (data as SessionSummary[]) : []
      list.sort((a, b) => byNewestIso(a.last_at, b.last_at))
      setSummaries(list)

      if (!selectedConversationId && list.length > 0) {
        setSelectedConversationId(list[0].conversation_id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukendt fejl")
    } finally {
      setLoading(false)
    }
  }

  async function loadDetail(conversationId: string) {
    setLoadingDetail(true)
    setError(null)
    try {
      const res = await fetch(`/api/sessions?conversation_id=${encodeURIComponent(conversationId)}&tail=120`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? "Kunne ikke hente session detail")
      setDetail(data as SessionDetail)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukendt fejl")
      setDetail(null)
    } finally {
      setLoadingDetail(false)
    }
  }

  useEffect(() => {
    loadList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selectedConversationId) {
      setDetail(null)
      return
    }
    loadDetail(selectedConversationId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversationId])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return summaries
    return summaries.filter((s) => s.conversation_id.toLowerCase().includes(q))
  }, [summaries, query])

  return (
    <main className="min-h-screen bg-bg text-text px-6 py-10">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-h2 font-light">Sessions</h1>
            <p className="text-sm text-muted">
              Læser fra state + canonical events (v1) via et ZSET-index. Ingen afhængighed af logs/interactions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadList}
              className="px-3 py-2 text-sm rounded-lg bg-accent text-white disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Opdaterer..." : "Opdater"}
            </button>
            <Link href="/" className="text-sm text-accent">
              Til forsiden
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
          <aside className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 h-[75vh] overflow-hidden">
            <div className="text-sm font-medium">Sessions ({filtered.length})</div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Søg conversation_id..."
            />

            <div className="overflow-auto h-[calc(75vh-110px)] space-y-2 pr-1">
              {loading && summaries.length === 0 ? (
                <div className="text-sm text-muted">Indlæser...</div>
              ) : filtered.length === 0 ? (
                <div className="text-sm text-muted">Ingen sessions fundet.</div>
              ) : (
                filtered.map((s) => {
                  const selected = s.conversation_id === selectedConversationId
                  return (
                    <button
                      key={s.conversation_id}
                      onClick={() => setSelectedConversationId(s.conversation_id)}
                      className={`w-full text-left rounded-lg border p-3 text-sm ${
                        selected ? "border-accent bg-accent/5" : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium break-all">{s.conversation_id}</div>
                        <div className="text-[10px] px-2 py-1 rounded-full border border-gray-200 text-muted">
                          {s.kind}
                        </div>
                      </div>
                      <div className="text-xs text-muted mt-1">Sidste: {formatIso(s.last_at)}</div>
                      <div className="text-xs text-muted mt-1">
                        node: {s.last_node ?? "–"} · rev: {s.revision ?? "–"}
                      </div>
                      <div className="text-xs text-muted mt-1">
                        {s.event_count} events · last: {s.last_event_type ?? "–"}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </aside>

          <section className="bg-white border border-gray-200 rounded-xl p-4 h-[75vh] overflow-auto">
            {!selectedConversationId ? (
              <div className="text-sm text-muted">Vælg en session fra venstre side.</div>
            ) : loadingDetail ? (
              <div className="text-sm text-muted">Indlæser detaljer...</div>
            ) : !detail ? (
              <div className="text-sm text-muted">Ingen detaljer.</div>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted">Conversation ID</div>
                  <div className="font-mono text-sm break-all">{detail.conversation_id}</div>
                  <div className="text-xs text-muted mt-1">
                    first: {formatIso(detail.first_at)} · last: {formatIso(detail.last_at)} · events: {detail.event_count}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h2 className="text-base font-medium mb-3">State snapshot</h2>
                    <div className="border border-gray-200 rounded-lg p-3 text-sm">
                      <div className="text-xs text-muted mb-2">
                        node: {detail.last_node ?? "–"} · status: {detail.status ?? "–"} · rev: {detail.revision ?? "–"}
                      </div>
                      <pre className="text-xs whitespace-pre-wrap break-words bg-gray-50 rounded-md p-3 overflow-auto">
                        {safeJson(detail.state)}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-base font-medium mb-3">Canonical events (v1) – tail</h2>
                    <div className="space-y-3">
                      {detail.events.length === 0 ? (
                        <div className="text-sm text-muted">Ingen events.</div>
                      ) : (
                        detail.events
                          .slice()
                          .sort((a, b) => a.timestamp_ms - b.timestamp_ms)
                          .map((e) => (
                            <div key={e.event_id} className="border border-gray-200 rounded-lg p-3 text-sm">
                              <div className="text-xs text-muted mb-1">
                                {new Date(e.timestamp_ms).toISOString()} · rev {e.revision} · {e.event_type}
                              </div>
                              <div className="text-xs text-muted">node: {e.node_id ?? "–"} · input_id: {e.input_id}</div>
                              <pre className="mt-2 text-xs whitespace-pre-wrap break-words bg-gray-50 rounded-md p-3 overflow-auto">
                                {safeJson(e.payload)}
                              </pre>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  )
}
