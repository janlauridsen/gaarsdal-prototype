import type { NextApiRequest, NextApiResponse } from "next";

import { Chip } from "../../guided-chat/chips";
import { NodeId, ROUTES } from "../../guided-chat/node-router";
import { NODES } from "../../guided-chat/nodes";
import { mapFreeTextToChip } from "../../guided-chat/free-text-router";

import { writeTurnLog } from "../../guided-chat/logging/logWriter";
import { TurnLog } from "../../guided-chat/logging/log.types";

import { writePostAnalysis } from "../../guided-chat/postanalysis/postanalysis";

/* =====================
   CONFIG
===================== */

const DEFAULT_NODE: NodeId = "ROOT";

/* =====================
   HELPERS
===================== */

function resolveNextNode(current: NodeId, chip: Chip): NodeId {
  const route = ROUTES[current];
  return route?.[chip] ?? current;
}

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

  /* =====================
     CHIP RESOLUTION
  ===================== */

  let resolvedChip: Chip | null = chip ?? null;
  let simulatedChip: Chip | null = null;

  if (!resolvedChip && text) {
    const simulated = mapFreeTextToChip(text, nodeFrom);
    if (simulated) {
      resolvedChip = simulated;
      simulatedChip = simulated;
    }
  }

  /* =====================
     NODE TRANSITION
  ===================== */

  let nodeTo: NodeId = nodeFrom;

  if (resolvedChip) {
    nodeTo = resolveNextNode(nodeFrom, resolvedChip);
  }

  const nodeConfig = NODES[nodeTo];

  if (!nodeConfig) {
    return res.status(500).json({ error: "Invalid node state" });
  }

  /* =====================
     RESPONSE PAYLOAD
  ===================== */

  const responsePayload = {
    node: nodeTo,
    kind: nodeConfig.kind ?? "MENU",
    message: nodeConfig.message,
    chips: nodeConfig.chips,
    terminal: nodeConfig.terminal ?? false,
  };

  /* =====================
     LOGGING (TURN)
  ===================== */

  const logEntry: TurnLog = {
    timestamp: new Date().toISOString(),
    session_id: sessionId,
    node_from: nodeFrom,
    node_to: nodeTo,
    chip_explicit: chip ?? null,
    chip_simulated: simulatedChip,
    free_text: text ?? null,
    latency_ms: Date.now() - startedAt,
  };

  await writeTurnLog(logEntry);

  /* =====================
     POST-ANALYSIS (SYNC, FAIL-SILENT)
  ===================== */

  try {
    writePostAnalysis({
      session_id: sessionId,
      turn_id: Date.now(),
      chip: resolvedChip,
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
        model_version: "v10.0",
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
