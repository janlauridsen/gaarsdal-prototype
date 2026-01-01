// pages/api/lab/run.ts
// RMRC LAB · Simulation Runner v0
// Purpose: Orchestrate controlled session, store in Redis
// NOTE: Dependency-free ID generation (no uuid)

import type { NextApiRequest, NextApiResponse } from "next";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// --- Archetype → parameter mapping (LOCKED, v0.1) ---
function archetypeConfig(archetype: string) {
  switch (archetype) {
    case "boundary_tester":
      return {
        roles: ["Spejler", "Afgrænser"],
        boundaryStrictness: "high",
        navigationAllowed: false,
      };
    case "ambiguity_sustainer":
      return {
        roles: ["Spejler"],
        boundaryStrictness: "default",
        navigationAllowed: false,
      };
    case "navigational_puller":
      return {
        roles: ["Spejler", "Dialogisk Navigatør"],
        boundaryStrictness: "default",
        navigationAllowed: true,
      };
    case "persistent_prober":
      return {
        roles: ["Spejler", "Afgrænser"],
        boundaryStrictness: "default",
        navigationAllowed: false,
      };
    case "minimal_reflector":
    default:
      return {
        roles: ["Spejler"],
        boundaryStrictness: "default",
        navigationAllowed: false,
      };
  }
}

// Simple, deterministic session ID (lab-scoped)
function generateSessionId() {
  return `lab-${Date.now()}`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { input, archetype } = req.body;

  if (!input || typeof input !== "string") {
    return res
      .status(400)
      .json({ error: "input required" });
  }

  const sessionId = generateSessionId();
  const createdAt = new Date().toISOString();
  const config = archetypeConfig(archetype);

  // --- Minimal single-turn session (Core is external & stable) ---
  const session = {
    id: sessionId,
    source: "lab",
    archetype,
    parameters: config,
    createdAt,
    turns: [
      {
        index: 1,
        input,
        runtime: {
          board: "reflective",
          activeRoles: config.roles,
        },
        output: null,
      },
    ],
  };

  await redis.rpush(
    "logsx:sessions",
    JSON.stringify(session)
  );

  return res.status(200).json({ sessionId });
}
