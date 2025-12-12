// pages/admin/logs.tsx
import { useState } from "react";

export default function AdminLogs() {
  const [pw, setPw] = useState("");
  const [ok, setOk] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function login() {
    setLoading(true);
    const res = await fetch("/api/admin-logs", {
      method: "POST",
      body: JSON.stringify({ password: pw }),
    });

    const data = await res.json();
    setLoading(false);

    if (!data.ok) {
      alert("Forkert adgangskode");
      return;
    }

    setLogs(data.logs);
    setOk(true);
  }

  if (!ok) {
    return (
      <div style={{ maxWidth: 400, margin: "80px auto", textAlign: "center" }}>
        <h2>Admin Login</h2>
        <p>Indtast adgangskode for at se chat-historik</p>

        <input
          type="password"
          placeholder="Password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          style={{
            padding: "10px",
            width: "100%",
            marginBottom: "10px",
            fontSize: "16px",
          }}
        />

        <button
          onClick={login}
          disabled={loading}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          {loading ? "Logger ind..." : "Login"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "40px auto" }}>
      <h2>Chat Logs</h2>
      <p>Viser seneste gemte beskeder:</p>

      <div style={{ marginTop: "20px" }}>
        {logs.length === 0 && <p>Ingen logs endnu.</p>}

        {logs.map((item, i) => (
          <div
            key={i}
            style={{
              border: "1px solid #ddd",
              padding: "10px",
              marginBottom: "10px",
              borderRadius: "6px",
              background: "#fafafa",
            }}
          >
            <strong>{item.role}</strong>: {item.text}
            <div style={{ fontSize: "12px", opacity: 0.6 }}>
              {new Date(item.time).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
