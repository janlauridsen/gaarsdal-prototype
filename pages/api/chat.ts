import type { NextApiRequest, NextApiResponse } from "next"
import { runKernel } from "../../chat/kernel/engine"
import { createInitialState } from "../../chat/kernel/state"
import { appendInteraction, appendLog } from "../../chat/logging/sink"
import type { InputSignal, KernelResult, LogEvent } from "../../chat/kernel/types"
import { getNode } from "../../chat/nodes/registry"
import { runCapability } from "../../chat/ai/runtime"

type ChatRequestBody = {
  state: any
  input: InputSignal
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function toUserInput(input: InputSignal): string | undefined {
  if (input.type === "FREE_TEXT") return input.text
  if (input.type === "EXPLICIT_TRANSITION") return `EXPLICIT_TRANSITION:${input.target}`
  if (input.type === "SYSTEM") return `SYSTEM:${input.intent}`
  if (input.type === "SYSTEM_INIT") return "SYSTEM_INIT"
  return undefined
}

/**
 * TODO (P3): move to registry (node.capability_id) or separate dialog registry.
 */
function resolveCapabilityId(nodeId: string): string | null {
  if (nodeId === "TRIAGE") return "triage-relevance-v1"
  if (nodeId === "GEN_HYPNO") return "gen-hypno-v1"
  if (nodeId === "METHOD_FIT") return "method-fit-v1"
  return null
}

async function logKernelResult(
  result: KernelResult,
  input: InputSignal,
  userInputOverride?: string
): Promise<void> {
  await appendLog(result.log)

  const aiText =
    result.transition.response_message ??
    result.state.active_node_message

  await appendInteraction({
    conversation_id: result.state.conversation_id,
    revision: result.state.revision,
    active_node: result.state.active_node,
    input_type: input.type,
    user_input: userInputOverride ?? toUserInput(input),
    ai_response: aiText,
    outcome_node: result.transition.to,
    timestamp: new Date().toISOString(),
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" })
  }

  if (!isObject(req.body)) {
    return res.status(400).json({ error: "Invalid JSON body" })
  }

  const { state, input } = req.body as ChatRequestBody

  if (!input || !isObject(input) || typeof (input as any).type !== "string") {
    return res.status(400).json({ error: "Missing or invalid input" })
  }

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

  // ---------- DIALOG FREE TEXT (generic) ----------
  if (state && input.type === "FREE_TEXT") {
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

        await logKernelResult(kernelResult, input, input.text)
        return res.status(200).json(kernelResult)
      }

      /**
       * If a node is DIALOG but no capability is registered, let kernel handle it.
       * Kernel will typically REJECT with "free text requires external resolution".
       */
    }
  }

  // ---------- NORMAL ----------
  const result = runKernel(state, input)
  await logKernelResult(result, input)
  return res.status(200).json(result)
}
