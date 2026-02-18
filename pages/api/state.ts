// pages/api/state.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const INDEX_KEY = "gaarsdal:index:conversations:recent";
const STATE_PREFIX = "gaarsdal:state:";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { conversation_id } = req.query;

    // --- LIST ALL STATES (based on index) ---
    if (!conversation_id) {
      const ids = await redis.zrevrange(INDEX_KEY, 0, 200);
      return res.status(200).json({ conversations: ids });
    }

    // --- SINGLE STATE DETAIL ---
    const key = `${STATE_PREFIX}${conversation_id}`;
    const state = await redis.get(key);

    if (!state) {
      return res.status(404).json({ error: "State not found" });
    }

    // TTL (prefer pttl, fallback ttl)
    let ttl: number | null = null;
    try {
      ttl = await redis.pttl(key);
    } catch {
      ttl = await redis.ttl(key);
    }

    return res.status(200).json({
      key,
      ttl_ms: ttl,
      state,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
