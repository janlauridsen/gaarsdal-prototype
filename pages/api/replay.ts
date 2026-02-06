import type { NextApiRequest, NextApiResponse } from "next"
import { randomUUID } from "crypto"
import { parse } from "yaml"
import { createInitialState } from "../../chat/kernel/state"
import { readLogs } from "../../chat/logging/sink"
import { replay } from "../../chat/observability/replay"
import { appendReplayHistory } from "../../chat/logging/redisStore"

type ReplayExpectation = {
  final_active_node?: string
  status?: string
  min_revisions?: number
}

type ReplayCase = {
  name?: string
  conversation_id: string
  expected?: ReplayExpectation
}

type ReplayPayload = {
  cases?: ReplayCase[]
}

type ReplayHistoryEntry = {
  id: string
  created_at: string
  yaml: string
  result: unknown
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" })
    return
  }

  const { yaml: yamlText } = req.body ?? {}
  if (typeof yamlText !== "string") {
    res.status(400).json({ error: "Missing yaml string" })
    return
  }

  const payload = parse(yamlText) as ReplayPayload
  const cases = Array.isArray(payload?.cases) ? payload.cases : []

  const results = await Promise.all(
    cases.map(async (entry) => {
      if (!entry?.conversation_id) {
        return {
          name: entry?.name ?? "unnamed",
          ok: false,
          error: "conversation_id missing",
        }
      }

      try {
        const logs = await readLogs(entry.conversation_id)
        const filtered = logs.filter(
          (log: any) =>
            log.revision_before >= 0 &&
            log.transition_type !== "INIT"
        )
        const initial = createInitialState(entry.conversation_id)
        const { states } = replay(initial, filtered)
        const finalState = states[states.length - 1]

        const checks: Array<{
          label: string
          ok: boolean
          expected: unknown
          actual: unknown
        }> = []

        if (entry.expected?.final_active_node) {
          checks.push({
            label: "final_active_node",
            ok:
              finalState.active_node ===
              entry.expected.final_active_node,
            expected: entry.expected.final_active_node,
            actual: finalState.active_node,
          })
        }

        if (entry.expected?.status) {
          checks.push({
            label: "status",
            ok: finalState.status === entry.expected.status,
            expected: entry.expected.status,
            actual: finalState.status,
          })
        }

        if (typeof entry.expected?.min_revisions === "number") {
          checks.push({
            label: "min_revisions",
            ok: finalState.revision >= entry.expected.min_revisions,
            expected: entry.expected.min_revisions,
            actual: finalState.revision,
          })
        }

        const ok = checks.every((check) => check.ok)

        return {
          name: entry.name ?? entry.conversation_id,
          ok,
          conversation_id: entry.conversation_id,
          checks,
          final_state: finalState,
        }
      } catch (error) {
        return {
          name: entry.name ?? entry.conversation_id,
          ok: false,
          conversation_id: entry.conversation_id,
          error:
            error instanceof Error ? error.message : "Unknown error",
        }
      }
    })
  )

  const response = {
    total: results.length,
    passed: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  }

  await appendReplayHistory({
    id: randomUUID(),
    created_at: new Date().toISOString(),
    yaml: yamlText,
    result: response,
  })

  res.status(200).json(response)
}
