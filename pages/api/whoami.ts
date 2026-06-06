// pages/api/whoami.ts
//
// Diagnose-endpoint: viser hvilken IP serveren faktisk ser for DIG,
// samt om den matcher OWN_IP. Brug til at sætte OWN_IP korrekt.
// Besøg https://gaarsdal.net/api/whoami fra din egen enhed.

import type { NextApiRequest, NextApiResponse } from "next"

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const vercelFwd = (req.headers["x-vercel-forwarded-for"] as string | undefined) ?? ""
  const xfwd = (req.headers["x-forwarded-for"] as string | undefined) ?? ""
  const detected = vercelFwd.split(",")[0]?.trim() || xfwd.split(",")[0]?.trim() || ""

  const ownIps = (process.env.OWN_IP ?? "").split(",").map(s => s.trim()).filter(Boolean)
  const isOwn = detected ? ownIps.includes(detected) : false

  res.status(200).json({
    detected_ip: detected,
    own_ip_env: ownIps,
    is_own_match: isOwn,
    note: detected.includes(":")
      ? "Din IP er IPv6. Sæt denne præcise streng i OWN_IP (evt. sammen med din IPv4)."
      : "Din IP er IPv4. Bekræft at den står præcist i OWN_IP.",
  })
}
