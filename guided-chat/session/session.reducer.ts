// guided-chat/session/session.reducer.ts

import { GuidedSession } from "./session.types";
import { NodeId } from "../node-router";
import { Chip } from "../chips";

type ReducerInput = {
  nextNode: NodeId;
  chip?: Chip;
  text?: string;
};

export function reduceSession(
  session: GuidedSession,
  input: ReducerInput
): GuidedSession {
  const now = new Date().toISOString();

  return {
    ...session,
    current_node: input.nextNode,
    updated_at: now,
    history: [
      ...session.history,
      {
        node: session.current_node,
        input: {
          chip: input.chip,
          text: input.text,
        },
        timestamp: now,
      },
    ],
  };
}
