// pages/api/admin/delete-conversation.ts
//
// Sletter en enkelt samtale og alle tilhørende Redis-nøgler.
// Fjerner også samtalen fra brugerens thread-index og det globale recent-index.
//
// POST /api/admin/delete-conversation
// Body: { secret: string, conversation_id: string }

import type { NextApiRequest, NextApiResponse } from "next"
import { getRedisClient } from "../../../chat/persistence/redis"
import { readThreadIndex, writeThreadIndex } from "../../../chat/persistence/threadIndexStore"

const RECENT_INDEX_KEY = "gaarsdal:index:conversations:recent"

async function getUserKeyFromEvents(client: NonNullable<ReturnType<typeof getRedisClient>>, conversationId: string): Promise<string | null> {
  try {
    const eventsKey = `gaarsdal:events:v1:conv:${conversationId}`
    const first = await client.lrange<unknown>(eventsKey, 0, 0)
    if (!first || first.length === 0) return null
    const raw = first[0]
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw
    return typeof parsed?.user_key === "string" ? parsed.user_key : null
  } catch {
    return null
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })

  const adminSecret = process.env.ADMIN_SECRET
  if (!adminSecret) return res.status(503).json({ error: "ADMIN_SECRET ikke konfigureret" })

  const { secret, conversation_id } = req.body ?? {}
  if (secret !== adminSecret) return res.status(401).json({ error: "Ugyldig secret" })
  if (typeof conversation_id !== "string" || !conversation_id.trim()) {
    return res.status(400).json({ error: "Mangler conversation_id" })
  }

  const redis = getRedisClient()
  if (!redis) return res.status(503).json({ error: "Redis ikke tilgængelig" })

  const convId = conversation_id.trim()

  // Hent user_key fra første event — bruges til at opdatere thread-index
  const userKey = await getUserKeyFromEvents(redis, convId)

  // Saml alle nøgler der skal slettes
  const keysToDelete: string[] = [
    `gaarsdal:state:${convId}`,
    `gaarsdal:raw:conversation:${convId}`,
    `gaarsdal:events:v1:conv:${convId}`,
    `gaarsdal:conv:last_turn_at:${convId}`,
    `gaarsdal:jobs:v1:pending:conversation:${convId}`,
    `gaarsdal:anticipate:draft:latest:conversation:${convId}`,
  ]

  // Scan efter job-nøgler knyttet til denne samtale
  try {
    const dedupeKeys = await redis.keys(`gaarsdal:jobs:v1:dedupe:conversation:${convId}:*`)
    const anticipateDraftKeys = await redis.keys(`gaarsdal:anticipate:draft:conversation:${convId}:*`)
    keysToDelete.push(...dedupeKeys, ...anticipateDraftKeys)
  } catch { /* non-fatal */ }

  // Slet nøglerne
  let deletedCount = 0
  try {
    deletedCount = await redis.del(...(keysToDelete as [string, ...string[]])) ?? 0
  } catch { /* non-fatal */ }

  // Fjern fra globalt recent-index
  try {
    await redis.zrem(RECENT_INDEX_KEY, convId)
  } catch { /* non-fatal */ }

  // Fjern fra brugerens thread-index
  if (userKey) {
    try {
      const index = await readThreadIndex(userKey)
      if (index) {
        const updated = {
          ...index,
          threads: index.threads.filter((t) => t.conversation_id !== convId),
          active_conversation_id:
            index.active_conversation_id === convId ? null : index.active_conversation_id,
        }
        await writeThreadIndex({ userKey, index: updated, ttlSeconds: 90 * 24 * 60 * 60 })
      }
    } catch { /* non-fatal */ }
  }

  return res.status(200).json({ ok: true, conversation_id: convId, deletedCount, user_key: userKey })
}
