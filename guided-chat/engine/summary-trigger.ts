// guided-chat/engine/summary-trigger.ts

import { SessionState } from "../session/session.types";
import { SUMMARY_VIEWS } from "../config/summary-views";
import { getConfidenceConfig } from "../config/confidence-config";
import { buildSummary } from "../triage/summary";

export interface SummaryOutput {
  type: "summary";
  payload: {
    summaryId: string;
    purpose: string;
    data: Record<string, unknown>;
  };
}

/**
 * Vælger evt. en opsummering baseret på confidence og aktiv task-meta.
 */
export function maybeBuildSummary(
  session: SessionState
): SummaryOutput | null {
  const task = session.tasks[session.activeTaskId];
  if (!task) return null;

  for (const view of SUMMARY_VIEWS) {
    const cfg = getConfidenceConfig(
      view.requiredConfidence.dimension as any
    );
    if (!cfg) continue;

    const value =
      session.confidence[
        view.requiredConfidence.dimension as keyof typeof session.confidence
      ];

    if (value < view.requiredConfidence.minValue) {
      continue;
    }

    // Tjek at mindst ét meta-domæne findes på aktiv task
    const hasAnyMeta = view.includedMetaDomains.some(
      d => Boolean(task.meta[d])
    );

    if (!hasAnyMeta) continue;

    const summary = buildSummary(view, {
      ...session,
      meta: task.meta
    } as any);

    return {
      type: "summary",
      payload: summary
    };
  }

  return null;
}
