import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

type InteractionEvent = {
  conversation_id: string
  revision: number
  active_node: string
  input_type: string
  user_input?: string
  ai_response?: string
  outcome_node?: string
  timestamp: string
}

type LogEvent = {
  conversation_id: string
  revision_before: number
  revision_after: number
  active_node_before: string | null
  active_node_after: string
  input_type: string
  transition_type: string
  timestamp: string
}

type SessionSummary = {
  conversation_id: string
  first_at: string
  last_at: string
  interaction_count: number
  log_count: number
}

function byNewest(a: string, b: string): number {
  return new Date(b).getTime() - new Date(a).getTime()
}

export default function SessionsPage() {
  const [interactions, setInteractions] = useState<InteractionEvent[]>([])
  const [logs, setLogs] = useState<LogEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [query, setQuery] = useState("")

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [interactionsRes, logsRes] = await Promise.all([
        fetch("/api/interactions"),
        fetch("/api/logs"),
      ])

      const interactionsData = await interactionsRes.json()
      const logsData = await logsRes.json()

      if (!interactionsRes.ok) {
        throw new Error(interactionsData?.error ?? "Kunne ikke hente interactions")
      }
      if (!logsRes.ok) {
        throw new Error(logsData?.error ?? "Kunne ikke hente logs")
      }

      const interactionsList = Array.isArray(interactionsData) ? interactionsData : []
      const logsList = Array.isArray(logsData) ? logsData : []

      setInteractions(interactionsList)
      setLogs(logsList)

      if (!selectedConversationId && interactionsList.length > 0) {
        const newest = [...interactionsList].sort((a, b) => byNewest(a.timestamp, b.timestamp))[0]
        setSelectedConversationId(newest.conversation_id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukendt fejl")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const summaries = useMemo<SessionSummary[]>(() => {
    const map = new Map<string, SessionSummary>()

    for (const i of interactions) {
      const current = map.get(i.conversation_id)
      if (!current) {
        map.set(i.conversation_id, {
          conversation_id: i.conversation_id,
          first_at: i.timestamp,
          last_at: i.timestamp,
          interaction_count: 1,
          log_count: 0,
        })
      } else {
        current.first_at = byNewest(current.first_at, i.timestamp) > 0 ? current.first_at : i.timestamp
        current.last_at = byNewest(i.timestamp, current.last_at) > 0 ? i.timestamp : current.last_at
        current.interaction_count += 1
      }
    }

    for (const l of logs) {
      const current = map.get(l.conversation_id)
      if (!current) {
        map.set(l.conversation_id, {
          conversation_id: l.conversation_id,
          first_at: l.timestamp,
          last_at: l.timestamp,
          interaction_count: 0,
          log_count: 1,
        })
      } else {
        current.first_at = byNewest(current.first_at, l.timestamp) > 0 ? current.first_at : l.timestamp
        current.last_at = byNewest(l.timestamp, current.last_at) > 0 ? l.timestamp : current.last_at
        current.log_count += 1
      }
    }

    return [...map.values()].sort((a, b) => byNewest(a.last_at, b.last_at))
  }, [interactions, logs])

  const filteredSummaries = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return summaries
    return summaries.filter((s) => s.conversation_id.toLowerCase().includes(q))
  }, [summaries, query])

  const selectedInteractions = useMemo(() => {
    if (!selectedConversationId) return []
    return interactions
      .filter((i) => i.conversation_id === selectedConversationId)
      .sort((a, b) => a.revision - b.revision)
  }, [interactions, selectedConversationId])

  const selectedLogs = useMemo(() => {
    if (!selectedConversationId) return []
    return logs
      .filter((l) => l.conversation_id === selectedConversationId)
      .sort((a, b) => a.revision_after - b.revision_after)
  }, [logs, selectedConversationId])

  return (
    <main className="min-h-screen bg-bg text-text px-6 py-10">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-h2 font-light">Session browser (read-only)</h1>
            <p className="text-sm text-muted">
              Overblik over conversation sessions og deres interaktioner/logs.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={load}
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
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
          <aside className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 h-[75vh] overflow-hidden">
            <div className="text-sm font-medium">Sessions ({filteredSummaries.length})</div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Søg conversation_id..."
            />

            <div className="overflow-auto h-[calc(75vh-110px)] space-y-2 pr-1">
              {filteredSummaries.length === 0 ? (
                <div className="text-sm text-muted">Ingen sessions fundet.</div>
              ) : (
                filteredSummaries.map((s) => {
                  const selected = s.conversation_id === selectedConversationId
                  return (
                    <button
                      key={s.conversation_id}
                      onClick={() => setSelectedConversationId(s.conversation_id)}
                      className={`w-full text-left rounded-lg border p-3 text-sm ${
                        selected ? "border-accent bg-accent/5" : "border-gray-200"
                      }`}
                    >
                      <div className="font-medium break-all">{s.conversation_id}</div>
                      <div className="text-xs text-muted mt-1">Sidste: {s.last_at}</div>
                      <div className="text-xs text-muted mt-1">
                        {s.interaction_count} interactions · {s.log_count} logs
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
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted">Conversation ID</div>
                  <div className="font-mono text-sm break-all">{selectedConversationId}</div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h2 className="text-base font-medium mb-3">Interaktioner</h2>
                    <div className="space-y-3">
                      {selectedInteractions.length === 0 ? (
                        <div className="text-sm text-muted">Ingen interaktioner.</div>
                      ) : (
                        selectedInteractions.map((i) => (
                          <div key={`${i.revision}-${i.timestamp}`} className="border border-gray-200 rounded-lg p-3">
                            <div className="text-xs text-muted mb-1">rev {i.revision} · {i.timestamp}</div>
                            <div className="text-xs text-muted">node: {i.active_node} · input: {i.input_type}</div>
                            {i.user_input && (
                              <div className="mt-2 text-sm">
                                <div className="text-xs text-muted">user</div>
                                <div>{i.user_input}</div>
                              </div>
                            )}
                            {i.ai_response && (
                              <div className="mt-2 text-sm">
                                <div className="text-xs text-muted">assistant</div>
                                <div className="whitespace-pre-wrap">{i.ai_response}</div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <h2 className="text-base font-medium mb-3">Kernel logs</h2>
                    <div className="space-y-3">
                      {selectedLogs.length === 0 ? (
                        <div className="text-sm text-muted">Ingen logs.</div>
                      ) : (
                        selectedLogs.map((l) => (
                          <div key={`${l.revision_after}-${l.timestamp}`} className="border border-gray-200 rounded-lg p-3 text-sm">
                            <div className="text-xs text-muted mb-1">{l.timestamp}</div>
                            <div>rev {l.revision_before} → {l.revision_after}</div>
                            <div className="text-xs text-muted mt-1">
                              {l.active_node_before ?? "null"} → {l.active_node_after}
                            </div>
                            <div className="text-xs text-muted mt-1">
                              input: {l.input_type} · transition: {l.transition_type}
                            </div>
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
