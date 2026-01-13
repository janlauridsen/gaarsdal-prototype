import type { NextApiRequest, NextApiResponse } from "next";

import { Chip } from "../../guided-chat/chips";
import { NodeId, ROUTES } from "../../guided-chat/node-router";
import { NODES } from "../../guided-chat/nodes";
import { mapFreeTextToChip } from "../../guided-chat/free-text-router";

import { writeTurnLog } from "../../logging/logWriter";
import { TurnLog } from "../../logging/log.types";

import { runPostAnalysis } from "../../postanalysis/postanalysis";

/* =====================
   CONFIG
===================== */

const DEFAULT_NODE: NodeId = "ROOT";

/* =====================
   HELPERS
===================== */

function resolveNextNode(
  current: NodeId,
  chip: Chip
): NodeId {
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
    sessionId: string;
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
     LOGGING
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
     POST-ANALYSIS (ASYNC)
     – NO SIDE EFFECTS
  ===================== */

  runPostAnalysis({
    session_id: sessionId,
    turn_id: Date.now(),
    chip: resolvedChip ?? null,
    node_from: nodeFrom,
    node_to: nodeTo,
    free_text: text ?? null,
  }).catch(() => {
    /* fail-silent by design */
  });

  /* =====================
     RESPONSE
  ===================== */

  return res.status(200).json(responsePayload);
}
