import Head from "next/head"
import { useState } from "react"

export default function AfmeldPage() {
  const [phone, setPhone] = useState("")
  const [status, setStatus] = useState<"idle"|"sending"|"ok"|"error"|"invalid">("idle")

  async function handleSubmit() {
    const digits = phone.replace(/\s|\-/g, "")
    if (!/^(\+45)?[0-9]{8}$/.test(digits)) {
      setStatus("invalid")
      return
    }
    setStatus("sending")
    try {
      const res = await fetch("/api/sms/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: digits }),
      })
      if (res.ok) setStatus("ok")
      else setStatus("error")
    } catch {
      setStatus("error")
    }
  }

  return (
    <>
      <Head>
        <title>Afmeld SMS | Gaarsdal Hypnoterapi</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f4f0",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "20px",
      }}>
        <div style={{
          maxWidth: "440px",
          width: "100%",
          background: "#fff",
          borderRadius: "12px",
          padding: "40px 36px",
          boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
        }}>
          {status === "ok" ? (
            <>
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>✓</div>
              <h1 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "12px", color: "#333" }}>
                Du er afmeldt
              </h1>
              <p style={{ fontSize: "15px", color: "#666", lineHeight: 1.7 }}>
                Dit telefonnummer er fjernet fra listen. Du vil ikke modtage flere SMS-beskeder fra Gaarsdal Hypnoterapi.
              </p>
            </>
          ) : (
            <>
              <div style={{ marginBottom: "8px" }}>
                <img src="/android-chrome-512x512.png" alt="Gaarsdal" style={{ width: "48px", height: "48px", borderRadius: "8px" }} />
              </div>
              <h1 style={{ fontSize: "22px", fontWeight: 600, marginBottom: "8px", color: "#333" }}>
                Afmeld SMS-beskeder
              </h1>
              <p style={{ fontSize: "15px", color: "#666", marginBottom: "28px", lineHeight: 1.7 }}>
                Indtast dit telefonnummer for at afmelde dig fra SMS-beskeder fra Gaarsdal Hypnoterapi.
              </p>

              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#555", marginBottom: "8px" }}>
                Telefonnummer (dansk, 8 cifre)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => { setPhone(e.target.value); setStatus("idle") }}
                placeholder="fx 42 80 74 74"
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  fontSize: "16px",
                  border: status === "invalid" ? "1.5px solid #c0783a" : "1.5px solid #d0cbc4",
                  borderRadius: "8px",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  marginBottom: "8px",
                  outline: "none",
                }}
              />
              {status === "invalid" && (
                <p style={{ fontSize: "13px", color: "#c0783a", marginBottom: "12px" }}>
                  Indtast venligst et gyldigt dansk telefonnummer (8 cifre).
                </p>
              )}
              {status === "error" && (
                <p style={{ fontSize: "13px", color: "#c0783a", marginBottom: "12px" }}>
                  Noget gik galt. Prøv igen eller kontakt jan@gaarsdal.net.
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={status === "sending"}
                style={{
                  width: "100%",
                  padding: "13px",
                  background: "#5a7a8f",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: 500,
                  cursor: status === "sending" ? "not-allowed" : "pointer",
                  opacity: status === "sending" ? 0.7 : 1,
                  fontFamily: "inherit",
                  marginTop: "4px",
                }}
              >
                {status === "sending" ? "Afmelder..." : "Afmeld mig"}
              </button>

              <p style={{ fontSize: "12px", color: "#aaa", marginTop: "20px", textAlign: "center" }}>
                Gaarsdal Hypnoterapi · Birkerød · jan@gaarsdal.net
              </p>
            </>
          )}
        </div>
      </main>
    </>
  )
}
