// guided-chat/session/session.types.ts

import { NodeId } from "../node-router";
import { Chip } from "../chips";

export type GuidedSession = {
  session_id: string;
  created_at: string;
  updated_at: string;

  current_node: NodeId;
  history: {
    node: NodeId;
    input?: {
      chip?: Chip;
      text?: string;
    };
    timestamp: string;
  }[];
};
