// pages/api/admin/session/[sessionId].ts

import type { NextApiRequest, NextApiResponse } from "next";
import { writeLogEvent } from "../../../../lib/logging/writeLogEvent";
import { RMRCLogEvent } from "../../../../lib/logging/logEvent";
import { randomUUID } from "crypto";

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

  const timestamp = new Date().toISOString();

  const userEvent: RMRCLogEvent = {
    eventId: randomUUID(),
    sessionId,
    timestamp,
    layer: "session",
    eventType: "user_input",
    payload: { text },
  };

  await writeLogEvent(userEvent);

  const assistantEvent: RMRCLogEvent = {
    eventId: randomUUID(),
    sessionId,
    timestamp: new Date().toISOString(),
    layer: "session",
    eventType: "assistant_output",
    payload: {
      text: "placeholder-response",
    },
  };

  await writeLogEvent(assistantEvent);

  res.status(200).json({ ok: true });
}
