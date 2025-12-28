// pages/api/admin/session/[sessionId].ts

import type { NextApiRequest, NextApiResponse } from "next";
import {
  logSessionStarted,
  logSessionEnded,
} from "../../../../lib/logging/logLifecycle";
import { runSessionTurn } from "../../../../lib/runtime/runSessionTurn";

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

  await logSessionStarted({
    sessionId,
    entrypoint: "api/admin/session/[sessionId]",
    runtimeProfile: "minimal",
    bootstrapSnapshot: "RMRC_LOGGING_AND_ADMIN_CORE",
  });

  await runSessionTurn({
    sessionId,
    userText: text ?? "",
  });

  await logSessionEnded({
    sessionId,
    reason: "system_exit",
  });

  res.status(200).json({ ok: true });
}
