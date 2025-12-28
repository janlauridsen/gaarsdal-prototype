import { useEffect, useState } from "react"
import { RMRCLogEntry } from "../../lib/logging/logging.contract"

export default function AdminSessionPage() {
  const [logs, setLogs] = useState<RMRCLogEntry[]>([])
  const [sessionId, setSessionId] = useState<string>("")

  useEffect(() => {
    if (!sessionId) return

    fetch(`/api/admin/session/${sessionId}`)
      .then(res => res.json())
      .then(setLogs)
  }, [sessionId])

  return (
    <main style={{ padding: 24 }}>
      <h1>RMRC Session Viewer</h1>

      <input
        placeholder="Session ID"
        value={sessionId}
        onChange={e => setSessionId(e.target.value)}
        style={{ width: "100%", marginBottom: 16 }}
      />

      <pre style={{ fontSize: 12 }}>
        {JSON.stringify(logs, null, 2)}
      </pre>
    </main>
  )
}
