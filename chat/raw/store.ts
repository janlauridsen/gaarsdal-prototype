import { getRedisClient } from "../persistence/redis"

export type RawTurnEvent = {
  ts: string
  conversation_id: string
  revision: number
  node_id: string
  input_type: string
  user_input?: string
  assistant_output?: string
}

const KEY_PREFIX = "gaarsdal:raw:conversation:"
const MAX_ITEMS = 2000

function key(conversationId: string): string {
  return `${KEY_PREFIX}${conversationId}`
}

function nowIso(): string {
  return new Date().toISOString()
}

export async function appendRawTurn(params: {
  conversationId: string
  revision: number
  nodeId: string
  inputType: string
  userInput?: string
  assistantOutput?: string
  ttlSeconds: number
}): Promise<void> {
  const client = getRedisClient()
  if (!client) return

  const e: RawTurnEvent = {
    ts: nowIso(),
    conversation_id: params.conversationId,
    revision: params.revision,
    node_id: params.nodeId,
    input_type: params.inputType,
    user_input: params.userInput,
    assistant_output: params.assistantOutput,
  }

  await client.rpush(key(params.conversationId), JSON.stringify(e))
  await client.ltrim(key(params.conversationId), -MAX_ITEMS, -1)
  await client.expire(key(params.conversationId), params.ttlSeconds)
}

export async function readRawTurns(params: {
  conversationId: string
  limit?: number
}): Promise<RawTurnEvent[]> {
  const client = getRedisClient()
  if (!client) return []

  const limit = typeof params.limit === "number" ? Math.max(1, Math.min(params.limit, 500)) : 100
  const items = await client.lrange<unknown>(key(params.conversationId), -limit, -1)
  const out: RawTurnEvent[] = []
  for (const x of items) {
    try {
      if (typeof x === "string") out.push(JSON.parse(x) as RawTurnEvent)
      else if (typeof x === "object" && x !== null) out.push(x as RawTurnEvent)
    } catch {
      // ignore
    }
  }
  return out
}
