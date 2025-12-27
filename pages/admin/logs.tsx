// pages/admin/logs.tsx

import { GetServerSideProps } from "next";
import { redis } from "../../lib/redis";

interface Props {
  sessionId: string;
  events: string[];
}

export default function AdminLogs({ sessionId, events }: Props) {
  return (
    <main style={{ padding: 24, fontFamily: "monospace" }}>
      <h1>RMRC · Session Logs</h1>
      <p>Session ID: {sessionId}</p>

      <pre>
        {events.map((e, i) => (
          <div key={i}>{e}</div>
        ))}
      </pre>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const sessionId = ctx.query.sessionId as string;

  if (!sessionId) {
    return { notFound: true };
  }

  const key = `rmrc:session:${sessionId}:events`;
  const events = (await redis.lrange(key, 0, -1)) ?? [];

  return {
    props: {
      sessionId,
      events,
    },
  };
};
