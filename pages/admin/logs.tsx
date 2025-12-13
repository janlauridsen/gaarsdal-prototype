// pages/admin/logs.tsx
import React, { useState } from "react";

export default function AdminLogs() {
  const [password, setPassword] = useState("");
  const [auth, setAuth] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  function fmt(t: any) {
    const num = Number(t);
    if (!num || isNaN(num)) return "Ukendt dato";
    return new Date(num).toLocaleString("da-DK");
  }

  async function loadSessions() {
    setLoading(true);

    const res = await fetch("/api/admin-logs", {
      method: "POST",
      body: JSON.stringify({ password }),
    });

    const data = await res.json();
    if (!data.ok) {
      alert("Forkert adgangskode");
      setLoading(false);
      return;
    }

    setAuth(true);
    setSessions(data.sessions || []);
    setLoading(false);
  }

  async function loadSessionMessages(sessionId: string) {
    setLoading(true);

    const res = await fetch("/api/admin-session", {
      method: "POST",
      body: JSON.stringify({ password, sessionId }),
    });

    const data = await res.json();
    if (!data.ok) {
      alert("Kunne ikke hente samtale");
      setLoading(false);
      return;
    }

    setSelected(sessionId);
    setMessages(data.messages || []);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-bg text-text p-6">
      <h1 className="text-2xl font-semibold mb-6">Chat Sessions (Admin)</h1>

      {!auth && (
        <div className="max-w-sm bg-white rounded-xl shadow p-6 border">
          <p className="mb-3 text-sm text-muted">
            Indtast admin-adgangskode
          </p>

          <input
            type="password"
            className="w-full border rounded-lg px-3 py-2 mb-4"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={loadSessions}
            className="bg-accent text-white px-4 py-2 rounded-lg w-full"
          >
            {loading ? "Henter…" : "Log ind"}
          </button>
        </div>
      )}

      {auth && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Sessions */}
          <div className="bg-white rounded-xl border shadow p-4">
            <h2 className="font-semibold mb-3">Sessions</h2>

            {sessions.length === 0 && (
              <p className="text-sm text-muted">Ingen sessions fundet.</p>
            )}

            <div className="space-y-2 max-h-[70vh] overflow-auto">
              {sessions.map((s) => (
                <div
                  key={s.sessionId}
                  onClick={() => loadSessionMessages(s.sessionId)}
                  className={`p-3 rounded-lg border cursor-pointer ${
                    selected === s.sessionId
                      ? "bg-sage/20"
                      : "hover:bg-sage/10"
                  }`}
                >
                  <div className="text-sm font-medium">
                    {s.sessionId.slice(0, 8)}…
                  </div>
                  <div className="text-xs text-muted">
                    Start: {fmt(s.started)}
                  </div>
                  <div className="text-xs text-muted">
                    Beskeder: {s.messageCount}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="md:col-span-2 bg-white rounded-xl border shadow p-4">
            <h2 className="font-semibold mb-3">Samtale</h2>

            {!selected && (
              <p className="text-sm text-muted">
                Vælg en session for at se beskeder.
              </p>
            )}

            {selected && (
              <div className="space-y-4 max-h-[70vh] overflow-auto">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl max-w-[80%] ${
                      m.role === "assistant"
                        ? "bg-gray-100"
                        : "bg-accent text-white ml-auto"
                    }`}
                  >
                    <div className="text-xs opacity-60 mb-1">
                      {m.role} · {fmt(m.time)}
                    </div>
                    <div className="text-sm whitespace-pre-line">{m.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
