// lib/logging/logEpistemicWitness.ts

import { createLogEvent } from "./createLogEvent";
import { writeLogEvent } from "./writeLogEvent";

export async function logEpistemicSnapshot(params: {
  sessionId: string;
  description: string;
  openGaps?: string[];
}) {
  const event = createLogEvent({
    sessionId: params.sessionId,
    layer: "epistemic-witness",
    eventType: "epistemic_snapshot",
    payload: {
      description: params.description,
      openGaps: params.openGaps ?? [],
    },
  });

  await writeLogEvent(event);
}

export async function logDomainWitnessHypothesis(params: {
  sessionId: string;
  domain: string;
  hypothesis: string;
  confidence: "low" | "medium" | "high";
}) {
  const event = createLogEvent({
    sessionId: params.sessionId,
    layer: "epistemic-witness",
    eventType: "domain_witness_hypothesis",
    payload: {
      domain: params.domain,
      hypothesis: params.hypothesis,
      confidence: params.confidence,
    },
  });

  await writeLogEvent(event);
}
