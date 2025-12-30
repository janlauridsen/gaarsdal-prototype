import type { NextApiRequest, NextApiResponse } from "next";
import { LogEvent } from "../../rmrc-reference/logs/logger";

/**
 * TEMP: logs injected for UI testing
 * Later: replace with DB / Redis fetch by sessionId
 */
const mockLogs: LogEvent[] = [
  { type: "session_started", timestamp: 1, data: { profileId: "reflective_with_boundaries" } },
  { type: "turn_index", timestamp: 2, data: { turnIndex: 1 } },
  { type: "turn_started", timestamp: 3, data: { profileId: "reflective_with_boundaries", turnIndex: 1 } },
  { type: "board_activated", timestamp: 4, data: { boardId: "reflective" } },
  { type: "role_invoked", timestamp: 5, data: { roleId: "mirror" } },
  { type: "role_skipped", timestamp: 6, data: { roleId: "context_holder", reason: "no_context_yet" } },
  { type: "output_emitted", timestamp: 7 },
  { type: "session_ended", timestamp: 8 },
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.status(200).json({ logs: mockLogs });
}
