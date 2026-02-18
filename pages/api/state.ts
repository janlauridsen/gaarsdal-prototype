// pages/api/state.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const INDEX_KEY = "gaarsdal:index:conversations:recent";
const STATE_PREFIX = "gaarsdal:state:";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const conversation_id = Array.isArray(req.query.conversation_id)
      ? req.query.conversation_id[0]
      : req.query.conversation_id;

    // --- LIST (based on ZSET index) ---
    if (!conversation_id) {
      // Upstash Redis SDK: use zrange with { rev: true } instead of zrevrange
      const ids = await redis.zrange<string[]>(INDEX_KEY, 0, 200, { rev: true });
      return res.status(200).json({ conversations: ids ?? [] });
    }

    // --- DETAIL ---
    const key = `${STATE_PREFIX}${conversation_id}`;
    const state = await redis.get(key);

    if (!state) {
      return res.status(404).json({ error: "State not found", key });
    }

    // TTL (prefer pttl, fallback ttl)
    let ttl_ms: number | null = null;
    try {
      ttl_ms = await redis.pttl(key);
    } catch {
      try {
        const ttl_s = await redis.ttl(key);
        ttl_ms = typeof ttl_s === "number" ? ttl_s * 1000 : null;
      } catch {
        ttl_ms = null;
      }
    }

    return res.status(200).json({ key, ttl_ms, state });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? "Unknown error" });
  }
}
