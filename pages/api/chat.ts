import type { NextApiRequest, NextApiResponse } from "next"
import { runKernel } from "../../chat/kernel/engine"
import { createInitialState } from "../../chat/kernel/state"
import { appendLog } from "../../chat/logging/sink"
import type { LogEvent } from "../../chat/kernel/types"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { state, input } = req.body

  // ---------- INIT ----------
  if (state === null) {
    const initialState = createInitialState("ui-session")

    const log: LogEvent = {
      conversation_id: initialState.conversation_id,
      revision_before: -1,
      revision_after: initialState.revision,
      active_node_before: null,
      active_node_after: initialState.active_node,
      input_type: "SYSTEM_INIT",
      transition_type: "INIT",
      timestamp: new Date().toISOString(),
    }

    const payload = {
      state: initialState,
      transition: {
        type: "INIT",
        from: null,
        reason: "system init",
      },
      log,
    }

    await appendLog(payload.log)
    return res.status(200).json(payload)
  }

  // ---------- NORMAL ----------
  const result = runKernel(state, input)
  await appendLog(result.log)
  res.status(200).json(result)
}
