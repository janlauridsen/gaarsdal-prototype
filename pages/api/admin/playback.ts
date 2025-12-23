// pages/api/admin/playback.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { runBatchPlayback } from "../../../lib/playback/runBatchPlayback";
import screeningPrompt from "../../../prompts/screening-v4.5";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { sessions } = req.body;

  if (!Array.isArray(sessions)) {
    return res.status(400).json({ error: "Missing sessions" });
  }

  try {
    const result = await runBatchPlayback({
      sessions,
      promptId: "screening-v4.5",
      promptText: screeningPrompt,
      model: "gpt-4o-mini",
      temperature: 0.2,
    });

    return res.status(200).json(result);
  } catch (err: any) {
    console.error("Batch playback error:", err);
    return res.status(500).json({
      error: "Server error",
      details: err?.message ?? String(err),
    });
  }
}
