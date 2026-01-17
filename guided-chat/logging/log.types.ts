// guided-chat/logging/log.types.ts

import { ConversationId, NodeId } from "../kernel/types";

export type KernelLogEvent = {
  conversation_id: ConversationId;

  revision_before: number;
  revision_after: number;

  active_node_before: NodeId;
  active_node_after: NodeId;

  input_type: string;
  transition_type: string;

  timestamp: string;
};
