// pages/admin.tsx
import { useState } from "react";

export default function AdminPanel() {
  const [password, setPassword] = useState("");
  const [sessions, setSessions] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadSessions() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin-logs", {
        method: "POST",
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!data.ok) {
        setError(data.error || "Ukendt fejl");
        setLoading(false);
        return;
      }

      setSessions(data.sessions);
    } catch (e) {
      setError("Kan ikke kontakte serveren.");
    }

    setLoading(false);
  }

  async function loadConversation(sessionId: string) {
    const res = await fetch("/api/admin-session", {
      method: "POST",
      body: JSON.stringify({ password, sessionId }),
    });

    const data = await res.json();

    if (!data.ok) {
      setError(data.error);
      return;
    }

    setSelected(data);
  }

  return (
    <div className="min-h-screen bg-[#F4F2ED] text-[#2E2C29] p-8">
      <h1 className="text-3xl font-semibold mb-6 text-center">
        Admin Dashboard
      </h1>

      {/* PASSWORD */}
      <div className="max-w-md mx-auto mb-8">
        <input
          type="password"
          placeholder="Admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 border rounded mb-3"
        />
        <button
          onClick={loadSessions}
          className="w-full bg-[#2F5C5B] text-white py-2 rounded hover:bg-[#244847] transition"
        >
          Hent sessions
        </button>

        {error && (
          <p className="text-red-600 text-center mt-3 font-medium">{error}</p>
        )}
      </div>

      {/* CONTENT GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* SESSION LIST */}
        <div className="md:col-span-1 bg-white rounded-lg shadow p-4 border border-gray-200">
          <h2 className="text-xl mb-3 font-semibold">Sessions</h2>

          {loading && <p>Indlæser...</p>}

          {sessions.length === 0 && !loading && (
            <p className="text-gray-600">Ingen gyldige sessions fundet.</p>
          )}

          <ul className="space-y-2">
            {sessions.map((s) => (
              <li
                key={s.sessionId}
                className="p-3 bg-[#F4F2ED] rounded cursor-pointer hover:bg-[#e7e4df]"
                onClick={() => loadConversation(s.sessionId)}
              >
                <p className="font-medium">{s.sessionId}</p>
                <p className="text-sm text-gray-600">
                  {new Date(s.started).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* CONVERSATION VIEWER */}
        <div className="md:col-span-2 bg-white rounded-lg shadow p-6 border border-gray-200">
          {!selected && (
            <p className="text-gray-500 text-center">
              Vælg en session fra listen.
            </p>
          )}

          {selected && (
            <>
              <h2 className="text-2xl font-semibold mb-3">
                Samtale – {selected.sessionId}
              </h2>

              <h3 className="text-lg font-medium mt-4 mb-2">Metadata</h3>
              <pre className="bg-[#F4F2ED] p-3 rounded text-sm overflow-auto">
                {JSON.stringify(selected.meta, null, 2)}
              </pre>

              <h3 className="text-lg font-medium mt-4 mb-2">Beskeder</h3>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {selected.messages.map((m: any, i: number) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg ${
                      m.role === "user"
                        ? "bg-[#d9e3e2]"
                        : "bg-[#eae6df]"
                    }`}
                  >
                    <p className="font-semibold capitalize">{m.role}</p>
                    <p className="whitespace-pre-wrap">{m.text}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(m.time).toLocaleString()}
                    </p>
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
