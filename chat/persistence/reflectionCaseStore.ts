import { getRedisClient } from "./redis"
import { createEmptyReflectionCase, type ReflectionCaseSchemaV1 } from "../reflection/schema"

const CASE_KEY_PREFIX = "gaarsdal:reflection:v1:case:"

function key(conversationId: string): string {
  return `${CASE_KEY_PREFIX}${conversationId}`
}

function isReflectionCaseV1(value: unknown): value is ReflectionCaseSchemaV1 {
  if (typeof value !== "object" || value === null) return false
  const v = value as any

  // Minimal structural checks (loose, backward-safe)
  return (
    typeof v.case === "object" &&
    v.case !== null &&
    typeof v.case.case_id === "string" &&
    typeof v.case.created_at === "string" &&
    typeof v.case.language === "string" &&
    typeof v.scope === "object" &&
    v.scope !== null &&
    typeof v.cognitive_diamond === "object" &&
    v.cognitive_diamond !== null &&
    typeof v.risk_engine === "object" &&
    v.risk_engine !== null &&
    typeof v.dialog_dynamics === "object" &&
    v.dialog_dynamics !== null
  )
}

function parseCase(raw: unknown): ReflectionCaseSchemaV1 | null {
  // Upstash may return either string (raw JSON) or a parsed object.
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw)
      return isReflectionCaseV1(parsed) ? (parsed as ReflectionCaseSchemaV1) : null
    } catch {
      return null
    }
  }

  if (isReflectionCaseV1(raw)) return raw
  return null
}

export async function readReflectionCase(conversationId: string): Promise<ReflectionCaseSchemaV1> {
  const client = getRedisClient()
  if (!client) return createEmptyReflectionCase(conversationId)

  const raw = await client.get<unknown>(key(conversationId))
  const parsed = parseCase(raw)
  return parsed ?? createEmptyReflectionCase(conversationId)
}

export async function writeReflectionCase(
  conversationId: string,
  schema: ReflectionCaseSchemaV1,
  ttlSeconds: number
): Promise<void> {
  const client = getRedisClient()
  if (!client) return

  await client.set(key(conversationId), JSON.stringify(schema), { ex: ttlSeconds })
}

export async function deleteReflectionCase(conversationId: string): Promise<void> {
  const client = getRedisClient()
  if (!client) return
  await client.del(key(conversationId))
}
