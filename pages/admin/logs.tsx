// pages/admin/logs.tsx
import React, { useState } from "react";

export default function AdminLogs() {
  const [password, setPassword] = useState("");
  const [auth, setAuth] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Format timestamp safely
  function fmt(t: number | string | undefined) {
    if (!t) return "Ukendt tidspunkt";
    const date = new Date(t);
    return isNaN(date.getTime()) ? "Ukendt tidspunkt" : date.toLocaleString("da-DK");
  }

  // Log ind + hent session overview
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

    // PATCH — sikrer at sessions altid har standardfelter
    const fixed = data.sessions.map((s: any) => ({
      sessionId: s.sessionId,
      started: s.started || null,
      meta: s.meta || {},
      messageCount: s.messageCount ?? 0,
    }));

    setSessions(fixed);
    setAuth(true);
    setLoading(false);
  }

  // Hent beskeder fra én session
  async function loadSessionMessages(sessionId: string) {
    setLoading(true);

    const res = await fetch("/api/admin-session", {
      method: "POST",
      body: JSON.stringify({ password, sessionId }),
    });

    const data = await res.json();

    if (!data.ok) {
      alert("Fejl ved hentning af samtale");
      setLoading(false);
      return;
    }

    setSelected(sessionId);
    setMessages(data.messages);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-bg text-text p-6">
      <h1 className="text-2xl font-semibold mb-6">Chat Sessions (Admin)</h1>

      {/* LOGIN */}
      {!auth && (
        <div className="max-w-sm bg-white rounded-xl shadow p-6 border">
          <p className="mb-3 text-sm text-muted">
            Indtast admin-adgangskode for at se logs
          </p>

          <input
            type="password"
            className="w-full border rounded-lg px-3 py-2 mb-4"
            placeholder="Adgangskode"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={loadSessions}
            className="bg-accent text-white px-4 py-2 rounded-lg w-full hover:bg-accent/90"
          >
            {loading ? "Henter…" : "Log ind"}
          </button>
        </div>
      )}

      {/* DASHBOARD */}
      {auth && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* LEFT SIDE — SESSION LIST */}
          <div className="bg-white rounded-xl border shadow p-4">
            <h2 className="text-lg font-semibold mb-3">Sessions</h2>

            {sessions.length === 0 && (
              <p className="text-sm text-muted">Ingen sessions fundet.</p>
            )}

            <div className="space-y-2 max-h-[70vh] overflow-auto pr-1">
              {sessions.map((s) => {
                const started = fmt(s.started);
                const ip = s.meta?.ip || "–";
                const msgCount = s.messageCount ?? 0;

                return (
                  <div
                    key={s.sessionId}
                    onClick={() => loadSessionMessages(s.sessionId)}
                    className={`p-3 rounded-lg border cursor-pointer hover:bg-sage/10 transition ${
                      selected === s.sessionId ? "bg-sage/20" : "bg-white"
                    }`}
                  >
                    <div className="font-medium text-sm">
                      Session: {s.sessionId?.slice(0, 8)}…
                    </div>

                    <div className="text-xs text-muted">
                      Startet: {started}
                    </div>

                    <div className="text-xs text-muted">IP: {ip}</div>

                    <div className="text-xs text-muted">
                      Beskeder: {msgCount}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT SIDE — MESSAGES */}
          <div className="md:col-span-2 bg-white rounded-xl border shadow p-4">
            <h2 className="text-lg font-semibold mb-3">Samtale</h2>

            {!selected && (
              <p className="text-muted text-sm">
                Vælg en session i venstre side for at se beskeder.
              </p>
            )}

            {selected && (
              <div className="space-y-4 max-h-[70vh] overflow-auto pr-2">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl max-w-[80%] ${
                      m.role === "assistant"
                        ? "bg-gray-100 text-text self-start"
                        : "bg-accent text-white self-end ml-auto"
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
