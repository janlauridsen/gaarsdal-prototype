// pages/api/admin/session/[sessionId].ts

import type { NextApiRequest, NextApiResponse } from "next";
import { createLogEvent } from "../../../../lib/logging/createLogEvent";
import { writeLogEvent } from "../../../../lib/logging/writeLogEvent";
import {
  logSessionStarted,
  logSessionEnded,
} from "../../../../lib/logging/logLifecycle";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { sessionId } = req.query;

  if (!sessionId || typeof sessionId !== "string") {
    return res.status(400).json({ error: "Missing sessionId" });
  }

  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { text } = req.body;

  // Lifecycle start
  await logSessionStarted({
    sessionId,
    entrypoint: "api/admin/session/[sessionId]",
    runtimeProfile: "minimal",
    bootstrapSnapshot: "v2.0-start-RMRC-build-0.1",
  });

  // User input event
  const userEvent = createLogEvent({
    sessionId,
    layer: "session",
    eventType: "user_input",
    turn: 1,
    payload: { text },
  });

  await writeLogEvent(userEvent);

  // Assistant placeholder output
  const assistantEvent = createLogEvent({
    sessionId,
    layer: "session",
    eventType: "assistant_output",
    turn: 1,
    payload: {
      text: "placeholder-response",
    },
  });

  await writeLogEvent(assistantEvent);

  // Lifecycle end (hard stop for now)
  await logSessionEnded({
    sessionId,
    reason: "system_exit",
  });

  res.status(200).json({ ok: true });
}
