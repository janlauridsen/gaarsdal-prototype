// guided-chat/triage/summary.ts

import { SummaryViewConfig } from "../config/summary-views";
import { MetaStore } from "../session/session.types";

/**
 * Bygger en opsummering baseret på view-konfiguration og task-meta.
 */
export function buildSummary(
  view: SummaryViewConfig,
  context: {
    meta: MetaStore;
  }
) {
  const summary: Record<string, unknown> = {};

  for (const domain of view.includedMetaDomains) {
    const entry = context.meta[domain];
    if (entry) {
      summary[domain] = entry.value;
    }
  }

  return {
    summaryId: view.id,
    purpose: view.purpose,
    data: summary
  };
}
