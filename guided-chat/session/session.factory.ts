// guided-chat/session/session.factory.ts

import { GuidedSession } from "./session.types";

export function createSession(session_id: string): GuidedSession {
  const now = new Date().toISOString();

  return {
    session_id,
    created_at: now,
    updated_at: now,
    current_node: "ROOT",
    history: [],
  };
}
