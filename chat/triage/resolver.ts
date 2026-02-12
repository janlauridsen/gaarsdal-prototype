import { runCapability } from "../ai/runtime"
import { ConversationState, Transition } from "../kernel/types"

type TriageResolution = {
  transition: Transition
}

export async function resolveTriageFreeText(
  state: ConversationState,
  text: string
): Promise<TriageResolution> {
  const result = await runCapability("triage-relevance-v1", {
    state,
    userText: text,
  })

  return {
    transition: result.transition,
  }
}
