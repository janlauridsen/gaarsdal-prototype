import type { NextApiRequest, NextApiResponse } from "next"

/**
 * AI chat endpoint is intentionally disabled.
 *
 * Reason:
 * - Legacy chat runtime depended on session-logger
 * - Not part of RMRC v2.0 logging-first architecture
 * - Chat functionality will be reintroduced later
 *   on top of validated RMRC runtime + logging
 */

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  res.status(410).json({
    disabled: true,
    reason: "AI chat endpoint is not active in RMRC v2.0",
  })
}
