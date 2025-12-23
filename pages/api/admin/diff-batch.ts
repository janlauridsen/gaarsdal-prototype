import type { NextApiRequest, NextApiResponse } from "next";
import { runPromptDiff } from "../../../lib/eval/runPromptDiff";
import { evalBatch } from "../../../lib/eval/evalBatch";

/**
 * Query params:
 *  ?base=screening-v4.4
 *  ?compare=screening-v4.5
 *  ?sessions=id1,id2,id3
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { base, compare, sessions } = req.query;

  if (
    typeof base !== "string" ||
    typeof compare !== "string" ||
    typeof sessions !== "string"
  ) {
    return res.status(400).json({
      error: "Missing base, compare or sessions",
    });
  }

  const sessionIds = sessions.split(",").filter(Boolean);

  try {
    const diff = await runPromptDiff({
      sessionIds,
      base: { promptVersion: base, model: "gpt-4o-mini" },
      compare: { promptVersion: compare, model: "gpt-4o-mini" },
    });

    const batchEval = evalBatch(
      diff.sessions.map((s) => s.compare.replay)
    );

    return res.status(200).json({
      meta: {
        base,
        compare,
        totalSessions: sessionIds.length,
      },
      eval: batchEval,
    });
  } catch (err: any) {
    console.error("Admin diff batch error:", err);
    return res.status(500).json({
      error: "Server error",
      details: err?.message ?? String(err),
    });
  }
}
