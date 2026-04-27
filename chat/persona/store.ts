// chat/persona/store.ts
// Læser og skriver PersonaState til Redis per conversationId.

import { getRedisClient } from "../persistence/redis"
import { defaultPersonaState, type PersonaState } from "./types"

const KEY_PREFIX = "gaarsdal:persona:"

function redisKey(conversationId: string): string {
  return `${KEY_PREFIX}${conversationId}`
}

export async function readPersonaState(conversationId: string): Promise<PersonaState> {
  try {
    const client = getRedisClient()
    if (!client) return defaultPersonaState()
    const raw = await client.get<PersonaState>(redisKey(conversationId))
    if (!raw) return defaultPersonaState()
    return raw
  } catch {
    return defaultPersonaState()
  }
}

export async function writePersonaState(
  conversationId: string,
  state: PersonaState,
  ttlSeconds: number
): Promise<void> {
  try {
    const client = getRedisClient()
    if (!client) return
    await client.set(redisKey(conversationId), state, { ex: ttlSeconds })
  } catch (e) {
    console.error("[persona store] write fejl:", e)
  }
}
