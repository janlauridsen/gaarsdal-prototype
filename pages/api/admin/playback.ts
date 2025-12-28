import type { NextApiRequest, NextApiResponse } from "next"

/**
 * Playback endpoint is intentionally disabled.
 *
 * Reason:
 * - Legacy evaluation / screening / playback pipeline
 * - Not part of RMRC v2.0 logging-first architecture
 * - Kept as a stub to avoid build-time failures
 *
 * This endpoint may be reintroduced later as a
 * dedicated analysis-only service.
 */

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  res.status(410).json({
    disabled: true,
    reason: "Playback subsystem is not active in RMRC v2.0",
  })
}
