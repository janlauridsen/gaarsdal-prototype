// pages/api/admin/diff/[sessionId].ts
import type { NextApiRequest, NextApiResponse } from "next";

import { getLoggedSession } from "../../../../lib/playback/getLoggedSession";
import { runPlaybackSession } from "../../../../lib/playback/runPlaybackSession";
import { runSessionDiff } from "../../../../lib/eval/diff/runSessionDiff";
import screeningPrompt from "../../../../prompts/screening-v4.5";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { sessionId } = req.query;

  if (!sessionId || typeof sessionId !== "string") {
    return res.status(400).json({ error: "Missing sessionId" });
  }

  try {
    /* ----------------------------------
       LOAD LOGGED SESSION
    ---------------------------------- */
    const session = await getLoggedSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    /* ----------------------------------
       PLAYBACK (SILENT)
    ---------------------------------- */
    const replay = runPlaybackSession(
      session,
      screeningPrompt
    );

    /* ----------------------------------
       DIFF (session mod sig selv – baseline)
       → klar til senere compare
    ---------------------------------- */
    const result = await runSessionDiff({
      base: replay,
      compare: replay,
    });

    return res.status(200).json(result);
  } catch (err: any) {
    console.error("diff session error:", err);
    return res.status(500).json({
      error: "Server error",
      details: err?.message ?? String(err),
    });
  }
}
