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
 * Vælger evt. en opsummering baseret på confidence og tilgængelig meta.
 * Returnerer null hvis ingen opsummering skal vises nu.
 */
export function maybeBuildSummary(
  session: SessionState
): SummaryOutput | null {
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

    // Tjek at mindst ét meta-domæne findes
    const hasAnyMeta = view.includedMetaDomains.some(
      d => Boolean(session.meta[d])
    );

    if (!hasAnyMeta) continue;

    const summary = buildSummary(view, session);

    return {
      type: "summary",
      payload: summary
    };
  }

  return null;
}
