/**
 * guided-chat/postanalysis/postanalysis.ts
 *
 * Rolle:
 * - Asynkron post-analyse
 * - Ingen indflydelse på flow
 * - Fail-silent
 *
 * Version:
 * - V10.3
 */

export type PostAnalysisPayload = {
  session_id: string;
  turn_id: number;
  chip?: string | null;
  analysis: {
    scope_match: boolean;
    ambiguity_level: "low" | "medium" | "high";
  };
  hypotheses: string[];
  flags: {
    medical_risk: boolean;
    off_scope: boolean;
  };
  meta: {
    /**
     * Model / system version.
     * Fx git-tag, branch eller semver.
     */
    model_version: string;
    analysis_version: string;
  };
};

export function writePostAnalysis(payload: PostAnalysisPayload): void {
  // Fail-silent design.
  // I V10 logges dette typisk til fil eller ekstern sink.
  // Implementeringen er bevidst tom her.
}
