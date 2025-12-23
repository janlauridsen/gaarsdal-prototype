import type { NextApiRequest, NextApiResponse } from "next";
import { runPromptDiff } from "../../../../lib/eval/runPromptDiff";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { sessionId, base, compare } = req.query;

  if (
    typeof sessionId !== "string" ||
    typeof base !== "string" ||
    typeof compare !== "string"
  ) {
    return res.status(400).json({
      error: "Missing sessionId, base or compare",
    });
  }

  try {
    const result = await runPromptDiff({
      sessionIds: [sessionId],
      base: {
        promptVersion: base,
        model: "gpt-4o-mini",
      },
      compare: {
        promptVersion: compare,
        model: "gpt-4o-mini",
      },
    });

    return res.status(200).json(result.sessions[0]);
  } catch (err: any) {
    console.error("Admin diff error:", err);
    return res.status(500).json({
      error: "Server error",
      details: err?.message ?? String(err),
    });
  }
}
