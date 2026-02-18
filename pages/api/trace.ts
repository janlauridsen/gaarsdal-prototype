// pages/api/trace.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const INDEX_KEY = "gaarsdal:index:conversations:recent";
const STATE_PREFIX = "gaarsdal:state:";
const V1_EVENTS_PREFIX = "gaarsdal:events:v1:conv:";
const SPINE_PREFIX = "gaarsdal:spine:v23:events:";
const RAW_PREFIX = "gaarsdal:raw:conversation:";

function asString(q: string | string[] | undefined): string | undefined {
  return Array.isArray(q) ? q[0] : q;
}

function safeJsonParse<T = any>(v: any): T | any {
  if (v == null) return v;
  if (typeof v === "object") return v;
  if (typeof v !== "string") return v;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
}

function tsToMs(ts: any): number | null {
  if (!ts) return null;
  if (typeof ts === "number") return ts;
  if (typeof ts === "string") {
    const ms = Date.parse(ts);
    return Number.isFinite(ms) ? ms : null;
  }
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const conversation_id = asString(req.query.conversation_id);
    const limit = Math.max(20, Math.min(1000, Number(asString(req.query.limit) ?? 250)));

    // LIST
    if (!conversation_id) {
      const ids = await redis.zrange<string[]>(INDEX_KEY, 0, 200, { rev: true });
      return res.status(200).json({ conversations: ids ?? [] });
    }

    // DETAIL
    const stateKey = `${STATE_PREFIX}${conversation_id}`;
    const v1Key = `${V1_EVENTS_PREFIX}${conversation_id}`;
    const spineKey = `${SPINE_PREFIX}${conversation_id}`;
    const rawKey = `${RAW_PREFIX}${conversation_id}`;

    const [stateRaw, v1Raw, spineRaw, rawRaw] = await Promise.all([
      redis.get(stateKey),
      // tail
      (redis as any).lrange?.(v1Key, -limit, -1) ?? [],
      (redis as any).lrange?.(spineKey, -limit, -1) ?? [],
      (redis as any).lrange?.(rawKey, -limit, -1) ?? [],
    ]);

    const state = safeJsonParse(stateRaw);
    const v1Events = (Array.isArray(v1Raw) ? v1Raw : []).map(safeJsonParse);
    const spineEvents = (Array.isArray(spineRaw) ? spineRaw : []).map(safeJsonParse);
    const rawTurns = (Array.isArray(rawRaw) ? rawRaw : []).map(safeJsonParse);

    // TTL (state)
    let ttl_ms: number | null = null;
    try {
      ttl_ms = await redis.pttl(stateKey);
    } catch {
      try {
        const ttl_s = await redis.ttl(stateKey);
        ttl_ms = typeof ttl_s === "number" ? ttl_s * 1000 : null;
      } catch {
        ttl_ms = null;
      }
    }

    // Merge to timeline
    const timeline: any[] = [];

    for (const e of v1Events) {
      timeline.push({
        kind: "v1",
        t_ms: tsToMs(e?.timestamp_ms) ?? null,
        t_iso: e?.timestamp_ms ? new Date(e.timestamp_ms).toISOString() : null,
        summary: `${e?.event_type ?? "event"} @ ${e?.node_id ?? "?"}`,
        data: e,
      });
    }

    for (const e of spineEvents) {
      const ms = tsToMs(e?.ts);
      timeline.push({
        kind: "spine",
        t_ms: ms,
        t_iso: typeof e?.ts === "string" ? e.ts : ms ? new Date(ms).toISOString() : null,
        summary: `${e?.transition_type ?? "event"} ${e?.node_after ?? ""}`.trim(),
        data: e,
      });
    }

    for (const t of rawTurns) {
      const ms = tsToMs(t?.ts);
      timeline.push({
        kind: "raw",
        t_ms: ms,
        t_iso: typeof t?.ts === "string" ? t.ts : ms ? new Date(ms).toISOString() : null,
        summary: `raw ${t?.input_type ?? ""}`.trim(),
        data: t,
      });
    }

    timeline.sort((a, b) => (a.t_ms ?? 0) - (b.t_ms ?? 0));

    return res.status(200).json({
      conversation_id,
      keys: { stateKey, v1Key, spineKey, rawKey },
      ttl_ms,
      state,
      counts: {
        v1: v1Events.length,
        spine: spineEvents.length,
        raw: rawTurns.length,
        timeline: timeline.length,
      },
      timeline,
      v1Events,
      spineEvents,
      rawTurns,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? "Unknown error" });
  }
}
