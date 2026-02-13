import type { NextApiRequest, NextApiResponse } from "next"
import { runKernel } from "../../chat/kernel/engine"
import { createInitialState } from "../../chat/kernel/state"
import { appendLog, appendInteraction } from "../../chat/logging/sink"
import type { LogEvent, InputSignal } from "../../chat/kernel/types"
import { getNode } from "../../chat/nodes/registry"
import { runCapability } from "../../chat/ai/runtime"

function toUserInput(input: InputSignal): string | undefined {
  if (input.type === "FREE_TEXT") return input.text
  if (input.type === "EXPLICIT_TRANSITION") return `EXPLICIT_TRANSITION:${input.target}`
  if (input.type === "SYSTEM") return `SYSTEM:${input.intent}`
  return undefined
}

function resolveCapabilityId(nodeId: string): string | null {
  if (nodeId === "TRIAGE") return "triage-relevance-v1"
  if (nodeId === "GEN_HYPNO") return "gen-hypno-v1"
  if (nodeId === "METHOD_FIT") return "method-fit-v1"
  return null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

  // ---------- GENERIC DIALOG FREE TEXT ----------
  if (state && input?.type === "FREE_TEXT") {
    const node = getNode(state.active_node)

    if (node.kind === "DIALOG") {
      const capabilityId = resolveCapabilityId(node.id)

      if (capabilityId) {
        const capabilityResult = await runCapability(capabilityId, {
          state,
          userText: input.text,
        })

        const kernelResult = runKernel(state, {
          type: "FREE_TEXT_RESOLVED",
          proposed_transition: capabilityResult.transition,
        })

        await appendLog(kernelResult.log)

        await appendInteraction({
          conversation_id: kernelResult.state.conversation_id,
          revision: kernelResult.state.revision,
          active_node: kernelResult.state.active_node,
          input_type: input.type,
          user_input: input.text,
          ai_response:
            kernelResult.transition.response_message ??
            kernelResult.state.active_node_message,
          outcome_node: kernelResult.transition.to,
          timestamp: new Date().toISOString(),
        })

        return res.status(200).json(kernelResult)
      }
    }
  }

  // ---------- NORMAL ----------
  const result = runKernel(state, input)

  await appendLog(result.log)

  await appendInteraction({
    conversation_id: result.state.conversation_id,
    revision: result.state.revision,
    active_node: result.state.active_node,
    input_type: input.type,
    user_input: toUserInput(input),
    ai_response: result.transition.response_message ?? result.state.active_node_message,
    outcome_node: result.transition.to,
    timestamp: new Date().toISOString(),
  })

  return res.status(200).json(result)
}
