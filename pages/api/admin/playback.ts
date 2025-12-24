import type { NextApiRequest, NextApiResponse } from "next";

import { getLoggedSession } from "../../../lib/playback/getLoggedSession";
import { runBatchPlayback } from "../../../lib/playback/runBatchPlayback";
import screeningPrompt from "../../../prompts/screening-v4.5";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { sessionIds } = req.body;

  if (!Array.isArray(sessionIds)) {
    return res.status(400).json({ error: "Missing sessionIds" });
  }

  try {
    const sessions = [];

    for (const sessionId of sessionIds) {
      const session = await getLoggedSession(sessionId);
      if (session) sessions.push(session);
    }

    const result = await runBatchPlayback(
      sessions,
      {
        promptId: "screening-v4.5",
        promptText: screeningPrompt,
      }
    );

    return res.status(200).json(result);
  } catch (err: any) {
    console.error("admin playback error:", err);
    return res.status(500).json({
      error: "Server error",
      details: err?.message ?? String(err),
    });
  }
}
