import { getRedisClient } from "./redis"
import { createEmptyMethodFitCase, type MethodFitCaseSchemaV1 } from "../methodFit/schema"

const CASE_KEY_PREFIX = "gaarsdal:method_fit:v1:case:"

function key(conversationId: string): string {
  return `${CASE_KEY_PREFIX}${conversationId}`
}

function isMethodFitCaseV1(value: unknown): value is MethodFitCaseSchemaV1 {
  if (typeof value !== "object" || value === null) return false
  const v = value as any
  return (
    typeof v.case === "object" &&
    v.case !== null &&
    typeof v.case.case_id === "string" &&
    typeof v.case.created_at === "string" &&
    typeof v.case.language === "string" &&
    typeof v.scope === "object" &&
    v.scope !== null &&
    typeof v.problem_tags === "object" &&
    v.problem_tags !== null &&
    typeof v.constraints === "object" &&
    v.constraints !== null &&
    typeof v.red_flags === "object" &&
    v.red_flags !== null &&
    typeof v.rankings === "object" &&
    v.rankings !== null &&
    typeof v.focus_plan === "object" &&
    v.focus_plan !== null
  )
}

function parseCase(raw: unknown): MethodFitCaseSchemaV1 | null {
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw)
      return isMethodFitCaseV1(parsed) ? (parsed as MethodFitCaseSchemaV1) : null
    } catch {
      return null
    }
  }
  if (isMethodFitCaseV1(raw)) return raw
  return null
}

export async function readMethodFitCase(conversationId: string): Promise<MethodFitCaseSchemaV1> {
  const client = getRedisClient()
  if (!client) return createEmptyMethodFitCase(conversationId)

  const raw = await client.get<unknown>(key(conversationId))
  const parsed = parseCase(raw)
  return parsed ?? createEmptyMethodFitCase(conversationId)
}

export async function writeMethodFitCase(
  conversationId: string,
  schema: MethodFitCaseSchemaV1,
  ttlSeconds: number
): Promise<void> {
  const client = getRedisClient()
  if (!client) return
  await client.set(key(conversationId), JSON.stringify(schema), { ex: ttlSeconds })
}

export async function deleteMethodFitCase(conversationId: string): Promise<void> {
  const client = getRedisClient()
  if (!client) return
  await client.del(key(conversationId))
}
