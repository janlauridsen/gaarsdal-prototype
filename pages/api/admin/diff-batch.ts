import type { NextApiRequest, NextApiResponse } from "next";

import { runPromptDiff } from "../../../lib/eval/diff/runPromptDiff";

/**
 * Admin endpoint:
 * Sammenligner batch-evalueringer mellem to prompt-versioner
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const result = await runPromptDiff(req.body);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error("diff-batch error:", err);
    return res.status(500).json({
      error: "Server error",
      details: err?.message ?? String(err),
    });
  }
}
