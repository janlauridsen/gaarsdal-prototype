// pages/ttm-test.tsx
// TTM Test Runner — kør AI-drevne tests mod /api/talk-to-me-chat
// Understøtter model-sammenligning

import Head from "next/head"
import { useState, useCallback } from "react"

// ─── Types ─────────────────────────────────────────────────────────────────────

type CriterionResult = {
  criterion: string
  passed: boolean
  reasoning: string
}

type Turn = {
  turn: number
  user: string
  bot: string
  move?: string
}

type TestResult = {
  id: string
  description: string
  model: string
  passed: boolean
  turns: number
  error?: string
  passCriteria: CriterionResult[]
  moveCriteria: CriterionResult[]
  moveDistribution: Record<string, number>
  summary: string
  transcript: Turn[]
}

type RunResult = {
  total: number
  passed: number
  failed: number
  model: string
  results: TestResult[]
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const S = {
  bg: "#111111",
  surface: "#1a1a1a",
  border: "#2d2d2d",
  text: "#cccccc",
  muted: "#888888",
  dim: "#555555",
  accent: "#c4a97d",
  green: { bg: "#0f2b15", text: "#5aad72", border: "#1a4a25" },
  red:   { bg: "#2b0f0f", text: "#e06060", border: "#4a1a1a" },
  amber: { bg: "#2a2010", text: "#d4a264", border: "#4a3a18" },
}

const MOVE_COLORS: Record<string, { bg: string; text: string }> = {
  STAY:               { bg: "#0f2b15", text: "#5aad72" },
  COMPLEX_REFLECTION: { bg: "#0f1f2b", text: "#5a9aad" },
  PATTERN:            { bg: "#2a1f2b", text: "#c45aad" },
  REFRAME:            { bg: "#2a2010", text: "#d4a264" },
  INVITE:             { bg: "#1a1f0f", text: "#8aad5a" },
  QUESTION:           { bg: "#1f1f1f", text: "#888888" },
  UNKNOWN:            { bg: "#1a1a1a", text: "#555555" },
}

const MODELS = [
  "gpt-4.1-mini",
  "gpt-4o-mini",
  "gpt-4.1",
  "gpt-4o",
]

const TEST_IDS = [
  { id: "", label: "Alle tests" },
  { id: "ttm-01-rutine-forandring",    label: "ttm-01 Rutine/forandring" },
  { id: "ttm-02-relation-partner",     label: "ttm-02 Relation/partner" },
  { id: "ttm-03-kort-input",           label: "ttm-03 Korte svar" },
  { id: "ttm-04-ingen-spgsml-dominans",label: "ttm-04 Move-variation" },
  { id: "ttm-05-krise-redirect",       label: "ttm-05 Krise" },
]

// ─── Components ────────────────────────────────────────────────────────────────

function Badge({ passed }: { passed: boolean }) {
  const s = passed ? S.green : S.red
  return (
    <span style={{ fontSize: 12, padding: "2px 10px", borderRadius: 12, background: s.bg, color: s.text, border: `1px solid ${s.border}`, fontWeight: 500 }}>
      {passed ? "✓ Bestået" : "✗ Fejlet"}
    </span>
  )
}

function MoveBadge({ move, count }: { move: string; count?: number }) {
  const c = MOVE_COLORS[move] ?? MOVE_COLORS.UNKNOWN
  return (
    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: c.bg, color: c.text, whiteSpace: "nowrap" as const }}>
      {move}{count !== undefined ? ` ×${count}` : ""}
    </span>
  )
}

function CriteriaList({ items, label }: { items: CriterionResult[]; label: string }) {
  if (!items.length) return null
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: S.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{label}</div>
      {items.map((c, i) => (
        <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
          <span style={{ fontSize: 14, color: c.passed ? S.green.text : S.red.text, flexShrink: 0, marginTop: 1 }}>
            {c.passed ? "✓" : "✗"}
          </span>
          <div>
            <div style={{ fontSize: 13, color: S.text, marginBottom: 2 }}>{c.criterion}</div>
            <div style={{ fontSize: 12, color: S.muted, fontStyle: "italic" }}>{c.reasoning}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function TranscriptView({ turns }: { turns: Turn[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {turns.map((t) => (
        <div key={t.turn}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
            <div style={{ maxWidth: "80%", padding: "8px 12px", borderRadius: 12, borderBottomRightRadius: 3, background: "#33291e", color: "#e8dcc8", fontSize: 13, lineHeight: 1.6 }}>
              {t.user}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <div style={{ maxWidth: "80%", padding: "8px 12px", borderRadius: 12, borderBottomLeftRadius: 3, background: "#252018", color: "#c8bc9e", fontSize: 13, lineHeight: 1.6 }}>
              {t.bot}
            </div>
            {t.move && <MoveBadge move={t.move} />}
          </div>
        </div>
      ))}
    </div>
  )
}

function TestCard({ result }: { result: TestResult }) {
  const [open, setOpen] = useState(false)
  const questionCount = result.moveDistribution["QUESTION"] ?? 0
  const totalMoves = Object.values(result.moveDistribution).reduce((a, b) => a + b, 0)
  const questionPct = totalMoves > 0 ? Math.round((questionCount / totalMoves) * 100) : 0

  return (
    <div style={{ background: S.surface, borderRadius: 12, border: `1px solid ${S.border}`, overflow: "hidden", marginBottom: 12 }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, flexWrap: "wrap" as const }}>
          <Badge passed={result.passed} />
          <div>
            <div style={{ fontSize: 14, color: S.text, fontWeight: 500 }}>{result.id}</div>
            <div style={{ fontSize: 12, color: S.muted, marginTop: 2 }}>{result.description}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" as const }}>
          <span style={{ fontSize: 12, color: S.muted }}>{result.turns} turns</span>
          <span style={{ fontSize: 12, color: questionPct > 50 ? S.red.text : S.green.text }}>
            {questionPct}% spørgsmål
          </span>
          <span style={{ fontSize: 14, color: S.dim }}>{open ? "▲" : "▼"}</span>
        </div>
      </div>

      {open && (
        <div style={{ borderTop: `1px solid ${S.border}`, padding: "16px 20px" }}>

          {/* Summary */}
          <div style={{ padding: "10px 14px", background: result.passed ? S.green.bg : S.red.bg, borderRadius: 8, marginBottom: 20, fontSize: 13, color: result.passed ? S.green.text : S.red.text, border: `1px solid ${result.passed ? S.green.border : S.red.border}` }}>
            {result.summary || result.error || "—"}
          </div>

          {/* Move distribution */}
          {Object.keys(result.moveDistribution).length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: S.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Move-fordeling</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                {Object.entries(result.moveDistribution)
                  .sort((a, b) => b[1] - a[1])
                  .map(([move, count]) => (
                    <MoveBadge key={move} move={move} count={count} />
                  ))}
              </div>
            </div>
          )}

          <CriteriaList items={result.passCriteria} label="Pass-kriterier" />
          <CriteriaList items={result.moveCriteria} label="Move-kriterier" />

          {/* Transcript */}
          <div>
            <div style={{ fontSize: 11, color: S.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Transcript</div>
            <TranscriptView turns={result.transcript} />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function TtmTestPage() {
  const [token, setToken] = useState("")
  const [tokenInput, setTokenInput] = useState("")
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState(false)

  const [selectedTest, setSelectedTest] = useState("")
  const [selectedModel, setSelectedModel] = useState("gpt-4.1-mini")
  const [compareModel, setCompareModel] = useState("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<RunResult | null>(null)
  const [compareResult, setCompareResult] = useState<RunResult | null>(null)

  function auth() {
    if (!tokenInput.trim()) return
    setToken(tokenInput.trim())
    setAuthed(true)
    setAuthError(false)
  }

  const runTest = useCallback(async (model: string, setRes: (r: RunResult) => void) => {
    setError(null)
    const idParam = selectedTest ? `&id=${encodeURIComponent(selectedTest)}` : ""
    const url = `/api/admin/ttm-test?token=${encodeURIComponent(token)}&model=${encodeURIComponent(model)}${idParam}`
    const res = await fetch(url)
    if (res.status === 401) { setAuthError(true); setAuthed(false); return }
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      throw new Error(j.error ?? `HTTP ${res.status}`)
    }
    const data: RunResult = await res.json()
    setRes(data)
  }, [token, selectedTest])

  async function handleRun() {
    setLoading(true)
    setResult(null)
    setCompareResult(null)
    try {
      await runTest(selectedModel, setResult)
      if (compareModel && compareModel !== selectedModel) {
        await runTest(compareModel, setCompareResult)
      }
    } catch (e: any) {
      setError(e.message ?? "Ukendt fejl")
    } finally {
      setLoading(false)
    }
  }

  // ── Login ──────────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: S.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Head><title>TTM Test Runner</title></Head>
        <div style={{ background: S.surface, borderRadius: 12, padding: 40, width: "100%", maxWidth: 360 }}>
          <div style={{ fontSize: 11, color: S.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Gaarsdal</div>
          <div style={{ fontSize: 22, fontWeight: 500, color: S.text, marginBottom: 24 }}>TTM Test Runner</div>
          {authError && <div style={{ background: S.red.bg, color: S.red.text, fontSize: 14, padding: "10px 14px", borderRadius: 8, marginBottom: 16 }}>Forkert token</div>}
          <input
            type="password"
            placeholder="Admin token"
            value={tokenInput}
            onChange={e => setTokenInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && auth()}
            style={{ width: "100%", padding: "10px 14px", background: S.bg, border: `1px solid ${S.border}`, borderRadius: 8, fontSize: 15, color: S.text, outline: "none", boxSizing: "border-box", fontFamily: "inherit", marginBottom: 12 }}
            autoFocus
          />
          <button
            onClick={auth}
            style={{ width: "100%", padding: "10px 0", background: S.accent, color: "#1a1610", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
          >
            Log ind
          </button>
        </div>
      </div>
    )
  }

  // ── Main UI ────────────────────────────────────────────────────────────────
  const bothResults = result && compareResult

  return (
    <div style={{ minHeight: "100vh", background: S.bg, padding: "32px 24px" }}>
      <Head><title>TTM Test Runner</title></Head>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, color: S.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Gaarsdal · Talk To Me</div>
          <div style={{ fontSize: 24, fontWeight: 500, color: S.text }}>Test Runner</div>
        </div>

        {/* Controls */}
        <div style={{ background: S.surface, borderRadius: 12, padding: "20px 24px", marginBottom: 24, border: `1px solid ${S.border}` }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const, alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: 11, color: S.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Test</div>
              <select
                value={selectedTest}
                onChange={e => setSelectedTest(e.target.value)}
                style={{ background: S.bg, border: `1px solid ${S.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: S.text, fontFamily: "inherit", outline: "none" }}
              >
                {TEST_IDS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>

            <div>
              <div style={{ fontSize: 11, color: S.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Model</div>
              <select
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                style={{ background: S.bg, border: `1px solid ${S.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: S.text, fontFamily: "inherit", outline: "none" }}
              >
                {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div>
              <div style={{ fontSize: 11, color: S.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Sammenlign med (valgfrit)</div>
              <select
                value={compareModel}
                onChange={e => setCompareModel(e.target.value)}
                style={{ background: S.bg, border: `1px solid ${S.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: S.text, fontFamily: "inherit", outline: "none" }}
              >
                <option value="">Ingen sammenligning</option>
                {MODELS.filter(m => m !== selectedModel).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <button
              onClick={handleRun}
              disabled={loading}
              style={{ padding: "9px 24px", background: loading ? S.border : S.accent, color: loading ? S.muted : "#1a1610", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap" as const }}
            >
              {loading ? "Kører…" : "Kør test ↗"}
            </button>
          </div>

          {loading && (
            <div style={{ marginTop: 16, fontSize: 13, color: S.muted }}>
              Kører samtaler og evaluerer… dette tager typisk 30-60 sekunder per test.
            </div>
          )}
        </div>

        {error && (
          <div style={{ background: S.red.bg, color: S.red.text, padding: "12px 16px", borderRadius: 8, marginBottom: 20, fontSize: 14, border: `1px solid ${S.red.border}` }}>
            {error}
          </div>
        )}

        {/* Resultater */}
        {bothResults ? (
          // Side-by-side sammenligning
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {[result, compareResult].map((r, i) => r && (
              <div key={i}>
                <div style={{ fontSize: 13, color: S.accent, fontWeight: 500, marginBottom: 12, textAlign: "center" }}>
                  {r.model} — {r.passed}/{r.total} bestået
                </div>
                {r.results.map(res => <TestCard key={res.id} result={res} />)}
              </div>
            ))}
          </div>
        ) : result ? (
          // Enkelt resultat
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: S.muted }}>Model: <span style={{ color: S.accent }}>{result.model}</span></div>
              <div style={{ fontSize: 13, color: result.passed === result.total ? S.green.text : S.red.text, fontWeight: 500 }}>
                {result.passed}/{result.total} bestået
              </div>
              <div style={{ fontSize: 13, color: S.muted }}>{result.results.reduce((a, r) => a + r.turns, 0)} turns i alt</div>
            </div>
            {result.results.map(res => <TestCard key={res.id} result={res} />)}
          </div>
        ) : null}

      </div>
    </div>
  )
}
