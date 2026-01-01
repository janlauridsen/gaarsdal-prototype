// pages/logsx.tsx
// RMRC · Extended Logs (logsx)
// Version: v0.4
// Status: Exploratory / Non-normative
// Purpose: Architectural observability (read-only)

import React from "react";
import { Redis } from "@upstash/redis";
import { GetServerSideProps } from "next";

type RoleOutput = {
  role: string;
  output: string | null;
};

type Turn = {
  index: number;
  input: string;
  runtime: {
    board: string;
    activeRoles: string[];
  };
  roleOutputs?: RoleOutput[];
  consolidation?: {
    strategy: string;
    navigationInvoked: boolean;
    boundaryGuard: string;
  };
  output?: string | null;
  meta?: {
    ambiguity: string;
    silenceChosen: boolean;
    contextStability: string;
  };
};

type EvaluationNote = {
  level: "note" | "warn";
  message: string;
};

type Session = {
  id: string;
  source?: string;
  archetype?: string;
  parameters?: Record<string, any>;
  board?: string;
  createdAt: string;
  turns: Turn[];
  evaluation?: EvaluationNote[];
  spiral?: {
    experience: string;
    reflection: string;
    meta: string;
    adjustment: string;
  };
};

type Props = {
  sessions: Session[];
  selectedSessionId?: string | null;
};

export default function LogsXPage({
  sessions,
  selectedSessionId,
}: Props) {
  const selected =
    selectedSessionId &&
    sessions.find((s) => s.id === selectedSessionId);

  return (
    <main
      style={{
        padding: "2rem",
        maxWidth: "1100px",
        fontFamily: "monospace",
      }}
    >
      <h1>RMRC · Extended Logs (logsx)</h1>
      <p>
        <strong>Version:</strong> v0.4 <br />
        <strong>Status:</strong> Exploratory / Non-normative <br />
        <strong>Purpose:</strong> Architectural observability
      </p>

      {/* SESSION INDEX */}
      <section style={{ marginTop: "2rem" }}>
        <h2>🧭 Session Index</h2>
        {sessions.length === 0 && (
          <p>⚠️ No sessions found.</p>
        )}
        <ul>
          {sessions.map((s) => (
            <li key={s.id}>
              <a href={`/logsx?session=${s.id}`}>
                {s.id}
              </a>{" "}
              — {s.archetype ?? "n/a"},{" "}
              {s.turns.length} turn(s)
            </li>
          ))}
        </ul>
      </section>

      {/* SELECTED SESSION */}
      {selected && (
        <section style={{ marginTop: "3rem" }}>
          <h2>📁 Session: {selected.id}</h2>
          <p>
            <strong>Source:</strong>{" "}
            {selected.source ?? "unknown"}
            <br />
            <strong>Archetype:</strong>{" "}
            {selected.archetype ?? "n/a"}
            <br />
            <strong>Created:</strong>{" "}
            {selected.createdAt}
          </p>

          {selected.parameters && (
            <details style={{ marginBottom: "1.5rem" }}>
              <summary>⚙️ Parameters</summary>
              <pre>
                {JSON.stringify(
                  selected.parameters,
                  null,
                  2
                )}
              </pre>
            </details>
          )}

          {/* TURNS */}
          {selected.turns.map((turn) => (
            <details
              key={turn.index}
              style={{
                marginBottom: "1rem",
                border: "1px solid #ddd",
                padding: "0.75rem",
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
Roles: {turn.runtime.activeRoles.join(", ")}
              </pre>

              {turn.roleOutputs && (
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
              )}

              {turn.consolidation && (
                <pre>
🧱 Consolidation
Strategy: {turn.consolidation.strategy}
Navigation:{" "}
{String(
  turn.consolidation.navigationInvoked
)}
Boundary:{" "}
{turn.consolidation.boundaryGuard}
                </pre>
              )}

              <pre>
📤 Output
{turn.output ?? "—"}
              </pre>

              {turn.meta && (
                <pre>
⚙️ Meta
Ambiguity: {turn.meta.ambiguity}
Silence:{" "}
{String(turn.meta.silenceChosen)}
Context:{" "}
{turn.meta.contextStability}
                </pre>
              )}
            </details>
          ))}

          {/* POST-ROLE EVALUATION */}
          {selected.evaluation && (
            <section style={{ marginTop: "2rem" }}>
              <h3>🧪 Post-role evaluation</h3>
              <ul>
                {selected.evaluation.map(
                  (e, i) => (
                    <li key={i}>
                      [{e.level.toUpperCase()}]{" "}
                      {e.message}
                    </li>
                  )
                )}
              </ul>
            </section>
          )}

          {/* HERMENEUTIC SPIRAL */}
          {selected.spiral && (
            <section style={{ marginTop: "2rem" }}>
              <h3>
                🌀 Session Reflection (Hermeneutic
                Spiral)
              </h3>
              <ul>
                <li>
                  <strong>Oplevelse:</strong>{" "}
                  {selected.spiral.experience}
                </li>
                <li>
                  <strong>Refleksion:</strong>{" "}
                  {selected.spiral.reflection}
                </li>
                <li>
                  <strong>Meta:</strong>{" "}
                  {selected.spiral.meta}
                </li>
                <li>
                  <strong>Justering:</strong>{" "}
                  {selected.spiral.adjustment}
                </li>
              </ul>
            </section>
          )}
        </section>
      )}
    </main>
  );
}

export const getServerSideProps: GetServerSideProps =
  async (context) => {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token:
        process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    const raw =
      (await redis.lrange(
        "logsx:sessions",
        0,
        -1
      )) as any[];

    const sessions: Session[] = raw
      .map((item) =>
        typeof item === "string"
          ? JSON.parse(item)
          : item
      )
      .reverse(); // newest first

    const selectedSessionId =
      typeof context.query.session === "string"
        ? context.query.session
        : null;

    return {
      props: {
        sessions,
        selectedSessionId,
      },
    };
  };
