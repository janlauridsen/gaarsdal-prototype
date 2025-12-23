import { useEffect, useState } from "react";
import type { SessionMeta, SessionTurn } from "../../lib/admin-types";

export default function AdminPage() {
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [selected, setSelected] = useState<SessionMeta | null>(null);
  const [turns, setTurns] = useState<SessionTurn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ----------------------------------
     LOAD SESSION LIST
  ---------------------------------- */
  useEffect(() => {
    fetch("/api/admin/sessions")
      .then((res) => res.json())
      .then((data) => setSessions(data.sessions || []))
      .catch(() => setError("Kunne ikke hente sessions"));
  }, []);

  /* ----------------------------------
     LOAD SESSION DETAIL
  ---------------------------------- */
  async function loadSession(sessionId: string) {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/session/${sessionId}`);
      const data = await res.json();

      setSelected(data.meta);
      setTurns(data.turns || []);
    } catch {
      setError("Kunne ikke hente session");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 grid grid-cols-3 gap-6 text-sm">
      {/* SESSION LIST */}
      <div className="col-span-1 bg-white rounded-lg shadow p-4 overflow-auto">
        <h2 className="font-semibold mb-3">Sessions</h2>

        {sessions.length === 0 && (
          <p className="text-gray-500">Ingen sessions fundet</p>
        )}

        <ul className="space-y-2">
          {sessions.map((s) => (
            <li
              key={s.sessionId}
              className="p-2 rounded cursor-pointer hover:bg-gray-100 border"
              onClick={() => loadSession(s.sessionId)}
            >
              <div className="font-medium">{s.sessionId}</div>
              <div className="text-gray-500">
                {new Date(s.startedAt).toLocaleString()}
              </div>
              {s.closedReason && (
                <div className="text-xs mt-1 text-gray-600">
                  Lukket: {s.closedReason}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* SESSION DETAIL */}
      <div className="col-span-2 bg-white rounded-lg shadow p-4 overflow-auto">
        {!selected && (
          <p className="text-gray-500">
            Vælg en session for at se detaljer
          </p>
        )}

        {selected && (
          <>
            <h2 className="font-semibold mb-3">
              Session {selected.sessionId}
            </h2>

            {/* META */}
            <pre className="bg-gray-50 p-3 rounded mb-4 text-xs overflow-auto">
{JSON.stringify(selected, null, 2)}
            </pre>

            {/* TURNS */}
            <h3 className="font-semibold mb-2">Turns</h3>

            {loading && <p>Indlæser…</p>}

            <div className="space-y-3">
              {turns.map((t) => (
                <div
                  key={t.turnIndex}
                  className="border rounded p-3 bg-gray-50"
                >
                  <div className="text-xs text-gray-500 mb-1">
                    #{t.turnIndex} · {t.timestamp}
                  </div>

                  <div className="mb-2">
                    <strong>User:</strong>
                    <div className="whitespace-pre-wrap">
                      {t.userText}
                    </div>
                  </div>

                  <div className="mb-2">
                    <strong>Assistant:</strong>
                    <div className="whitespace-pre-wrap">
                      {t.assistantText}
                    </div>
                  </div>

                  <div className="text-xs text-gray-600">
                    {t.chatStateBefore} → {t.chatStateAfter}
                    {t.isClosing && " · CLOSING"}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 text-red-700 p-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
}
