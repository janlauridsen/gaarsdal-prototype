import type { NextApiRequest, NextApiResponse } from "next";
import { Logger } from "../../rmrc-reference/logs/logger";
import { Orchestrator } from "../../rmrc-reference/core/orchestrator";
import { Session } from "../../rmrc-reference/runtime/session";

type Data =
  | { output: string | null; logs: unknown[] }
  | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { input, profileId } = req.body ?? {};

  if (typeof input !== "string") {
    res.status(400).json({ error: "Missing input" });
    return;
  }

  const runtimeProfile = profileId ?? "reflective_with_boundaries";

  try {
    const logger = new Logger();
    const orchestrator = new Orchestrator(logger);
    const session = new Session(runtimeProfile, orchestrator, logger);

    const output = await session.handleInput(input);
    session.end();

    res.status(200).json({
      output,
      logs: logger.getEvents(),
    });
  } catch (err: any) {
    res.status(500).json({
      error: err?.message ?? "Unknown error",
    });
  }
}
