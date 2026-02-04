import { useEffect, useState } from "react"

const DEFAULT_YAML = `cases:
  - name: basic_sanity
    conversation_id: test_basic_v1
    expected:
      status: active
      min_revisions: 1
`

export default function ReplayPage() {
  const [yamlText, setYamlText] = useState(DEFAULT_YAML)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  async function runReplay() {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch("/api/replay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yaml: yamlText }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data?.error ?? "Replay failed")
      } else {
        setResult(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Replay failed")
    } finally {
      setLoading(false)
    }
  }

  async function loadHistory() {
    setHistoryLoading(true)
    try {
      const res = await fetch("/api/replay/history")
      const data = await res.json()
      if (res.ok && Array.isArray(data?.history)) {
        setHistory(data.history)
      }
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  return (
    <main className="min-h-screen bg-bg text-text px-6 py-16">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-h2 font-light mb-2">
            Replay test cases
          </h1>
          <p className="text-muted">
            Indsæt YAML testcases og kør replay mod logs fra Redis.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <label className="text-sm font-medium">
            YAML testcases
          </label>
          <textarea
            className="w-full min-h-[240px] rounded-lg border border-gray-200 p-3 font-mono text-sm"
            value={yamlText}
            onChange={(e) => setYamlText(e.target.value)}
          />
          <button
            onClick={runReplay}
            disabled={loading}
            className="bg-accent text-white px-4 py-2 rounded-lg disabled:opacity-60"
          >
            {loading ? "Kører..." : "Kør replay"}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
            {error}
          </div>
        )}

        {result && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-sm font-medium mb-2">
              Resultat
            </div>
            <pre className="text-xs overflow-auto max-h-[400px]">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">
              Tidligere replays
            </div>
            <button
              className="text-xs text-accent"
              onClick={loadHistory}
              disabled={historyLoading}
            >
              {historyLoading ? "Opdaterer..." : "Opdater"}
            </button>
          </div>
          {history.length === 0 ? (
            <div className="text-sm text-muted">
              Ingen replays endnu.
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="border border-gray-100 rounded-lg p-3"
                >
                  <div className="text-xs text-muted">
                    {entry.created_at}
                  </div>
                  <pre className="text-xs overflow-auto max-h-[120px] bg-gray-50 p-2 rounded mt-2">
                    {entry.yaml}
                  </pre>
                  <div className="mt-2 text-xs text-muted">
                    {entry?.result?.passed ?? 0} /
                    {entry?.result?.total ?? 0} bestået
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      className="text-xs px-2 py-1 rounded border border-gray-200"
                      onClick={() => setYamlText(entry.yaml)}
                    >
                      Indlæs YAML
                    </button>
                    <button
                      className="text-xs px-2 py-1 rounded bg-accent text-white"
                      onClick={() => {
                        setYamlText(entry.yaml)
                        runReplay()
                      }}
                    >
                      Kør igen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
