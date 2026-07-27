// components/RefleksionsSkema.tsx
//
// Genbrugelig selvrefleksionskema-komponent.
// Bruges på /agteskab, /angst-skema, /stress-skema osv.
//
// Props:
//   slug       — url-slug der linker til emnesiden (fx "parforhold")
//   title      — sidetitel (fx "Hvad savner jeg i mit ægteskab?")
//   intro      — kort indledning
//   categories — liste af kategorier med spørgsmål
//   ctaLabel   — tekst på CTA-knap (valgfri, default: "Tal med chatbotten om det")
//
// Variant B (URL-kontekst):
//   Når brugeren klikker CTA, navigeres til /?open=chat&ctx=<encoded>
//   Chatbot.tsx læser ctx-parameteren og sender den som en stille første besked.

import React, { useState } from "react"
import Link from "next/link"

export type SkemaCategory = {
  id: string
  title: string
  questions: string[]
}

type Props = {
  slug: string
  title: string
  intro: string
  categories: SkemaCategory[]
  ctaLabel?: string
}

export default function RefleksionsSkema({ slug, title, intro, categories, ctaLabel }: Props) {
  const totalQuestions = categories.reduce((s, c) => s + c.questions.length, 0)
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  function toggle(key: string) {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function scoreFor(cat: SkemaCategory) {
    return cat.questions.filter((_, i) => checked[`${cat.id}-${i}`]).length
  }

  const totalScore = categories.reduce((s, c) => s + scoreFor(c), 0)

  // Byg context-streng til chatbotten (Variant B)
  function buildCtxParam(): string {
    const parts: string[] = []
    parts.push(`Emne: ${title}`)
    parts.push(`Bruger har markeret ${totalScore} ud af ${totalQuestions} udsagn.`)
    categories.forEach((cat) => {
      const score = scoreFor(cat)
      if (score > 0) {
        const markedQs = cat.questions
          .filter((_, i) => checked[`${cat.id}-${i}`])
          .map((q) => `"${q}"`)
          .join(", ")
        parts.push(`${cat.title} (${score}/${cat.questions.length}): ${markedQs}`)
      }
    })
    return encodeURIComponent(parts.join(" | "))
  }

  const hasAnyChecked = totalScore > 0

  // Find de 2 kategorier med højeste score
  const topCategories = [...categories]
    .map((c) => ({ ...c, score: scoreFor(c) }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score / b.questions.length - a.score / a.questions.length)
    .slice(0, 2)

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif" }}>
      {/* INTRO */}
      <section style={{ marginBottom: "40px" }}>
        <p style={{ fontSize: "17px", color: "#555", lineHeight: 1.7, maxWidth: "660px" }}>{intro}</p>
        <p style={{ fontSize: "14px", color: "#888", marginTop: "12px" }}>
          Sæt ✓ ved det der rammer dig. Flere krydser er helt okay.
        </p>
      </section>

      {/* KATEGORIER */}
      {categories.map((cat, catIdx) => (
        <section key={cat.id} style={{ marginBottom: "40px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <h2 style={{ fontSize: "17px", fontWeight: 600, color: "#333", margin: 0 }}>
              {catIdx + 1}. {cat.title}
            </h2>
            <span style={{
              fontSize: "13px",
              fontWeight: 500,
              color: scoreFor(cat) > 0 ? "#5a7a8f" : "#aaa",
              background: scoreFor(cat) > 0 ? "#eef3f6" : "#f5f5f5",
              padding: "2px 10px",
              borderRadius: "12px",
              transition: "all 0.2s",
            }}>
              {scoreFor(cat)}/{cat.questions.length}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {cat.questions.map((q, qIdx) => {
              const key = `${cat.id}-${qIdx}`
              const isChecked = Boolean(checked[key])
              return (
                <label
                  key={key}
                  onClick={() => toggle(key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    border: isChecked ? "1px solid #5a7a8f" : "1px solid #e5e7eb",
                    background: isChecked ? "#f0f5f8" : "#fff",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    userSelect: "none",
                  }}
                >
                  <span style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "4px",
                    border: isChecked ? "2px solid #5a7a8f" : "2px solid #d1d5db",
                    background: isChecked ? "#5a7a8f" : "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "all 0.15s",
                  }}>
                    {isChecked && (
                      <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                        <path d="M1 4L4 7.5L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>
                  <span style={{ fontSize: "15px", color: isChecked ? "#2d4a5a" : "#555", lineHeight: 1.5 }}>
                    {q}
                  </span>
                </label>
              )
            })}
          </div>
        </section>
      ))}

      {/* OVERBLIK */}
      <section style={{
        marginBottom: "40px",
        padding: "28px 32px",
        background: "#f5f7fa",
        borderRadius: "10px",
        border: "1px solid #e5e7eb",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 600, margin: 0, color: "#333" }}>
            Overblik
          </h2>
          <span style={{
            fontSize: "15px",
            fontWeight: 600,
            color: totalScore > 0 ? "#5a7a8f" : "#aaa",
            background: totalScore > 0 ? "#e0eaf0" : "#f0f0f0",
            padding: "4px 14px",
            borderRadius: "20px",
          }}>
            {totalScore} ud af {totalQuestions} markeret
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {categories.map((cat, idx) => {
            const score = scoreFor(cat)
            const pct = Math.round((score / cat.questions.length) * 100)
            return (
              <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "13px", color: "#666", width: "220px", flexShrink: 0 }}>
                  {idx + 1}. {cat.title}
                </span>
                <div style={{ flex: 1, height: "6px", background: "#e5e7eb", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${pct}%`,
                    background: pct >= 75 ? "#5a7a8f" : pct >= 50 ? "#7a9aaf" : pct > 0 ? "#a0bac8" : "transparent",
                    borderRadius: "3px",
                    transition: "width 0.4s ease",
                  }} />
                </div>
                <span style={{ fontSize: "13px", color: score > 0 ? "#5a7a8f" : "#aaa", width: "40px", textAlign: "right" }}>
                  {score}/{cat.questions.length}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {/* REFLEKSION — vises kun når der er markeringer */}
      {hasAnyChecked && topCategories.length > 0 && (
        <section style={{
          marginBottom: "40px",
          padding: "24px 28px",
          background: "#fff",
          border: "1px solid #5a7a8f",
          borderRadius: "10px",
          borderLeft: "4px solid #5a7a8f",
        }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#333", marginBottom: "10px" }}>
            Det du markerer flest af
          </h2>
          <p style={{ fontSize: "15px", color: "#555", lineHeight: 1.7, margin: 0 }}>
            Du har markeret mest inden for{" "}
            <strong style={{ color: "#2d4a5a" }}>
              {topCategories.map((c) => c.title.toLowerCase()).join(" og ")}
            </strong>
            . Det peger på at det er der din opmærksomhed er — og måske der noget kan arbejdes med.
          </p>
        </section>
      )}

      {/* CTA */}
      <section style={{ marginBottom: "20px" }}>
        {hasAnyChecked ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "500px" }}>
            <p style={{ fontSize: "15px", color: "#555", marginBottom: "4px", lineHeight: 1.6 }}>
              Chatbotten kan hjælpe dig med at forstå hvad dine markeringer betyder — og om hypnoterapi kunne være relevant for dig.
            </p>
            <a
              href={`/?open=chat&ctx=${buildCtxParam()}`}
              style={{
                display: "inline-block",
                padding: "14px 24px",
                background: "#5a7a8f",
                color: "#fff",
                textDecoration: "none",
                borderRadius: "6px",
                fontWeight: 500,
                fontSize: "16px",
                textAlign: "center",
              }}
            >
              {ctaLabel ?? "Tal med chatbotten om det →"}
            </a>
            <a
              href="/kontakt"
              style={{
                display: "inline-block",
                padding: "12px 24px",
                background: "transparent",
                color: "#5a7a8f",
                textDecoration: "none",
                border: "1px solid #5a7a8f",
                borderRadius: "6px",
                fontWeight: 500,
                fontSize: "15px",
                textAlign: "center",
              }}
            >
              Kontakt Jan direkte →
            </a>
          </div>
        ) : (
          <p style={{ fontSize: "15px", color: "#888", fontStyle: "italic" }}>
            Marker det der rammer dig — så viser vi dig hvad det betyder.
          </p>
        )}
      </section>

      <p style={{ fontSize: "13px", color: "#bbb", marginTop: "16px" }}>
        Dine svar gemmes ikke. Skemaet er udelukkende til din egen refleksion.
      </p>
    </div>
  )
}
