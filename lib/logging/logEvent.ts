// lib/logging/logEvent.ts

export type RMRCLogLayer =
  | "session"
  | "domain-overlay"
  | "epistemic-witness";

export type RMRCLogEventType =
  | "session_started"
  | "user_input"
  | "role_execution"
  | "assistant_output"
  | "session_ended";

export interface RMRCLogEvent {
  eventId: string;
  sessionId: string;
  timestamp: string;

  layer: RMRCLogLayer;
  eventType: RMRCLogEventType;

  role?: string; // fx "spejler", "afgrænser"
  turn?: number;

  payload: Record<string, any>;
}
