// pages/logsx.tsx
// RMRC logsx v0.1
// Status: Exploratory / Non-normative

import React from "react";
import { Redis } from "@upstash/redis";

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

/**
 * Redis-backed loader
 * Reads seeded testcases from logsx:sessions
 */
async function loadSessions(): Promise<Session[]> {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  const rawSessions = await redis.lrange(
    "logsx:sessions",
    0,
    -1
  );

  return rawSessions.map((item: string) =>
    JSON.parse(item)
  );
}

type Props = {
  sessions: Session[];
};

export default function LogsXPage({ sessions }: Props) {
  return (
    <main
      style={{
        padding: "2rem",
        fontFamily: "monospace",
        maxWidth: "1000px",
      }}
    >
      <h1>RMRC · Extended Logs (logsx)</h1>
      <p>
        <strong>Version:</strong> v0.1 <br />
        <strong>Status:</strong> Exploratory / Non-normative
      </p>

      {sessions.map((session) => (
        <section
          key={session.id}
          style={{ marginBottom: "3rem" }}
        >
          <h2>📁 Session {session.id}</h2>
          <p>
            Board: <strong>{session.board}</strong>
            <br />
            Created: {session.createdAt}
          </p>

          {session.turns.map((turn) => (
            <details
              key={turn.index}
              style={{
                marginBottom: "1rem",
                border: "1px solid #ddd",
                padding: "0.5rem",
              }}
            >
              <summary>TURN {turn.index}</summary>

              <pre>
👤 Input
{turn.input}
              </pre>

              <pre>
🧠 Runtime
Board: {turn.runtime.board}
Context: {turn.runtime.contextStatus}
Roles: {turn.runtime.activeRoles.join(", ")}
              </pre>

              <pre>
🧩 Role outputs
{turn.roleOutputs
  .map(
    (r) =>
      `${r.role}: ${
        r.output ?? "— (no output)"
      }`
  )
  .join("\n")}
              </pre>

              <pre>
🧱 Consolidation
Strategy: {turn.consolidation.strategy}
Navigation: {String(
                  turn.consolidation.navigationInvoked
                )}
Boundary guard: {turn.consolidation.boundaryGuard}
              </pre>

              <pre>
📤 Output
{turn.output ?? "—"}
              </pre>

              <pre>
⚙️ Meta
Ambiguity: {turn.meta.ambiguity}
Silence chosen: {String(
                  turn.meta.silenceChosen
                )}
Context stability: {turn.meta.contextStability}
              </pre>
            </details>
          ))}

          {session.spiral && (
            <section style={{ marginTop: "1.5rem" }}>
              <h3>
                🌀 Session Reflection (Hermeneutic Spiral)
              </h3>
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

export async function getStaticProps() {
  const sessions = await loadSessions();

  return {
    props: { sessions },
  };
}
