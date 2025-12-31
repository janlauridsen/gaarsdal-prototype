// pages/logsx.tsx
// RMRC logsx v0.2
// Status: Exploratory / Non-normative
// Focus: Readability & structural clarity (no new logic)

import React from "react";
import { Redis } from "@upstash/redis";

// 🔒 Force Node runtime
export const config = {
  runtime: "nodejs",
};

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
        <strong>Version:</strong> v0.2 <br />
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

      {!error && sessions.length === 0 && (
        <p>⚠️ No sessions found in Redis.</p>
      )}

      {sessions.map((session) => (
        <section
          key={session.id}
          style={{
            border: "2px solid #ddd",
            borderRadius: "6px",
            padding: "1.5rem",
            marginBottom: "3rem",
          }}
        >
          {/* SESSION HEADER */}
          <header style={{ marginBottom: "1rem" }}>
            <h2>📁 Session: {session.id}</h2>
            <p>
              <strong>Board:</strong> {session.board} <br />
              <strong>Created:</strong> {session.createdAt} <br />
              <strong>Turns:</strong> {session.turns.length}
            </p>
          </header>

          {/* TURNS */}
          {session.turns.map((turn) => (
            <section
              key={turn.index}
              style={{
                border: "1px solid #ccc",
                borderRadius: "4px",
                padding: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              <h3>TURN {turn.index}</h3>

              <section style={{ marginBottom: "0.75rem" }}>
                <strong>👤 Input</strong>
                <pre>{turn.input}</pre>
              </section>

              <section style={{ marginBottom: "0.75rem" }}>
                <strong>🧠 Runtime</strong>
                <ul>
                  <li>
                    <strong>Board:</strong> {turn.runtime.board}
                  </li>
                  <li>
                    <strong>Context status:</strong>{" "}
                    {turn.runtime.contextStatus}
                  </li>
                  <li>
                    <strong>Active roles:</strong>{" "}
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
                <ul>
                  <li>
                    <strong>Strategy:</strong>{" "}
                    {turn.consolidation.strategy}
                  </li>
                  <li>
                    <strong>Navigation invoked:</strong>{" "}
                    {String(
                      turn.consolidation.navigationInvoked
                    )}
                  </li>
                  <li>
                    <strong>Boundary guard:</strong>{" "}
                    {turn.consolidation.boundaryGuard}
                  </li>
                </ul>
              </section>

              <section style={{ marginBottom: "0.75rem" }}>
                <strong>📤 Output</strong>
                <pre>{turn.output ?? "—"}</pre>
              </section>

              <section>
                <strong>⚙️ Meta</strong>
                <ul>
                  <li>
                    <strong>Ambiguity:</strong>{" "}
                    {turn.meta.ambiguity}
                  </li>
                  <li>
                    <strong>Silence chosen:</strong>{" "}
                    {String(turn.meta.silenceChosen)}
                  </li>
                  <li>
                    <strong>Context stability:</strong>{" "}
                    {turn.meta.contextStability}
                  </li>
                </ul>
              </section>
            </section>
          ))}

          {/* HERMENEUTIC SPIRAL */}
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

export async function getServerSideProps() {
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    const raw = await redis.lrange(
      "logsx:sessions",
      0,
      -1
    );

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
