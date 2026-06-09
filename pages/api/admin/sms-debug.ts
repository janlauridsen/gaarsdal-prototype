import type { NextApiRequest, NextApiResponse } from "next"
import { getRedisClient } from "../../../chat/persistence/redis"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers["x-admin-token"] ?? req.query.token
  if (token !== process.env.ADMIN_TOKEN) return res.status(403).end()

  const redis = getRedisClient()
  if (!redis) return res.status(200).json({ error: "ingen redis" })

  const KEY = "gaarsdal:sms:optin"
  const results: any = { key: KEY }

  // Test 1: zcard (antal members)
  try { results.zcard = await redis.zcard(KEY) } catch(e) { results.zcard_err = String(e) }

  // Test 2: zrange rank 0 -1
  try { results.zrange_rank = await redis.zrange(KEY, 0, -1) } catch(e) { results.zrange_rank_err = String(e) }

  // Test 3: zrange byScore 0 til fremtid
  try {
    const far = Date.now() + 1000*60*60*24*365*10
    results.zrange_score = await redis.zrange(KEY, 0, far, { byScore: true, offset: 0, count: 100 })
  } catch(e) { results.zrange_score_err = String(e) }

  // Test 4: zscore på første element
  try {
    const first = await redis.zrange(KEY, 0, 0)
    results.first_raw = first
  } catch(e) { results.first_err = String(e) }

  res.setHeader("Cache-Control", "no-store")
  return res.status(200).json(results)
}
