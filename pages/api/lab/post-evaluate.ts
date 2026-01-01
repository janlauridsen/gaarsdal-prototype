// pages/api/lab/post-evaluate.ts
// RMRC LAB · Post-roles Runner v0
// Purpose: Passive, read-only evaluation AFTER session completion
// No feedback to runtime. No mutation of core behavior.

import type { NextApiRequest, NextApiResponse } from "next";
import { Redis } from "@upstash/redis";

type EvaluationNote = {
  level: "note" | "warn";
  message: string;
};

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * --- Post-roles (LOCKED v0.1) ---
 * Rules are conservative, descriptive only.
 * They must never recommend actions or changes.
 */

function runPostRoles(session: any): EvaluationNote[] {
  const notes: EvaluationNote[] = [];

  // PR-01 · Boundary presence
  const hasBoundaryRole = session.turns.some(
    (t: any) =>
      Array.isArray(t.runtime?.activeRoles) &&
      t.runtime.activeRoles.some((r: string) =>
        r.toLowerCase().includes("afgrænser")
      )
  );

  if (!hasBoundaryRole) {
    notes.push({
      level: "note",
      message:
        "No explicit boundary role observed in session.",
    });
  }

  // PR-02 · Navigation usage
  const navigationUsed = session.turns.some(
    (t: any) =>
      t.consolidation?.navigationInvoked === true
  );

  if (navigationUsed) {
    notes.push({
      level: "note",
      message:
        "Navigation was invoked in at least one turn.",
    });
  }

  // PR-03 · Output absence
  const missingOutputs = session.turns.filter(
    (t: any) => !t.output
  ).length;

  if (missingOutputs > 0) {
    notes.push({
      level: "warn",
      message: `${missingOutputs} turn(s) have no output.`,
    });
  }

  // PR-04 · Role dominance (very conservative)
  const roleCounts: Record<string, number> = {};
  session.turns.forEach((t: any) => {
    (t.runtime?.activeRoles || []).forEach(
      (r: string) => {
        roleCounts[r] = (roleCounts[r] || 0) + 1;
      }
    );
  });

  const dominantRoles = Object.entries(roleCounts)
    .filter(([, count]) => count > 2)
    .map(([role]) => role);

  if (dominantRoles.length > 0) {
    notes.push({
      level: "note",
      message: `Role dominance observed: ${dominantRoles.join(
        ", "
      )}`,
    });
  }

  return notes;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { sessionId } = req.body;

  if (!sessionId) {
    return res
      .status(400)
      .json({ error: "sessionId required" });
  }

  const rawSessions = (await redis.lrange(
    "logsx:sessions",
    0,
    -1
  )) as any[];

  const index = rawSessions.findIndex((item) => {
    const parsed =
      typeof item === "string"
        ? JSON.parse(item)
        : item;
    return parsed.id === sessionId;
  });

  if (index === -1) {
    return res
      .status(404)
      .json({ error: "Session not found" });
  }

  const session =
    typeof rawSessions[index] === "string"
      ? JSON.parse(rawSessions[index])
      : rawSessions[index];

  const evaluation = runPostRoles(session);

  const updatedSession = {
    ...session,
    evaluation,
    evaluatedAt: new Date().toISOString(),
  };

  // Replace session atomically (remove + reinsert)
  await redis.lset(
    "logsx:sessions",
    index,
    JSON.stringify(updatedSession)
  );

  return res.status(200).json({
    sessionId,
    evaluationCount: evaluation.length,
  });
}
