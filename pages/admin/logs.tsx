// pages/admin/logs.tsx
import React, { useState } from "react";

export default function AdminLogsPage() {
  const [password, setPassword] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<number | null>(null);

  async function loadLogs() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin-logs", {
        method: "POST",
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!data.ok) {
        setError(data.error || "Kunne ikke hente logs.");
        setLogs([]);
      } else {
        setLogs(Array.isArray(data.logs) ? data.logs : []);
      }
    } catch (err) {
      console.error(err);
      setError("Uventet fejl ved indlæsning.");
    }

    setLoading(false);
  }

  const selectedLog = selected !== null ? logs[selected] : null;

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif" }}>
      <h1 style={{ marginBottom: "20px" }}>Chat Sessions</h1>

      {/* Password input */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="password"
          placeholder="Admin kodeord"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "6px",
            width: "200px",
          }}
        />
        <button
          onClick={loadLogs}
          style={{
            marginLeft: "10px",
            padding: "10px 16px",
            background: "#2F5C5B",
            color: "white",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Hent logs
        </button>
      </div>

      {loading && <p>Indlæser logs…</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ display: "flex", gap: "30px", marginTop: "20px" }}>
        {/* Sessions list */}
        <div style={{ width: "40%" }}>
          <h2>Sessions</h2>

          {logs.length === 0 ? (
            <p>Ingen gyldige sessions fundet.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {logs.map((entry, i) => (
                <li
                  key={i}
                  onClick={() => setSelected(i)}
                  style={{
                    padding: "10px",
                    marginBottom: "6px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    background: selected === i ? "#e4eee9" : "#f6f6f6",
                  }}
                >
                  <strong>Session {i + 1}</strong>
                  <br />
                  <small>{entry.timestamp || "Ukendt tidspunkt"}</small>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Message viewer */}
        <div style={{ width: "60%" }}>
          <h2>Samtale</h2>

          {!selectedLog ? (
            <p>Vælg en session fra listen.</p>
          ) : (
            <div
              style={{
                background: "#fafafa",
                padding: "15px",
                borderRadius: "8px",
                maxHeight: "500px",
                overflowY: "auto",
              }}
            >
              {Array.isArray(selectedLog.messages) ? (
                selectedLog.messages.map((m: any, i: number) => (
                  <div
                    key={i}
                    style={{
                      marginBottom: "12px",
                      padding: "10px",
                      borderRadius: "6px",
                      background: m.role === "user" ? "#dfefff" : "#e9f5e1",
                    }}
                  >
                    <strong>{m.role.toUpperCase()}:</strong>
                    <p>{m.text || JSON.stringify(m)}</p>
                  </div>
                ))
              ) : (
                <p>Ingen beskeder i denne session.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
