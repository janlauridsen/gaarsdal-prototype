// pages/api/admin/session/[sessionId].ts

import type { NextApiRequest, NextApiResponse } from "next";
import {
  logSessionStarted,
  logSessionEnded,
} from "../../../../lib/logging/logLifecycle";
import { createLogEvent } from "../../../../lib/logging/createLogEvent";
import { writeLogEvent } from "../../../../lib/logging/writeLogEvent";
import { getNextTurn } from "../../../../lib/logging/getNextTurn";

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

  // Start session (idempotens håndteres eksternt)
  await logSessionStarted({
    sessionId,
    entrypoint: "api/admin/session/[sessionId]",
    runtimeProfile: "minimal",
    bootstrapSnapshot: "v2.0-start-RMRC-build-0.1",
  });

  const turn = await getNextTurn(sessionId);

  const userEvent = createLogEvent({
    sessionId,
    layer: "session",
    eventType: "user_input",
    turn,
    payload: { text },
  });

  await writeLogEvent(userEvent);

  const assistantEvent = createLogEvent({
    sessionId,
    layer: "session",
    eventType: "assistant_output",
    turn,
    payload: {
      text: "placeholder-response",
    },
  });

  await writeLogEvent(assistantEvent);

  // Hard stop for nu
  await logSessionEnded({
    sessionId,
    reason: "system_exit",
  });

  res.status(200).json({ ok: true });
}
