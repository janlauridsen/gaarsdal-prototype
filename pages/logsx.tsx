// pages/logsx.tsx
// RMRC logsx v0.1
// Status: Exploratory / Non-normative

import React from "react";
import { Redis } from "@upstash/redis";

// 🔒 Force Node runtime
export const config = {
  runtime: "nodejs",
};

type Props = {
  sessions: any[];
  error?: string;
};

export default function LogsXPage({ sessions, error }: Props) {
  return (
    <main style={{ padding: "2rem", fontFamily: "monospace", maxWidth: "1000px" }}>
      <h1>RMRC · Extended Logs (logsx)</h1>
      <p>
        <strong>Version:</strong> v0.1 <br />
        <strong>Status:</strong> Exploratory / Non-normative
      </p>

      {error && (
        <pre style={{ color: "red", whiteSpace: "pre-wrap" }}>
          ERROR:
          {"\n"}
          {error}
        </pre>
      )}

      {!error && sessions.length === 0 && (
        <p>⚠️ No sessions found in Redis.</p>
      )}

      {sessions.map((session, i) => (
        <section key={i} style={{ marginBottom: "2rem" }}>
          <pre>{JSON.stringify(session, null, 2)}</pre>
        </section>
      ))}
    </main>
  );
}

export async function getServerSideProps() {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL) {
      throw new Error("UPSTASH_REDIS_REST_URL is undefined");
    }
    if (!process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error("UPSTASH_REDIS_REST_TOKEN is undefined");
    }

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
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
