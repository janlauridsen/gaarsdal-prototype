// pages/logsx.tsx
// RMRC logsx v0.4
// Status: Exploratory / Non-normative
// Focus: Collapsible turns (document-style navigation)

import React from "react";
import { Redis } from "@upstash/redis";

// 🔒 Force Node runtime
export const config = {
  runtime: "nodejs",
};

/* ---------- Types ---------- */

type RoleOutput = {
  role: string;
  output: string | null;
};

type Turn = {
  index: number;
  input: string;
  runtime: {
    board: string;
    contextStatus: string;
    activeRoles: string[];
  };
  roleOutputs: RoleOutput[];
  consolidation: {
    strategy: string;
    navigationInvoked: boolean;
    boundaryGuard: string;
  };
  output: string | null;
  meta: {
    ambiguity: string;
    silenceChosen: boolean;
    contextStability: string;
  };
};

type Session = {
  id: string;
  board: string;
  createdAt: string;
  turns: Turn[];
  spiral?: {
    experience: string;
    reflection: string;
    meta: string;
    adjustment: string;
  };
};

type Props = {
  sessions: Session[];
  error?: string;
};

/* ---------- UI helpers ---------- */

function Badge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "info" | "guard";
}) {
  const colors: Record<string, string> = {
    neutral: "#eee",
    info: "#e8f0ff",
    guard: "#fff0e8",
  };

  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.15rem 0.5rem",
        borderRadius: "4px",
        background: colors[tone],
        fontSize: "0.85rem",
        marginRight: "0.5rem",
        marginBottom: "0.25rem",
      }}
    >
      {label}
    </span>
  );
}

/* ---------- Page ---------- */

export default function LogsXPage({ sessions, error }: Props) {
  return (
    <main
      style={{
        padding: "2rem",
        fontFamily: "monospace",
        maxWidth: "1100px",
        margin: "0 auto",
      }}
    >
      <h1>RMRC · Extended Logs (logsx)</h1>

      <p style={{ color: "#555" }}>
        <strong>Version:</strong> v0.4 <br />
        <strong>Status:</strong> Exploratory / Non-normative <br />
        <strong>Purpose:</strong> Architectural observability
      </p>

      {error && (
        <pre
          style={{
            color: "darkred",
            background: "#ffecec",
            padding: "1rem",
            border: "1px solid #f5c2c2",
            marginBottom: "2rem",
          }}
        >
          ERROR:
          {"\n"}
          {error}
        </pre>
      )}

      {/* ---------- SESSION INDEX ---------- */}
      {sessions.length > 0 && (
        <section
          style={{
            border: "1px solid #ccc",
            padding: "1rem",
            marginBottom: "2rem",
          }}
        >
          <h2>🧭 Session Index</h2>
          <ul>
            {sessions.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`}>{s.id}</a> — {s.board},{" "}
                {s.turns.length} turn(s)
              </li>
            ))}
          </ul>
        </section>
      )}

      {sessions.length === 0 && !error && (
        <p>⚠️ No sessions found in Redis.</p>
      )}

      {/* ---------- SESSIONS ---------- */}
      {sessions.map((session) => (
        <section
          key={session.id}
          id={session.id}
          style={{
            border: "2px solid #ddd",
            borderRadius: "6px",
            padding: "1.5rem",
            marginBottom: "3rem",
          }}
        >
          <header style={{ marginBottom: "1rem" }}>
            <h2>📁 Session: {session.id}</h2>
            <p>
              <Badge label={`Board: ${session.board}`} tone="info" />
              <Badge label={`${session.turns.length} turn(s)`} />
            </p>
            <p>
              <strong>Created:</strong> {session.createdAt}
            </p>
          </header>

          {/* ---------- COLLAPSIBLE TURNS ---------- */}
          {session.turns.map((turn, idx) => (
            <details
              key={turn.index}
              open={idx === 0}
              style={{
                border: "1px solid #ccc",
                borderRadius: "4px",
                padding: "0.75rem 1rem",
                marginBottom: "1rem",
              }}
            >
              <summary
                style={{
                  cursor: "pointer",
                  fontWeight: "bold",
                  marginBottom: "0.5rem",
                }}
              >
                TURN {turn.index}
              </summary>

              <section style={{ marginBottom: "0.75rem" }}>
                <strong>👤 Input</strong>
                <pre>{turn.input}</pre>
              </section>

              <section style={{ marginBottom: "0.75rem" }}>
                <strong>🧠 Runtime</strong>
                <ul>
                  <li>Board: {turn.runtime.board}</li>
                  <li>
                    Context status: {turn.runtime.contextStatus}
                  </li>
                  <li>
                    Active roles:{" "}
                    {turn.runtime.activeRoles.join(", ")}
                  </li>
                </ul>
              </section>

              <section style={{ marginBottom: "0.75rem" }}>
                <strong>🪞 Role outputs</strong>
                <ul>
                  {turn.roleOutputs.map((r, i) => (
                    <li key={i}>
                      <strong>{r.role}:</strong>{" "}
                      {r.output ?? "—"}
                    </li>
                  ))}
                </ul>
              </section>

              <section style={{ marginBottom: "0.75rem" }}>
                <strong>🧱 Consolidation</strong>
                <p>
                  <Badge
                    label={`Strategy: ${turn.consolidation.strategy}`}
                  />
                  <Badge
                    label={`Boundary: ${turn.consolidation.boundaryGuard}`}
                    tone="guard"
                  />
                </p>
              </section>

              <section style={{ marginBottom: "0.75rem" }}>
                <strong>📤 Output</strong>
                <pre>{turn.output ?? "—"}</pre>
              </section>

              <section>
                <strong>⚙️ Meta</strong>
                <p>
                  <Badge
                    label={`Ambiguity: ${turn.meta.ambiguity}`}
                  />
                  <Badge
                    label={`Silence: ${turn.meta.silenceChosen}`}
                  />
                  <Badge
                    label={`Context: ${turn.meta.contextStability}`}
                  />
                </p>
              </section>
            </details>
          ))}

          {/* ---------- HERMENEUTIC SPIRAL ---------- */}
          {session.spiral && (
            <section
              style={{
                borderTop: "2px dashed #ccc",
                paddingTop: "1rem",
                marginTop: "1.5rem",
              }}
            >
              <h3>🌀 Session Reflection (Hermeneutic Spiral)</h3>
              <ul>
                <li>
                  <strong>Oplevelse:</strong>{" "}
                  {session.spiral.experience}
                </li>
                <li>
                  <strong>Refleksion:</strong>{" "}
                  {session.spiral.reflection}
                </li>
                <li>
                  <strong>Meta:</strong>{" "}
                  {session.spiral.meta}
                </li>
                <li>
                  <strong>Justering:</strong>{" "}
                  {session.spiral.adjustment}
                </li>
              </ul>
            </section>
          )}
        </section>
      ))}
    </main>
  );
}

/* ---------- Data loader ---------- */

export async function getServerSideProps() {
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    const raw = await redis.lrange("logsx:sessions", 0, -1);

    const sessions = raw.map((item: any) =>
      typeof item === "string" ? JSON.parse(item) : item
    );

    return {
      props: { sessions },
    };
  } catch (err: any) {
    return {
      props: {
        sessions: [],
        error: err?.stack || err?.message || String(err),
      },
    };
  }
}
