import { useEffect, useState } from "react";
import type { SessionMeta, SessionTurn } from "../lib/admin-types";

export default function AdminPage() {
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [selected, setSelected] = useState<{
    meta: SessionMeta | null;
    turns: SessionTurn[];
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ---------------- LOAD SESSIONS ---------------- */
  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/sessions")
      .then((r) => r.json())
      .then((d) => setSessions(d.sessions || []))
      .catch(() => setError("Kunne ikke hente sessions"))
      .finally(() => setLoading(false));
  }, []);

  async function loadSession(sessionId: string) {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/session/${sessionId}`);
      const data = await res.json();
      setSelected(data);
    } catch {
      setError("Kunne ikke hente session");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 p-8">
      <h1 className="text-2xl font-semibold mb-6">Admin – Sessions</h1>

      {error && <div className="mb-4 text-red-600">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* SESSION LIST */}
        <div className="bg-white rounded-lg p-4 shadow">
          <h2 className="font-medium mb-3">Sessions</h2>

          {loading && <p className="text-sm text-gray-500">Indlæser…</p>}

          <ul className="space-y-2">
            {sessions.map((s) => (
              <li
                key={s.sessionId}
                onClick={() => loadSession(s.sessionId)}
                className="cursor-pointer p-2 rounded hover:bg-gray-100"
              >
                <div className="text-sm font-medium">
                  {s.sessionId}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(s.startedAt).toLocaleString()}
                </div>
                <div className="text-xs text-gray-400">
                  {s.promptVersion}
                </div>
              </li>
            ))}
          </ul>

          {sessions.length === 0 && !loading && (
            <p className="text-sm text-gray-500">
              Ingen sessions fundet.
            </p>
          )}
        </div>

        {/* SESSION DETAIL */}
        <div className="md:col-span-2 bg-white rounded-lg p-6 shadow">
          {!selected && (
            <div className="text-gray-500">
              Vælg en session for at se detaljer.
            </div>
          )}

          {selected && (
            <>
              <h2 className="text-xl font-medium mb-4">
                Session {selected.meta?.sessionId}
              </h2>

              <h3 className="font-semibold mb-2">Meta</h3>
              <pre className="bg-gray-100 p-3 rounded text-xs mb-4 overflow-auto">
                {JSON.stringify(selected.meta, null, 2)}
              </pre>

              <h3 className="font-semibold mb-2">Turns</h3>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {selected.turns.map((t, i) => (
                  <div key={i} className="border rounded p-3">
                    <div className="text-xs text-gray-500 mb-1">
                      #{t.turnIndex} · {t.chatStateBefore} →{" "}
                      {t.chatStateAfter}
                      {t.isClosing && " · closing"}
                    </div>

                    <div className="mb-2">
                      <strong>User</strong>
                      <div className="whitespace-pre-wrap text-sm">
                        {t.userText}
                      </div>
                    </div>

                    <div>
                      <strong>Assistant</strong>
                      <div className="whitespace-pre-wrap text-sm">
                        {t.assistantText}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
