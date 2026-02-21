// pages/api/conversation.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const INDEX_KEY = "gaarsdal:index:conversations:recent";
const STATE_PREFIX = "gaarsdal:state:";
const RAW_PREFIX = "gaarsdal:raw:conversation:";

function asString(q: string | string[] | undefined): string | undefined {
  return Array.isArray(q) ? q[0] : q;
}

function safeJsonParse(v: any) {
  if (v == null) return v;
  if (typeof v === "object") return v;
  if (typeof v !== "string") return v;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const conversation_id = asString(req.query.conversation_id);
    const limit = Math.max(20, Math.min(2000, Number(asString(req.query.limit) ?? 500)));

    if (!conversation_id) {
      const ids = await redis.zrange<string[]>(INDEX_KEY, 0, 200, { rev: true });
      return res.status(200).json({ conversations: ids ?? [] });
    }

    const stateKey = `${STATE_PREFIX}${conversation_id}`;
    const rawKey = `${RAW_PREFIX}${conversation_id}`;

    const [stateRaw, rawRaw] = await Promise.all([
      redis.get(stateKey),
      (redis as any).lrange?.(rawKey, -limit, -1) ?? [],
    ]);

    const state = safeJsonParse(stateRaw);
    const turns = (Array.isArray(rawRaw) ? rawRaw : []).map(safeJsonParse);

    return res.status(200).json({
      conversation_id,
      keys: { stateKey, rawKey },
      state,
      turns,
      count: turns.length,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? "Unknown error" });
  }
}
