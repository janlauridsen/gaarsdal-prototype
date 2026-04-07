// components/chatbot/ConsentBanner.tsx
import { useState } from "react"
import type { ConsentRetentionDays } from "../../chat/consent/store"

type Props = {
  onConsent: (retentionDays: ConsentRetentionDays) => void
  onDelete: () => void
  loading: boolean
  /** Hvis true: brugeren har allerede samtykket — vis "administrer data"-tilstand */
  manageMode?: boolean
  currentRetentionDays?: ConsentRetentionDays | null
}

type Screen = "main" | "custom" | "delete_confirm"

export default function ConsentBanner({
  onConsent,
  onDelete,
  loading,
  manageMode = false,
  currentRetentionDays,
}: Props) {
  const [screen, setScreen] = useState<Screen>("main")

  const retentionLabel = (days: ConsentRetentionDays | null | undefined): string => {
    if (!days || days === 0) return "kun denne session"
    if (days === 30) return "30 dage"
    if (days === 90) return "90 dage"
    if (days === 365) return "1 år"
    return `${days} dage`
  }

  // ─── Slet-bekræftelse ─────────────────────────────────────────────────────
  if (screen === "delete_confirm") {
    return (
      <div style={styles.banner}>
        <p style={styles.title}>Slet alle dine data?</p>
        <p style={styles.body}>
          Alle dine samtaler, noter og hukommelse slettes permanent. Det kan
          ikke fortrydes.
        </p>
        <div style={styles.chipRow}>
          <button
            style={{ ...styles.chip, ...styles.chipDestructive }}
            onClick={onDelete}
            disabled={loading}
          >
            Ja, slet alt
          </button>
          <button
            style={{ ...styles.chip, ...styles.chipGhost }}
            onClick={() => setScreen("main")}
            disabled={loading}
          >
            Annuller
          </button>
        </div>
      </div>
    )
  }

  // ─── Vælg periode ─────────────────────────────────────────────────────────
  if (screen === "custom") {
    return (
      <div style={styles.banner}>
        <p style={styles.title}>Hvor længe må jeg gemme?</p>
        <div style={styles.chipRow}>
          {([30, 90, 365] as ConsentRetentionDays[]).map((days) => (
            <button
              key={days}
              style={styles.chip}
              onClick={() => onConsent(days)}
              disabled={loading}
            >
              {retentionLabel(days)}
            </button>
          ))}
        </div>
        <button
          style={styles.linkBtn}
          onClick={() => setScreen("main")}
          disabled={loading}
        >
          ← Tilbage
        </button>
      </div>
    )
  }

  // ─── Administrer tilstand (returbruger) ────────────────────────────────────
  if (manageMode) {
    return (
      <div style={styles.banner}>
        <p style={styles.title}>Dine data</p>
        <p style={styles.body}>
          {currentRetentionDays && currentRetentionDays > 0
            ? `Samtaler gemmes i ${retentionLabel(currentRetentionDays)}.`
            : "Samtaler gemmes kun i denne session — intet gemmes mellem besøg."}
        </p>
        <div style={styles.chipRow}>
          <button
            style={styles.chip}
            onClick={() => setScreen("custom")}
            disabled={loading}
          >
            Skift opbevaringsperiode
          </button>
          <button
            style={{ ...styles.chip, ...styles.chipDestructive }}
            onClick={() => setScreen("delete_confirm")}
            disabled={loading}
          >
            Slet mine data
          </button>
        </div>
      </div>
    )
  }

  // ─── Første besøg: samtykke-prompt ────────────────────────────────────────
  return (
    <div style={styles.banner}>
      <p style={styles.title}>Inden vi begynder</p>
      <p style={styles.body}>
        Må jeg gemme vores samtaler? Det giver mulighed for at fortsætte næste
        gang og huske hvad vi har talt om.
      </p>
      <div style={styles.chipRow}>
        <button
          style={styles.chip}
          onClick={() => onConsent(90)}
          disabled={loading}
        >
          Ja, 90 dage
        </button>
        <button
          style={{ ...styles.chip, ...styles.chipSecondary }}
          onClick={() => onConsent(0)}
          disabled={loading}
        >
          Kun denne session
        </button>
        <button
          style={{ ...styles.chip, ...styles.chipGhost }}
          onClick={() => setScreen("custom")}
          disabled={loading}
        >
          Vælg selv…
        </button>
      </div>
      <p style={styles.fine}>
        Dine samtaler bruges ikke til træning og deles ikke med andre.
      </p>
    </div>
  )
}

// ─── Inline styles — matcher chatbottens rolige, neutrale udtryk ─────────────

const styles: Record<string, React.CSSProperties> = {
  banner: {
    padding: "16px 18px 14px",
    borderTop: "1px solid rgba(0,0,0,0.07)",
    background: "var(--color-bg, #f9f8f6)",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  title: {
    margin: 0,
    fontSize: "13px",
    fontWeight: 500,
    color: "var(--color-text, #1a1a1a)",
  },
  body: {
    margin: 0,
    fontSize: "12.5px",
    color: "var(--color-muted, #666)",
    lineHeight: 1.5,
  },
  chipRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  },
  chip: {
    padding: "6px 12px",
    borderRadius: "20px",
    border: "1px solid var(--color-accent, #4a7c59)",
    background: "var(--color-accent, #4a7c59)",
    color: "#fff",
    fontSize: "12px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "opacity 0.15s",
  },
  chipSecondary: {
    background: "transparent",
    color: "var(--color-accent, #4a7c59)",
  },
  chipGhost: {
    background: "transparent",
    color: "var(--color-muted, #666)",
    borderColor: "rgba(0,0,0,0.15)",
  },
  chipDestructive: {
    background: "transparent",
    borderColor: "#c0392b",
    color: "#c0392b",
  },
  linkBtn: {
    background: "none",
    border: "none",
    color: "var(--color-muted, #888)",
    fontSize: "12px",
    cursor: "pointer",
    padding: "2px 0",
    textAlign: "left" as const,
  },
  fine: {
    margin: 0,
    fontSize: "11px",
    color: "var(--color-muted, #999)",
    lineHeight: 1.4,
  },
}
