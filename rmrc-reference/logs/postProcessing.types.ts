/**
 * Post-processing log events
 *
 * Used ONLY after a session is completed.
 * Never affects runtime behavior.
 */

export type PostProcessingEventType =
  | "session_evaluated"
  | "dialog_coherence_assessed"
  | "user_experience_reflected"
  | "missed_opportunity_detected";

export interface PostProcessingEvent {
  type: PostProcessingEventType;
  timestamp: number;
  sessionId: string;
  data: Record<string, unknown>;
}
