// pages/compare.tsx
// RMRC · Governance Compare v0.1
// Purpose: Human comparison of two sessions (read-only)

import { GetServerSideProps } from "next";
import { Redis } from "@upstash/redis";
import React from "react";

type Turn = {
  index: number;
  input: string;
  runtime: { board: string; activeRoles: string[] };
  output?: string | null;
  consolidation?: {
    strategy: string;
    navigationInvoked: boolean;
    boundaryGuard: string;
  };
  meta?: {
    ambiguity: string;
    silenceChosen: boolean;
    contextStability: string;
  };
};

type Session = {
  id: string;
  source?: string;
  archetype?: string;
  parameters?: Record<string, any>;
  createdAt: string;
  turns: Turn[];
  evaluation?: { level: "note" | "warn"; message: string }[];
};

type Props = {
  a?: Session | null;
  b?: Session | null;
  allIds: string[];
};

export default function ComparePage({ a, b, allIds }: Props) {
  return (
    <main style={{ padding: "2rem", fontFamily: "monospace" }}>
      <h1>RMRC · Governance Compare</h1>
      <p>
        <strong>Status:</strong> Read-only · Human decision
      </p>

      <section style={{ marginTop: "1rem" }}>
        <p>Select two sessions via URL:</p>
        <pre>/compare?a=&lt;idA&gt;&amp;b=&lt;idB&gt;</pre>
        <details>
          <summary>Available session IDs</summary>
          <ul>
            {allIds.map((id) => (
              <li key={id}>{id}</li>
            ))}
          </ul>
        </details>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
          marginTop: "2rem",
        }}
      >
        <SessionColumn title="A (baseline)" s={a} />
        <SessionColumn title="B (candidate)" s={b} />
      </section>
    </main>
  );
}

function SessionColumn({
  title,
  s,
}: {
  title: string;
  s?: Session | null;
}) {
  if (!s) {
    return (
      <div style={{ border: "1px solid #ccc", padding: "1rem" }}>
        <h2>{title}</h2>
        <p>— not selected —</p>
      </div>
    );
  }

  return (
    <div style={{ border: "1px solid #ccc", padding: "1rem" }}>
      <h2>{title}</h2>
      <p>
        <strong>ID:</strong> {s.id}
        <br />
        <strong>Source:</strong> {s.source ?? "n/a"}
        <br />
        <strong>Archetype:</strong> {s.archetype ?? "n/a"}
        <br />
        <strong>Created:</strong> {s.createdAt}
      </p>

      {s.parameters && (
        <details>
          <summary>⚙️ Parameters</summary>
          <pre>{JSON.stringify(s.parameters, null, 2)}</pre>
        </details>
      )}

      <h3>Turns</h3>
      {s.turns.map((t) => (
        <details key={t.index} style={{ marginBottom: "0.5rem" }}>
          <summary>TURN {t.index}</summary>
          <pre>Input: {t.input}</pre>
          <pre>
Roles: {t.runtime.activeRoles.join(", ")}
          </pre>
          <pre>Output: {t.output ?? "—"}</pre>
          {t.consolidation && (
            <pre>
Consolidation:
- strategy: {t.consolidation.strategy}
- navigation: {String(
              t.consolidation.navigationInvoked
            )}
- boundary: {t.consolidation.boundaryGuard}
            </pre>
          )}
          {t.meta && (
            <pre>
Meta:
- ambiguity: {t.meta.ambiguity}
- silence: {String(t.meta.silenceChosen)}
- context: {t.meta.contextStability}
            </pre>
          )}
        </details>
      ))}

      {s.evaluation && (
        <>
          <h3>Post-role evaluation</h3>
          <ul>
            {s.evaluation.map((e, i) => (
              <li key={i}>
                [{e.level.toUpperCase()}] {e.message}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (
  ctx
) => {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  const raw = (await redis.lrange(
    "logsx:sessions",
    0,
    -1
  )) as any[];

  const sessions: Session[] = raw.map((x) =>
    typeof x === "string" ? JSON.parse(x) : x
  );

  const byId = Object.fromEntries(
    sessions.map((s) => [s.id, s])
  );

  const aId =
    typeof ctx.query.a === "string" ? ctx.query.a : null;
  const bId =
    typeof ctx.query.b === "string" ? ctx.query.b : null;

  return {
    props: {
      a: aId ? byId[aId] ?? null : null,
      b: bId ? byId[bId] ?? null : null,
      allIds: sessions.map((s) => s.id),
    },
  };
};
