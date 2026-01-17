import type { NextApiRequest, NextApiResponse } from "next"
import { runKernel } from "../../chat/kernel"
import {
  ConversationState,
  InputSignal,
} from "../../chat/kernel/types"

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { state, input } = req.body as {
    state: ConversationState
    input: InputSignal
  }

  const result = runKernel(state, input)

  res.status(200).json(result)
}
