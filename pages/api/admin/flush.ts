import type { NextApiRequest, NextApiResponse } from "next"

/**
 * Admin-only Redis flush endpoint.
 *
 * Uses direct Upstash REST command.
 * Intentionally NOT part of shared redis client.
 */

const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
  throw new Error("Upstash Redis environment variables are missing")
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const response = await fetch(UPSTASH_REDIS_REST_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(["FLUSHDB"]),
    })

    const result = await response.json()

    if (result.error) {
      throw new Error(result.error)
    }

    res.status(200).json({ ok: true })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
}
