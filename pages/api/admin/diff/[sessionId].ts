import type { NextApiRequest, NextApiResponse } from "next";
import { runPromptDiff } from "../../../../lib/eval/diff/runPromptDiff";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { sessionId } = req.query;
  if (!sessionId || typeof sessionId !== "string") {
    return res.status(400).json({ error: "Missing sessionId" });
  }

  try {
    const result = await runPromptDiff({ sessionId });
    return res.status(200).json(result);
  } catch (err: any) {
    console.error("diff session error:", err);
    return res.status(500).json({
      error: "Server error",
      details: err?.message ?? String(err),
    });
  }
}
