// pages/api/admin/geo-debug.ts
//
// Viser hvilke Vercel geo-headers der modtages.
// GET /api/admin/geo-debug?secret=<ADMIN_SECRET>

import type { NextApiRequest, NextApiResponse } from "next"

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const adminSecret = process.env.ADMIN_SECRET
  if (!adminSecret || req.query.secret !== adminSecret) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const geoHeaders = Object.entries(req.headers)
    .filter(([key]) => key.startsWith("x-vercel-ip") || key.startsWith("x-real") || key === "x-forwarded-for")
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {} as Record<string, unknown>)

  return res.status(200).json({
    geo: geoHeaders,
    all_headers: Object.keys(req.headers),
  })
}
