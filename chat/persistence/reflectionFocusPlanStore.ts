// chat/persistence/reflectionFocusPlanStore.ts
import { getRedisClient } from "./redis"
import { isReflectionFocusPlanV1, type ReflectionFocusPlanV1 } from "../reflection/focusPlan"

const FOCUS_KEY_PREFIX = "gaarsdal:reflection:focus_plan:v1:"

function key(conversationId: string, revision: number): string {
  return `${FOCUS_KEY_PREFIX}${conversationId}:${revision}`
}

export async function readReflectionFocusPlan(
  conversationId: string,
  revision: number
): Promise<ReflectionFocusPlanV1 | null> {
  const client = getRedisClient()
  if (!client) return null

  const raw = await client.get<string>(key(conversationId, revision))
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!isReflectionFocusPlanV1(parsed)) return null
    return parsed
  } catch {
    return null
  }
}

export async function writeReflectionFocusPlan(
  conversationId: string,
  revision: number,
  plan: ReflectionFocusPlanV1,
  ttlSeconds: number
): Promise<void> {
  const client = getRedisClient()
  if (!client) return

  await client.set(key(conversationId, revision), JSON.stringify(plan), { ex: ttlSeconds })
}

export async function deleteReflectionFocusPlan(conversationId: string, revision: number): Promise<void> {
  const client = getRedisClient()
  if (!client) return
  await client.del(key(conversationId, revision))
}
