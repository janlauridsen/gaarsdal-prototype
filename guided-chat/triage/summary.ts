// guided-chat/triage/summary.ts

import { SummaryViewConfig } from "../config/summary-views";
import { SessionState } from "../session/session.types";

export function buildSummary(
  view: SummaryViewConfig,
  session: SessionState
) {
  const summary: Record<string, unknown> = {};

  for (const domain of view.includedMetaDomains) {
    if (session.meta[domain]) {
      summary[domain] = session.meta[domain].value;
    }
  }

  return {
    summaryId: view.id,
    purpose: view.purpose,
    data: summary
  };
}
