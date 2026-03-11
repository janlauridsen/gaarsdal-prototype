import type { NextApiRequest, NextApiResponse } from "next"

export function setWidgetCors(req: NextApiRequest, res: NextApiResponse, methods: string) {
  const origin = typeof req.headers.origin === "string" ? req.headers.origin : "*"
  res.setHeader("Access-Control-Allow-Origin", origin)
  res.setHeader("Vary", "Origin")
  res.setHeader("Access-Control-Allow-Methods", methods)
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")
  res.setHeader("Access-Control-Allow-Credentials", "true")
}
