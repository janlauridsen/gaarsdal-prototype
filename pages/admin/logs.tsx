// pages/admin/logs.tsx

import { GetServerSideProps } from "next";
import { redis } from "../../lib/redis";

interface LogEvent {
  eventId: string;
  sessionId: string;
  timestamp: string;
  layer: string;
  eventType: string;
  turn?: number;
  role?: string;
  payload: Record<string, any>;
}

interface Props {
  sessionId: string;
  events: LogEvent[];
}

export default function AdminLogs({ sessionId, events }: Props) {
  return (
    <main
      style={{
        padding: "24px",
        fontFamily: "monospace",
        lineHeight: 1.4,
      }}
    >
      <h1>RMRC · Session Logs</h1>
      <p>
        <strong>Session ID:</strong> {sessionId}
      </p>

      <hr />

      {events.length === 0 && <p>No events found.</p>}

      {events.map((event, index) => (
        <section
          key={event.eventId}
          style={{
            marginBottom: "24px",
            paddingBottom: "16px",
            borderBottom: "1px solid #ddd",
          }}
        >
          <div>
            <strong>#{index + 1}</strong>
          </div>

          <div>
            <strong>Timestamp:</strong> {event.timestamp}
          </div>

          <div>
            <strong>Layer:</strong> {event.layer}
          </div>

          <div>
            <strong>Type:</strong> {event.eventType}
          </div>

          {event.turn !== undefined && (
            <div>
              <strong>Turn:</strong> {event.turn}
            </div>
          )}

          {event.role && (
            <div>
              <strong>Role:</strong> {event.role}
            </div>
          )}

          <details style={{ marginTop: "8px" }}>
            <summary>Payload</summary>
            <pre>{JSON.stringify(event.payload, null, 2)}</pre>
          </details>
        </section>
      ))}
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const sessionId = ctx.query.sessionId as string | undefined;

  if (!sessionId) {
    return { notFound: true };
  }

  const key = `rmrc:session:${sessionId}:events`;
  const rawEvents = (await redis.lrange(key, 0, -1)) ?? [];

  const events: LogEvent[] = rawEvents.map((e) => JSON.parse(e));

  return {
    props: {
      sessionId,
      events,
    },
  };
};
