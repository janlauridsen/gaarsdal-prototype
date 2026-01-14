import type { NextApiRequest, NextApiResponse } from "next";

import { NODES, NodeConfig } from "../../guided-chat/nodes";
import { NodeId, ROUTES } from "../../guided-chat/node-router";

import { resolveFreeTextSignal } from "../../guided-chat/free-text-router";
import { decideActionFromSignal } from "../../guided-chat/engine";

import { writeTurnLog } from "../../guided-chat/logging/logWriter";
import { TurnLog } from "../../guided-chat/logging/log.types";

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
    text,
    chip,
  }: {
    sessionId?: string;
    currentNode?: NodeId;
    text?: string;
    chip?: string;
  } = req.body ?? {};

  if (!sessionId) {
    return res.status(400).json({ error: "Missing sessionId" });
  }

  const nodeFrom: NodeId = currentNode ?? DEFAULT_NODE;
  const nodeConfig: NodeConfig | undefined = NODES[nodeFrom];

  if (!nodeConfig) {
    return res.status(500).json({ error: "Invalid node" });
  }

  /* =====================
     ACTION RESOLUTION
  ===================== */

  let action:
    | { type: "NODE_HOP"; to: NodeId }
    | { type: "OPEN_PARENTESE"; to: NodeId }
    | { type: "REQUEST_NEW_SESSION_CONFIRMATION" }
    | { type: "FALLBACK" };

  let resolvedSignal: any = null;

  /* ---------- CHIP (explicit) ---------- */
  if (chip) {
    if (nodeConfig.chips?.includes(chip)) {
      const next =
        ROUTES[nodeFrom]?.[chip] ?? nodeFrom;

      action = { type: "NODE_HOP", to: next };
    } else {
      // Ugyldig chip i denne node
      action = { type: "FALLBACK" };
    }

  /* ---------- FREE TEXT ---------- */
  } else if (text) {
    const signalResult = resolveFreeTextSignal(text, nodeConfig);
    resolvedSignal = signalResult;

    action = decideActionFromSignal(signalResult, nodeConfig);

  /* ---------- NOTHING ---------- */
  } else {
    action = { type: "FALLBACK" };
  }

  /* =====================
     NODE TRANSITION
  ===================== */

  let nodeTo: NodeId = nodeFrom;
  let responseMessage: string | null = null;
  let responseChips: string[] | null = null;

  switch (action.type) {
    case "NODE_HOP":
      nodeTo = action.to;
      break;

    case "OPEN_PARENTESE":
      nodeTo = action.to;
      responseChips = ["Tilbage til samtalen"];
      break;

    case "REQUEST_NEW_SESSION_CONFIRMATION":
      responseMessage =
        "Det lyder som et nyt emne.\nVil du starte en ny samtale om dette, eller fortsætte her?";
      responseChips = ["Start ny samtale", "Fortsæt her"];
      break;

    case "FALLBACK":
    default:
      break;
  }

  const nextNodeConfig = NODES[nodeTo];
  if (!nextNodeConfig) {
    return res.status(500).json({ error: "Invalid next node" });
  }

  /* =====================
     RESPONSE PAYLOAD
  ===================== */

  const payload = {
    node: nodeTo,
    kind: nextNodeConfig.kind,
    message:
      responseMessage ??
      nextNodeConfig.message,
    chips:
      responseChips ??
      nextNodeConfig.chips,
  };

  /* =====================
     LOGGING
  ===================== */

  const logEntry: TurnLog = {
    timestamp: new Date().toISOString(),
    session_id: sessionId,
    node_from: nodeFrom,
    node_to: nodeTo,
    raw_text: text ?? null,
    chip_explicit: chip ?? null,
    signal: resolvedSignal?.signal?.type ?? null,
    action: action.type,
    latency_ms: Date.now() - startedAt,
  };

  await writeTurnLog(logEntry);

  /* =====================
     RESPONSE
  ===================== */

  return res.status(200).json(payload);
}
