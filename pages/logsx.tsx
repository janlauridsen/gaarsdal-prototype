// pages/logsx.tsx
// RMRC logsx v0.1 – DEBUG SAFE

import React from "react";
import { Redis } from "@upstash/redis";

export const config = {
  runtime: "nodejs",
};

type Props = {
  sessions: any[];
  error?: string;
};

export default function LogsXPage({ sessions, error }: Props) {
  return (
    <main style={{ padding: "2rem", fontFamily: "monospace" }}>
      <h1>RMRC · Extended Logs (logsx)</h1>

      {error && (
        <pre style={{ color: "red", whiteSpace: "pre-wrap" }}>
          ERROR:
          {"\n"}
          {error}
        </pre>
      )}

      {!error && sessions.length === 0 && (
        <p>No sessions found.</p>
      )}

      {sessions.map((s, i) => (
        <pre key={i}>{JSON.stringify(s, null, 2)}</pre>
      ))}
    </main>
  );
}

export async function getServerSideProps() {
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    if (!process.env.UPSTASH_REDIS_REST_URL) {
      throw new Error("UPSTASH_REDIS_REST_URL is undefined");
    }

    if (!process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error("UPSTASH_REDIS_REST_TOKEN is undefined");
    }

    const raw = await redis.lrange("logsx:sessions", 0, -1);

    const sessions = raw.map((r: string) => JSON.parse(r));

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
