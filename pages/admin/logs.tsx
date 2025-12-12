// pages/admin/logs.tsx
import { useState } from "react";

export default function AdminLogs() {
  const [pw, setPw] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function login() {
    setLoading(true);

    const res = await fetch("/api/sessions/list", {
      method: "POST",
      body: JSON.stringify({ password: pw }),
    });

    const data = await res.json();
    setLoading(false);

    if (!data.ok) {
      alert("Forkert adgangskode");
      return;
    }

    setLoggedIn(true);
    setSessions(data.sessions);
  }

  async function loadSession(sessionId: string) {
    setLoading(true);

    const res = await fetch("/api/sessions/get", {
      method: "POST",
      body: JSON.stringify({
        password: pw,
        sessionId,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!data.ok) {
      alert("Kunne ikke hente session");
      return;
    }

    setMessages(data.messages);
  }

  // -------- LOGIN SCREEN --------
  if (!loggedIn) {
    return (
      <div style={{ maxWidth: 420, margin: "100px auto", textAlign: "center" }}>
        <h2 style={{ fontSize: "24px", marginBottom: "10px" }}>Admin Login</h2>
        <p style={{ color: "#666", marginBottom: "20px" }}>
          Indtast adgangskoden for at se chat-sessions
        </p>

        <input
          type="password"
          placeholder="Password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          style={{
            padding: "12px",
            width: "100%",
            borderRadius: "8px",
            border: "1px solid #ccc",
            marginBottom: "12px",
            fontSize: "16px",
          }}
        />

        <button
          onClick={login}
          disabled={loading}
          style={{
            padding: "12px 20px",
            width: "100%",
            background: "#2F5C5B",
            color: "white",
            borderRadius: "8px",
            border: "none",
            fontSize: "16px",
            cursor: "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Logger ind…" : "Login"}
        </button>
      </div>
    );
  }

  // -------- SESSION VIEW --------
  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: "10px" }}>
      <h2 style={{ fontSize: "26px", marginBottom: "10px" }}>Chat Sessions</h2>
      <p style={{ color: "#666" }}>Klik på en session for at se hele samtalen.</p>

      <div
        style={{
          display: "flex",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        {/* LEFT SIDE — SESSION LIST */}
        <div style={{ width: "35%", borderRight: "1px solid #ddd", paddingRight: "10px" }}>
          <h3 style={{ fontSize: "20px", marginBottom: "10px" }}>Sessions</h3>

          {sessions.length === 0 && <p>Ingen sessions fundet.</p>}

          <ul style={{ listStyle: "none", padding: 0 }}>
            {sessions.map((s: any, i: number) => (
              <li
                key={i}
                onClick={() => loadSession(s.sessionId)}
                style={{
                  padding: "10px",
                  marginBottom: "8px",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  cursor: "pointer",
                  background: "#fafafa",
                }}
              >
                <strong>{s.sessionId.slice(0, 8)}…</strong>
                <br />
                <span style={{ fontSize: "12px", color: "#777" }}>
                  {new Date(s.started).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* RIGHT SIDE — MESSAGE VIEW */}
        <div style={{ width: "65%", paddingLeft: "10px" }}>
          <h3 style={{ fontSize: "20px", marginBottom: "10px" }}>Samtale</h3>

          {!messages && <p>Vælg en session fra listen.</p>}

          {messages && (
            <div
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "10px",
                maxHeight: "70vh",
                overflowY: "auto",
              }}
            >
              {messages.map((m: any, i: number) => (
                <div
                  key={i}
                  style={{
                    marginBottom: "12px",
                    padding: "10px",
                    background: m.role === "user" ? "#2F5C5B" : "#f0f0f0",
                    color: m.role === "user" ? "#fff" : "#333",
                    borderRadius: "8px",
                    maxWidth: "80%",
                    alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  }}
                >
                  <strong>{m.role === "user" ? "Bruger" : "Assistent"}</strong>
                  <div style={{ whiteSpace: "pre-wrap", marginTop: "4px" }}>{m.text}</div>
                  <div
                    style={{
                      fontSize: "11px",
                      marginTop: "6px",
                      opacity: 0.6,
                    }}
                  >
                    {new Date(m.time).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
