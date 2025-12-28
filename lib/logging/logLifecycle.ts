// lib/logging/logLifecycle.ts

import { createLogEvent } from "./createLogEvent";
import { writeLogEvent } from "./writeLogEvent";

export async function logSessionStarted(params: {
  sessionId: string;
  entrypoint: string;
  runtimeProfile: string;
  bootstrapSnapshot: string;
}) {
  const event = createLogEvent({
    sessionId: params.sessionId,
    layer: "session",
    eventType: "session_started",
    payload: {
      entrypoint: params.entrypoint,
      runtimeProfile: params.runtimeProfile,
      bootstrapSnapshot: params.bootstrapSnapshot,
    },
  });

  await writeLogEvent(event);
}

export async function logSessionEnded(params: {
  sessionId: string;
  reason: "hard_stop" | "user_exit" | "system_exit";
}) {
  const event = createLogEvent({
    sessionId: params.sessionId,
    layer: "session",
    eventType: "session_ended",
    payload: {
      reason: params.reason,
    },
  });

  await writeLogEvent(event);
}

