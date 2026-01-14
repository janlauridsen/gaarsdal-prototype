import type { NextApiRequest, NextApiResponse } from "next";

import { Chip } from "../../guided-chat/chips";
import { NodeId, ROUTES } from "../../guided-chat/node-router";
import { NODES } from "../../guided-chat/nodes";

import { resolveFreeTextIntent } from "../../guided-chat/free-text-router";
import { decideAction } from "../../guided-chat/engine";

import { writeTurnLog } from "../../guided-chat/logging/logWriter";
import { TurnLog } from "../../guided-chat/logging/log.types";

import { writePostAnalysis } from "../../guided-chat/postanalysis/postanalysis";

/* =====================
   CONFIG
===================== */

const DEFAULT_NODE: NodeId = "ROOT";

/* =====================
   API HANDLER
===================== */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const startedAt = Date.now();

  const {
    sessionId,
    currentNode,
    chip,
    text,
  }: {
    sessionId?: string;
    currentNode?: NodeId;
    chip?: Chip;
    text?: string;
  } = req.body ?? {};

  if (!sessionId) {
    return res.status(400).json({ error: "Missing sessionId" });
  }

  const nodeFrom: NodeId = currentNode ?? DEFAULT_NODE;
  const nodeConfig = NODES[nodeFrom];

  if (!nodeConfig) {
    return res.status(500).json({ error: "Invalid node state" });
  }

  /* =====================
     RESOLVE INTENT
  ===================== */

  let resolvedIntent = null;

  if (chip) {
    resolvedIntent = {
      kind: "CHIP" as const,
      chipId: chip,
    };
  } else if (text) {
    resolvedIntent = resolveFreeTextIntent(text, nodeConfig);
  }

  /* =====================
     DECIDE ACTION
  ===================== */

  const action = decideAction(resolvedIntent, nodeConfig);

  /* =====================
     APPLY ACTION
  ===================== */

  let nodeTo: NodeId = nodeFrom;

  if (action.type === "NODE_HOP") {
    nodeTo = action.to as NodeId;
  }

  const nextNodeConfig = NODES[nodeTo];

  if (!nextNodeConfig) {
    return res.status(500).json({ error: "Invalid next node" });
  }

  /* =====================
     RESPONSE PAYLOAD
  ===================== */

  const responsePayload = {
    node: nodeTo,
    kind: nextNodeConfig.kind,
    message: nextNodeConfig.message,
    chips: nextNodeConfig.chips,
    terminal: nextNodeConfig.terminal ?? false,
  };

  /* =====================
     LOGGING (TURN)
  ===================== */

  const logEntry: TurnLog = {
    timestamp: new Date().toISOString(),
    session_id: sessionId,
    node_from: nodeFrom,
    node_to: nodeTo,
    raw_text: text ?? null,
    chip_explicit: chip ?? null,
    chip_simulated:
      resolvedIntent?.kind === "CHIP" && !chip
        ? resolvedIntent.chipId
        : null,
    resolved_intent: resolvedIntent?.kind ?? null,
    action: action.type,
    latency_ms: Date.now() - startedAt,
  };

  await writeTurnLog(logEntry);

  /* =====================
     POST-ANALYSIS (ASYNC, FAIL-SILENT)
  ===================== */

  try {
    writePostAnalysis({
      session_id: sessionId,
      turn_id: Date.now(),
      chip,
      analysis: {
        scope_match: true,
        ambiguity_level: "low",
      },
      hypotheses: [],
      flags: {
        medical_risk: false,
        off_scope: false,
      },
      meta: {
        model_version: "v10.3",
        analysis_version: "v1",
      },
    });
  } catch {
    /* intentionally silent */
  }

  /* =====================
     RESPONSE
  ===================== */

  return res.status(200).json(responsePayload);
}
